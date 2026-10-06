import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { AnnouncementPriority, UserRole } from '@event-os/types';
import { announcementService } from '../services/announcement.service';
import {
  validateCreateAnnouncementInput,
  validateUpdateAnnouncementInput,
} from '../validations/announcement.validation';

export class AnnouncementController {
  // ---------------------------------------------------------------------------
  // ANNOUNCEMENTS
  // ---------------------------------------------------------------------------

  public async listAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.query.eventId as string | undefined;
      const priority = req.query.priority as AnnouncementPriority | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await announcementService.listAnnouncements({
        eventId,
        priority,
        page,
        limit,
      });

      sendSuccess(res, result, 'Announcements retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getAnnouncementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const announcement = await announcementService.getAnnouncementById(id);
      sendSuccess(res, announcement, 'Announcement retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const validatedData = validateCreateAnnouncementInput(req.body);
      const announcement = await announcementService.createAnnouncement(validatedData, req.user.userId);
      sendSuccess(res, announcement, 'Announcement created successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async updateAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = validateUpdateAnnouncementInput(req.body);
      const updated = await announcementService.updateAnnouncement(
        id,
        validatedData,
        req.user.userId,
        req.user.role
      );
      sendSuccess(res, updated, 'Announcement updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public async deleteAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await announcementService.deleteAnnouncement(id, req.user.userId, req.user.role);
      sendSuccess(res, { deleted: true }, 'Announcement deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // COMMUNITY CHAT
  // ---------------------------------------------------------------------------

  public async sendChatMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const eventId = (req.body.eventId || req.params.eventId) as string;
      const channel = req.body.channel || 'general';
      const body = req.body.body as string;

      if (!eventId || !body) throw new BadRequestError('eventId and body are required.');

      const message = await announcementService.sendChatMessage(eventId, req.user.userId, channel, body);
      sendSuccess(res, message, 'Chat message sent', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listChatMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.query.eventId || req.params.eventId) as string;
      const channel = (req.query.channel as string) || 'general';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      if (!eventId) throw new BadRequestError('eventId query parameter is required.');

      const messages = await announcementService.listChatMessages(eventId, channel, page, limit);
      sendSuccess(res, messages, 'Chat messages retrieved');
    } catch (error) {
      next(error);
    }
  }

  public async deleteChatMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const eventId = req.body.eventId as string;

      await announcementService.deleteChatMessage(messageId, eventId, req.user.userId, req.user.role);
      sendSuccess(res, { deleted: true }, 'Chat message removed');
    } catch (error) {
      next(error);
    }
  }

  public async muteUserInChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const { eventId, targetUserId, durationMinutes = 60, reason } = req.body;
      if (!eventId || !targetUserId) throw new BadRequestError('eventId and targetUserId are required.');

      await announcementService.muteUserInChat(
        eventId,
        targetUserId,
        Number(durationMinutes),
        reason,
        req.user.userId,
        req.user.role
      );
      sendSuccess(res, { muted: true }, 'User muted in chat successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // QUESTIONS (Q&A)
  // ---------------------------------------------------------------------------

  public async askQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const { eventId, body } = req.body;
      if (!eventId || !body) throw new BadRequestError('eventId and body are required.');

      const question = await announcementService.askQuestion(eventId, req.user.userId, body);
      sendSuccess(res, question, 'Question submitted successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.query.eventId || req.params.eventId) as string;
      if (!eventId) throw new BadRequestError('eventId is required.');

      const questions = await announcementService.listQuestions(eventId, req.user?.userId);
      sendSuccess(res, questions, 'Questions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async upvoteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const questionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const result = await announcementService.upvoteQuestion(questionId, req.user.userId);
      sendSuccess(res, result, 'Question upvoted successfully');
    } catch (error) {
      next(error);
    }
  }

  public async answerQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const questionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { eventId, answer } = req.body;
      if (!answer) throw new BadRequestError('answer is required.');

      const updated = await announcementService.answerQuestion(
        questionId,
        eventId,
        answer,
        req.user.userId,
        req.user.role
      );
      sendSuccess(res, updated, 'Question answered successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // POLLS
  // ---------------------------------------------------------------------------

  public async createPoll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const { eventId, question, options } = req.body;
      if (!eventId || !question || !Array.isArray(options)) {
        throw new BadRequestError('eventId, question, and options array are required.');
      }

      const poll = await announcementService.createPoll(eventId, question, options, req.user.userId, req.user.role);
      sendSuccess(res, poll, 'Poll created successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listPolls(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.query.eventId || req.params.eventId) as string;
      if (!eventId) throw new BadRequestError('eventId is required.');

      const polls = await announcementService.listPolls(eventId, req.user?.userId);
      sendSuccess(res, polls, 'Polls retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async votePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const pollId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { optionId } = req.body;
      if (!optionId) throw new BadRequestError('optionId is required.');

      const result = await announcementService.votePoll(pollId, optionId, req.user.userId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  public async closePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const pollId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { eventId } = req.body;

      await announcementService.closePoll(pollId, eventId, req.user.userId, req.user.role);
      sendSuccess(res, { closed: true }, 'Poll closed successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getHealth(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, { status: 'Operational', service: 'announcement-service', timestamp: new Date().toISOString() });
  }
}

export const announcementController = new AnnouncementController();
