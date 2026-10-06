import { Request, Response, NextFunction } from 'express';
import { AuthTokenPayload, UserRole } from '@event-os/types';
import { verifyToken } from '../jwt';
import { UnauthorizedError } from '../errors';

// Augment Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // 1. Check direct Authorization Bearer token header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      req.user = decoded;
      return next();
    }

    // 2. Check Gateway-forwarded headers (trusted proxy headers)
    const forwardedUserId = req.headers['x-user-id'] as string;
    const forwardedEmail = req.headers['x-user-email'] as string;
    const forwardedRole = req.headers['x-user-role'] as UserRole;

    if (forwardedUserId && forwardedEmail && forwardedRole) {
      req.user = {
        userId: forwardedUserId,
        email: forwardedEmail,
        role: forwardedRole,
      };
      return next();
    }

    throw new UnauthorizedError('Authentication token is missing or invalid.');
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid authentication token.'));
    }
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Authentication token has expired.'));
    }
    return next(error);
  }
};

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      req.user = decoded;
      return next();
    }

    const forwardedUserId = req.headers['x-user-id'] as string;
    const forwardedEmail = req.headers['x-user-email'] as string;
    const forwardedRole = req.headers['x-user-role'] as UserRole;

    if (forwardedUserId && forwardedEmail && forwardedRole) {
      req.user = {
        userId: forwardedUserId,
        email: forwardedEmail,
        role: forwardedRole,
      };
    }
    return next();
  } catch {
    // Ignore error for optional auth and proceed without req.user
    return next();
  }
};
