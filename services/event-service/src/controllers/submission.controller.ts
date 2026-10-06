import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { submissionService } from '../services/submission.service';

export class SubmissionController {
  public async submitProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const { eventId, teamId, repoUrl, demoUrl, description, fileUrl, lock } = req.body;
      if (!eventId || !teamId || !repoUrl) {
        throw new BadRequestError('eventId, teamId, and repoUrl are required.');
      }

      const submission = await submissionService.submitProject(
        eventId,
        teamId,
        { repoUrl, demoUrl, description, fileUrl, lock },
        req.user.userId,
        req.user.role
      );

      sendSuccess(res, submission, 'Project submitted successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async getTeamSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.query.eventId as string;
      const teamId = (req.query.teamId || req.params.teamId) as string;
      if (!eventId || !teamId) throw new BadRequestError('eventId and teamId are required.');

      const submission = await submissionService.getSubmissionByTeam(eventId, teamId);
      sendSuccess(res, submission, 'Submission retrieved');
    } catch (error) {
      next(error);
    }
  }

  public async listEventSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.query.eventId || req.params.eventId) as string;
      if (!eventId) throw new BadRequestError('eventId is required.');

      const submissions = await submissionService.listEventSubmissions(eventId);
      sendSuccess(res, submissions, 'Event submissions retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const submissionController = new SubmissionController();
