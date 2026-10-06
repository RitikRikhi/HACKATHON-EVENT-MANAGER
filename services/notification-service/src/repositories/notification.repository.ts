import { supabase, AppError } from '@event-os/config';
import { Notification, NotificationType } from '@event-os/types';

export class NotificationRepository {
  private tableName = 'notifications';

  public async createNotification(data: {
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, unknown>;
  }): Promise<Notification> {
    const { data: result, error } = await supabase.client
      .from(this.tableName)
      .insert({
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        metadata: data.metadata || {},
        is_read: false,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating notification: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as Notification;
  }

  public async createBulkNotifications(
    notifications: Array<{
      user_id: string;
      title: string;
      message: string;
      type: NotificationType;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void> {
    if (notifications.length === 0) return;

    const { error } = await supabase.client.from(this.tableName).insert(
      notifications.map((n) => ({
        user_id: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        metadata: n.metadata || {},
        is_read: false,
      }))
    );

    if (error) {
      throw new AppError(`Database error creating bulk notifications: ${error.message}`, 500, 'DB_ERROR', error);
    }
  }

  public async findByUser(
    userId: string,
    isRead?: boolean,
    limit = 20,
    offset = 0
  ): Promise<{ notifications: Notification[]; total: number }> {
    let query = supabase.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (isRead !== undefined) {
      query = query.eq('is_read', isRead);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error retrieving notifications: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return {
      notifications: (data as Notification[]) || [],
      total: count || 0,
    };
  }

  public async markAsRead(id: string, userId: string): Promise<Notification> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error marking notification as read: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Notification;
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select('id');

    if (error) {
      throw new AppError(`Database error marking all as read: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data || []).length;
  }

  public async countUnread(userId: string): Promise<number> {
    const { count, error } = await supabase.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new AppError(`Database error counting unread notifications: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return count || 0;
  }
}

export const notificationRepository = new NotificationRepository();
