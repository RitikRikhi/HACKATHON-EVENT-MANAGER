import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@event-os/config';

export const forwardAuthHeader = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          req.headers['x-user-id'] = decoded.userId;
          req.headers['x-user-email'] = decoded.email;
          req.headers['x-user-role'] = decoded.role;
        }
      } catch (err) {
        // If token is invalid or expired, continue without attaching x-user headers.
        // Downstream protected endpoints will validate and return 401.
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
