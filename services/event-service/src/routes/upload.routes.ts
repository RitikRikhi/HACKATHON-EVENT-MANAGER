import { Router } from 'express';
import { authenticate } from '@event-os/config';
import { uploadController } from '../controllers/upload.controller';

const router = Router();

router.post('/', authenticate, (req, res, next) => uploadController.uploadFile(req, res, next));
router.get('/', authenticate, (req, res, next) => uploadController.listEventUploads(req, res, next));
router.get('/:id', authenticate, (req, res, next) => uploadController.getUploadById(req, res, next));

export default router;
