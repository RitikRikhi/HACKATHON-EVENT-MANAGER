import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { RemarkStatus } from '@event-os/types';
import { remarkService } from '../services/remark.service';

export class RemarkController {
  public async createRemark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const { eventId, teamId, title, description } = req.body;
      if (!eventId || !teamId || !title || !description) {
        throw new BadRequestError('eventId, teamId, title, and description are required.');
      }

      const remark = await remarkService.createRemark(eventId, teamId, title, description, req.user.userId);
      sendSuccess(res, remark, 'Remark raised successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listRemarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const eventId = (req.query.eventId || req.params.eventId) as string;
      if (!eventId) throw new BadRequestError('eventId is required.');

      const remarks = await remarkService.listRemarks(eventId, req.user.userId, req.user.role);
      sendSuccess(res, remarks, 'Remarks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async resolveRemark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, resolutionNotes } = req.body;
      if (!status) throw new BadRequestError('status is required.');

      const resolved = await remarkService.resolveRemark(
        id,
        status as RemarkStatus,
        resolutionNotes,
        req.user.userId,
        req.user.role
      );

      sendSuccess(res, resolved, 'Remark resolved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const remarkController = new RemarkController();
