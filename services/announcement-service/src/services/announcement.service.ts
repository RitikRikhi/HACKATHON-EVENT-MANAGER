import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  logAudit,
} from '@event-os/config';
import {
  Announcement,
  CreateAnnouncementDTO,
  UpdateAnnouncementDTO,
  AnnouncementPriority,
  UserRole,
  PaginatedResponse,
  ChatMessage,
  Question,
  Poll,
} from '@event-os/types';
import { announcementRepository } from '../repositories/announcement.repository';

export class AnnouncementService {
  // ---------------------------------------------------------------------------
  // ANNOUNCEMENTS
  // ---------------------------------------------------------------------------

  public async createAnnouncement(
    dto: CreateAnnouncementDTO,
    userId: string
  ): Promise<Announcement> {
    const announcement = await announcementRepository.createAnnouncement({
      title: dto.title,
      content: dto.content,
      priority: dto.priority || AnnouncementPriority.NORMAL,
      pinned: dto.pinned || false,
      event_id: dto.eventId,
      created_by: userId,
    });

    if (dto.eventId) {
      await logAudit(dto.eventId, userId, 'ANNOUNCEMENT_CREATED', {
        title: dto.title,
        priority: dto.priority,
        pinned: dto.pinned,
      });
    }

    return announcement;
  }

  public async getAnnouncementById(id: string): Promise<Announcement> {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      throw new NotFoundError(`Announcement with ID ${id} not found.`);
    }
    return announcement;
  }

  public async listAnnouncements(params: {
    eventId?: string;
    priority?: AnnouncementPriority;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Announcement>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const { announcements, total } = await announcementRepository.listAnnouncements({
      eventId: params.eventId,
      priority: params.priority,
      limit,
      offset,
    });

    return {
      items: announcements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async updateAnnouncement(
    id: string,
    dto: UpdateAnnouncementDTO,
    userId: string,
    userRole: UserRole
  ): Promise<Announcement> {
    const existing = await announcementRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Announcement with ID ${id} not found.`);
    }

    const isOwner = existing.created_by === userId;
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isOwner && !isElevated) {
      throw new ForbiddenError('You do not have permission to update this announcement.');
    }

    const updated = await announcementRepository.updateAnnouncement(id, {
      title: dto.title,
      content: dto.content,
      priority: dto.priority,
      pinned: dto.pinned,
    });

    if (existing.event_id) {
      await logAudit(existing.event_id, userId, 'ANNOUNCEMENT_UPDATED', { id });
    }

    return updated;
  }

  public async deleteAnnouncement(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
    const existing = await announcementRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Announcement with ID ${id} not found.`);
    }

    const isOwner = existing.created_by === userId;
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isOwner && !isElevated) {
      throw new ForbiddenError('You do not have permission to delete this announcement.');
    }

    if (existing.event_id) {
      await logAudit(existing.event_id, userId, 'ANNOUNCEMENT_DELETED', { id, title: existing.title });
    }

    return await announcementRepository.deleteAnnouncement(id);
  }

  // ---------------------------------------------------------------------------
  // COMMUNITY CHAT
  // ---------------------------------------------------------------------------

  public async sendChatMessage(eventId: string, userId: string, channel: string, body: string): Promise<ChatMessage> {
    if (!body || body.trim().length === 0) {
      throw new BadRequestError('Message body cannot be empty.');
    }

    const isMuted = await announcementRepository.isUserMutedInChat(eventId, userId);
    if (isMuted) {
      throw new ForbiddenError('You have been muted in the event chat by an organizer.');
    }

    return await announcementRepository.createChatMessage({
      event_id: eventId,
      channel: channel || 'general',
      participant_id: userId,
      body: body.trim(),
    });
  }

  public async listChatMessages(eventId: string, channel = 'general', page = 1, limit = 50): Promise<PaginatedResponse<ChatMessage>> {
    const offset = (page - 1) * limit;
    const { messages, total } = await announcementRepository.listChatMessages(eventId, channel, limit, offset);

    return {
      items: messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async deleteChatMessage(messageId: string, eventId: string, userId: string, userRole: UserRole): Promise<void> {
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!isElevated) {
      throw new ForbiddenError('Only organizers and admins can moderate chat messages.');
    }

    await announcementRepository.deleteChatMessage(messageId);
    await logAudit(eventId, userId, 'CHAT_MESSAGE_DELETED', { messageId });
  }

  public async muteUserInChat(
    eventId: string,
    targetUserId: string,
    durationMinutes: number,
    reason: string | undefined,
    moderatorId: string,
    moderatorRole: UserRole
  ): Promise<void> {
    const isElevated = moderatorRole === UserRole.ADMIN || moderatorRole === UserRole.SUPER_ADMIN;
    if (!isElevated) {
      throw new ForbiddenError('Only organizers and admins can mute users in chat.');
    }

    await announcementRepository.muteUserInChat(eventId, targetUserId, durationMinutes, reason);
    await logAudit(eventId, moderatorId, 'CHAT_USER_MUTED', { targetUserId, durationMinutes, reason });
  }

  // ---------------------------------------------------------------------------
  // QUESTIONS (Q&A)
  // ---------------------------------------------------------------------------

  public async askQuestion(eventId: string, userId: string, body: string): Promise<Question> {
    if (!body || body.trim().length === 0) {
      throw new BadRequestError('Question body cannot be empty.');
    }

    return await announcementRepository.createQuestion(eventId, userId, body.trim());
  }

  public async listQuestions(eventId: string, userId?: string): Promise<Question[]> {
    return await announcementRepository.listQuestions(eventId, userId);
  }

  public async upvoteQuestion(questionId: string, userId: string): Promise<{ upvotes: number }> {
    const upvotes = await announcementRepository.upvoteQuestion(questionId, userId);
    return { upvotes };
  }

  public async answerQuestion(
    questionId: string,
    eventId: string,
    answer: string,
    userId: string,
    userRole: UserRole
  ): Promise<Question> {
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN || userRole === UserRole.TEAM_LEAD;
    if (!isElevated) {
      throw new ForbiddenError('Only authorized staff or organizers can post official answers.');
    }

    const updated = await announcementRepository.answerQuestion(questionId, answer, userId);
    await logAudit(eventId, userId, 'QUESTION_ANSWERED', { questionId });
    return updated;
  }

  // ---------------------------------------------------------------------------
  // POLLS
  // ---------------------------------------------------------------------------

  public async createPoll(
    eventId: string,
    question: string,
    options: string[],
    userId: string,
    userRole: UserRole
  ): Promise<Poll> {
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!isElevated) {
      throw new ForbiddenError('Only organizers and admins can create polls.');
    }

    if (!options || options.length < 2) {
      throw new BadRequestError('A poll must have at least 2 options.');
    }

    const poll = await announcementRepository.createPoll(eventId, question, options, userId);
    await logAudit(eventId, userId, 'POLL_CREATED', { question, optionsCount: options.length });
    return poll;
  }

  public async listPolls(eventId: string, userId?: string): Promise<Poll[]> {
    return await announcementRepository.listPolls(eventId, userId);
  }

  public async votePoll(pollId: string, optionId: string, userId: string): Promise<{ success: boolean; message: string }> {
    await announcementRepository.votePoll(pollId, optionId, userId);
    return { success: true, message: 'Vote recorded successfully.' };
  }

  public async closePoll(pollId: string, eventId: string, userId: string, userRole: UserRole): Promise<void> {
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!isElevated) {
      throw new ForbiddenError('Only organizers can close polls.');
    }

    await announcementRepository.closePoll(pollId);
    await logAudit(eventId, userId, 'POLL_CLOSED', { pollId });
  }
}

export const announcementService = new AnnouncementService();
