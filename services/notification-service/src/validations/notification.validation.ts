import { BadRequestError } from '@event-os/config';
import { CreateNotificationDTO, NotificationType } from '@event-os/types';

export const validateCreateNotificationInput = (data: Partial<CreateNotificationDTO>): CreateNotificationDTO => {
  const { userId, title, message, type, metadata } = data;

  if (!userId || typeof userId !== 'string') {
    throw new BadRequestError('A valid userId (UUID) is required.');
  }

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    throw new BadRequestError('Notification title is required.');
  }

  if (!message || typeof message !== 'string' || message.trim().length < 2) {
    throw new BadRequestError('Notification message is required.');
  }

  if (type && !Object.values(NotificationType).includes(type)) {
    throw new BadRequestError(`Invalid notification type. Allowed: ${Object.values(NotificationType).join(', ')}`);
  }

  return {
    userId: userId.trim(),
    title: title.trim(),
    message: message.trim(),
    type: type || NotificationType.INFO,
    metadata: metadata || {},
  };
};
