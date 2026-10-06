import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError } from '@event-os/config';
import { notificationService } from '../services/notification.service';
import { validateCreateNotificationInput } from '../validations/notification.validation';

export class NotificationController {
  public async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = validateCreateNotificationInput(req.body);
      const notification = await notificationService.createNotification(validatedData);
      sendSuccess(res, notification, 'Notification created successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async broadcastNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.broadcastNotification(req.body);
      sendSuccess(res, result, 'Broadcast notification dispatched successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await notificationService.getUserNotifications(
        req.user.userId,
        isRead,
        page,
        limit
      );
      sendSuccess(res, result, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await notificationService.markAsRead(id, req.user.userId);
      sendSuccess(res, updated, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  public async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const result = await notificationService.markAllAsRead(req.user.userId);
      sendSuccess(res, result, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  public async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const result = await notificationService.getUnreadCount(req.user.userId);
      sendSuccess(res, result, 'Unread notification count retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
