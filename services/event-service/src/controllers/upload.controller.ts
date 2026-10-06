import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { uploadService } from '../services/upload.service';

export class UploadController {
  public async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const { eventId, fileName, mimeType, fileContentBase64, fileSize, category } = req.body;
      if (!eventId || !fileName || !mimeType) {
        throw new BadRequestError('eventId, fileName, and mimeType are required.');
      }

      const record = await uploadService.processUpload({
        eventId,
        fileName,
        mimeType,
        fileContentBase64,
        fileSize: Number(fileSize) || (fileContentBase64 ? Buffer.byteLength(fileContentBase64, 'base64') : 1024),
        category: category || 'general',
        userId: req.user.userId,
        userRole: req.user.role,
      });

      sendSuccess(res, record, 'File uploaded and registered successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async getUploadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const record = await uploadService.getUploadById(id, req.user.userId, req.user.role);
      sendSuccess(res, record, 'Upload details retrieved');
    } catch (error) {
      next(error);
    }
  }

  public async listEventUploads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = (req.query.eventId || req.params.eventId) as string;
      const category = req.query.category as string | undefined;
      if (!eventId) throw new BadRequestError('eventId is required.');

      const uploads = await uploadService.listEventUploads(eventId, category);
      sendSuccess(res, uploads, 'Uploads retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
