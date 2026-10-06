import { supabase, NotFoundError } from '@event-os/config';
import {
  Notification,
  CreateNotificationDTO,
  NotificationType,
  PaginatedResponse,
} from '@event-os/types';
import { notificationRepository } from '../repositories/notification.repository';

export class NotificationService {
  public async createNotification(dto: CreateNotificationDTO): Promise<Notification> {
    return await notificationRepository.createNotification({
      user_id: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type || NotificationType.INFO,
      metadata: dto.metadata || {},
    });
  }

  public async broadcastNotification(payload: {
    title: string;
    message: string;
    type?: NotificationType;
    metadata?: Record<string, unknown>;
  }): Promise<{ sentCount: number }> {
    // Get all user IDs from Supabase
    const { data: users } = await supabase.client.from('users').select('id');
    if (!users || users.length === 0) {
      return { sentCount: 0 };
    }

    const notifications = users.map((u) => ({
      user_id: u.id,
      title: payload.title,
      message: payload.message,
      type: payload.type || NotificationType.INFO,
      metadata: payload.metadata || {},
    }));

    await notificationRepository.createBulkNotifications(notifications);
    return { sentCount: notifications.length };
  }

  public async getUserNotifications(
    userId: string,
    isRead?: boolean,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Notification>> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const { notifications, total } = await notificationRepository.findByUser(
      userId,
      isRead,
      limitNum,
      offset
    );

    return {
      items: notifications,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  public async markAsRead(id: string, userId: string): Promise<Notification> {
    try {
      return await notificationRepository.markAsRead(id, userId);
    } catch {
      throw new NotFoundError(`Notification with ID ${id} not found or not owned by user.`);
    }
  }

  public async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    const count = await notificationRepository.markAllAsRead(userId);
    return { markedCount: count };
  }

  public async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const count = await notificationRepository.countUnread(userId);
    return { unreadCount: count };
  }
}

export const notificationService = new NotificationService();
