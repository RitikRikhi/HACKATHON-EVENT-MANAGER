import { BadRequestError } from '@event-os/config';
import { CreateAnnouncementDTO, UpdateAnnouncementDTO, AnnouncementPriority } from '@event-os/types';

export const validateCreateAnnouncementInput = (data: Partial<CreateAnnouncementDTO>): CreateAnnouncementDTO => {
  const { title, content, priority, eventId } = data;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    throw new BadRequestError('Announcement title is required and must be at least 2 characters long.');
  }

  if (!content || typeof content !== 'string' || content.trim().length < 5) {
    throw new BadRequestError('Announcement content is required and must be at least 5 characters long.');
  }

  if (priority && !Object.values(AnnouncementPriority).includes(priority)) {
    throw new BadRequestError(`Invalid priority. Allowed priorities: ${Object.values(AnnouncementPriority).join(', ')}`);
  }

  return {
    title: title.trim(),
    content: content.trim(),
    priority: priority || AnnouncementPriority.NORMAL,
    eventId: eventId ? eventId.trim() : undefined,
  };
};

export const validateUpdateAnnouncementInput = (data: Partial<UpdateAnnouncementDTO>): UpdateAnnouncementDTO => {
  const { title, content, priority } = data;
  const updateData: UpdateAnnouncementDTO = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 2) {
      throw new BadRequestError('Title must be at least 2 characters long.');
    }
    updateData.title = title.trim();
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length < 5) {
      throw new BadRequestError('Content must be at least 5 characters long.');
    }
    updateData.content = content.trim();
  }

  if (priority !== undefined) {
    if (!Object.values(AnnouncementPriority).includes(priority)) {
      throw new BadRequestError(`Invalid priority. Allowed: ${Object.values(AnnouncementPriority).join(', ')}`);
    }
    updateData.priority = priority;
  }

  return updateData;
};
