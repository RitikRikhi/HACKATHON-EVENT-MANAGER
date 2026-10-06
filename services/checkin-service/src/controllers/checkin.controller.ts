import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { ScanType } from '@event-os/types';
import { checkinService } from '../services/checkin.service';

export class CheckinController {
  public async processCheckIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const checkedInBy = req.user?.userId || (req.headers['x-user-id'] as string) || 'organizer';
      const scanType = (req.body.type || ScanType.CHECKIN) as ScanType;
      const result = await checkinService.processCheckIn(req.body, checkedInBy, scanType);
      sendSuccess(res, result, 'Check-in processed successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async scanQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scannedBy = req.user?.userId || (req.headers['x-user-id'] as string) || 'organizer';
      const { qrString, eventId, type, idempotencyKey } = req.body;
      if (!qrString || !eventId) {
        throw new BadRequestError('qrString and eventId are required.');
      }

      const scanType = (type || ScanType.CHECKIN) as ScanType;
      const result = await checkinService.processCheckIn(
        { qrString, eventId, idempotencyKey },
        scannedBy,
        scanType
      );
      sendSuccess(res, result, `${scanType} scan successful`, HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async syncOfflineScans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const syncedBy = req.user?.userId || (req.headers['x-user-id'] as string) || 'scanner';
      const { eventId, scans } = req.body;
      if (!eventId || !Array.isArray(scans)) {
        throw new BadRequestError('eventId and scans array are required.');
      }

      const result = await checkinService.syncOfflineScans(req.body, syncedBy);
      sendSuccess(res, result, 'Offline scans synchronized successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getEventOfflineRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
      const roster = await checkinService.getEventOfflineRoster(eventId);
      sendSuccess(res, roster, 'Offline roster retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async reconcilePrintedRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reconciledBy = req.user?.userId || (req.headers['x-user-id'] as string) || 'organizer';
      const { eventId, participantIds, type } = req.body;
      if (!eventId || !Array.isArray(participantIds)) {
        throw new BadRequestError('eventId and participantIds array are required.');
      }

      const result = await checkinService.reconcilePrintedRoster(
        { eventId, participantIds, type },
        reconciledBy
      );
      sendSuccess(res, result, 'Printed roster reconciled successfully');
    } catch (error) {
      next(error);
    }
  }

  public async listScanLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
      const type = req.query.type as ScanType | undefined;
      const logs = await checkinService.listScanLogs(eventId, type);
      sendSuccess(res, logs, 'Scan logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getEventAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await checkinService.getEventAttendance(eventId, page, limit);
      sendSuccess(res, result, 'Attendance retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getEventStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
      const stats = await checkinService.getEventStats(eventId);
      sendSuccess(res, stats, 'Event statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getUserCheckins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const checkins = await checkinService.getUserCheckins(userId);
      sendSuccess(res, checkins, 'User check-ins retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getHealth(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, { status: 'Operational', service: 'checkin-service', timestamp: new Date().toISOString() });
  }
}

export const checkinController = new CheckinController();
