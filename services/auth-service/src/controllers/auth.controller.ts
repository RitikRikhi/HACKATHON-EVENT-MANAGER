import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { UserRole } from '@event-os/types';
import { authService } from '../services/auth.service';
import {
  validateRegisterInput,
  validateLoginInput,
  validateUpdateProfileInput,
  validateChangePasswordInput,
} from '../validations/auth.validation';

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateRegisterInput(req.body);
      const result = await authService.register(validatedData);
      sendSuccess(res, result, 'User registered successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateLoginInput(req.body);
      const clientIp = req.ip || req.socket.remoteAddress;
      const result = await authService.login(validatedData, clientIp);
      sendSuccess(res, result, 'Login successful', HttpStatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication token required.');
      }
      const profile = await authService.getProfile(req.user.userId);
      sendSuccess(res, profile, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication token required.');
      }
      const validatedData = validateUpdateProfileInput(req.body);
      const updatedProfile = await authService.updateProfile(req.user.userId, validatedData);
      sendSuccess(res, updatedProfile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication token required.');
      }
      const validatedData = validateChangePasswordInput(req.body);
      const result = await authService.changePassword(req.user.userId, validatedData);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await authService.getUserById(id);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const result = await authService.listUsers(page, limit);
      sendSuccess(res, result, 'Users list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { role } = req.body;

      if (!role || !Object.values(UserRole).includes(role)) {
        throw new BadRequestError(`Invalid role provided. Allowed roles: ${Object.values(UserRole).join(', ')}`);
      }

      const updatedUser = await authService.updateUserRole(id, role as UserRole);
      sendSuccess(res, updatedUser, `User role updated to ${role} successfully`);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
