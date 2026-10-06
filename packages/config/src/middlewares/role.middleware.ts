import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@event-os/types';
import { ForbiddenError, UnauthorizedError } from '../errors';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User must be authenticated to perform this action.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: required role (${allowedRoles.join(', ')}), but current user is (${req.user.role}).`
        )
      );
    }

    next();
  };
};
