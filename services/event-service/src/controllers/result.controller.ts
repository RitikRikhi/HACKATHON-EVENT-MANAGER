import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { ResultStatus } from '@event-os/types';
import { resultService } from '../services/result.service';

export class ResultController {
  // ---------------------------------------------------------------------------
  // SCORES
  // ---------------------------------------------------------------------------

  public async submitScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const eventId = (req.body.eventId || req.params.eventId) as string;
      const { teamId, criteria, feedback } = req.body;
      if (!eventId || !teamId || !criteria) {
        throw new BadRequestError('eventId, teamId, and criteria are required.');
      }

      const score = await resultService.submitScore(
        eventId,
        { teamId, criteria, feedback },
        req.user.userId,
        req.user.role
      );

      sendSuccess(res, score, 'Score submitted successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const eventId = (req.query.eventId || req.params.eventId) as string;
      if (!eventId) throw new BadRequestError('eventId is required.');

      const scores = await resultService.listEventScores(eventId, req.user.userId, req.user.role);
      sendSuccess(res, scores, 'Scores retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // RESULTS
  // ---------------------------------------------------------------------------

  public async getEventResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.query.eventId || req.params.eventId) as string;
      if (!eventId) throw new BadRequestError('eventId is required.');

      const result = await resultService.getEventResult(eventId, req.user?.userId, req.user?.role);
      sendSuccess(res, result, 'Results retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async publishResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const eventId = (req.body.eventId || req.params.eventId) as string;
      const status = (req.body.status || ResultStatus.PUBLISHED) as ResultStatus;
      const payload = req.body.payload || {};

      if (!eventId) throw new BadRequestError('eventId is required.');

      const result = await resultService.saveOrPublishResult(
        eventId,
        status,
        payload,
        req.user.userId,
        req.user.role
      );

      sendSuccess(res, result, `Results ${status.toLowerCase()} successfully`);
    } catch (error) {
      next(error);
    }
  }
}

export const resultController = new ResultController();
