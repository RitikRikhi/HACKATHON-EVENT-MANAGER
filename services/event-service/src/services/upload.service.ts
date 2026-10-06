import path from 'path';
import crypto from 'crypto';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  logAudit,
} from '@event-os/config';
import { UploadRecord, UserRole } from '@event-os/types';
import { uploadRepository } from '../repositories/upload.repository';
import { eventRepository } from '../repositories/event.repository';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export class UploadService {
  public async processUpload(params: {
    eventId: string;
    fileName: string;
    mimeType: string;
    fileContentBase64?: string;
    fileSize: number;
    category: string;
    userId: string;
    userRole: UserRole;
  }): Promise<UploadRecord> {
    const { eventId, fileName, mimeType, fileSize, category, userId } = params;

    // 1. Verify Event exists
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError(`Event with ID ${eventId} not found.`);
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
      throw new BadRequestError(`File type "${mimeType}" is not allowed. Whitelisted types: PDF, DOCX, Images, CSV, JSON, ZIP, Markdown.`);
    }

    // 3. Validate File Size
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestError(`File size exceeds 25MB maximum limit.`);
    }

    // 4. Sanitize file name & generate safe storage path
    const sanitizedOriginal = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(sanitizedOriginal);
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const storageFileName = `${Date.now()}_${uniqueId}${ext}`;
    const safeFilePath = `events/${eventId}/${category}/${storageFileName}`;

    // 5. Store record
    const record = await uploadRepository.createUploadRecord({
      event_id: eventId,
      user_id: userId,
      file_name: storageFileName,
      original_name: sanitizedOriginal,
      file_path: safeFilePath,
      mime_type: mimeType,
      file_size: fileSize,
      category: category || 'general',
    });

    await logAudit(eventId, userId, 'FILE_UPLOADED', {
      uploadId: record.id,
      category,
      originalName: sanitizedOriginal,
      fileSize,
    });

    return record;
  }

  public async getUploadById(id: string, userId: string, userRole: UserRole): Promise<UploadRecord> {
    const record = await uploadRepository.findById(id);
    if (!record) {
      throw new NotFoundError(`Upload with ID ${id} not found.`);
    }
    return record;
  }

  public async listEventUploads(eventId: string, category?: string): Promise<UploadRecord[]> {
    return await uploadRepository.listByEvent(eventId, category);
  }
}

export const uploadService = new UploadService();
