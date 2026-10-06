import { Router } from 'express';
import { authenticate } from '@event-os/config';
import { remarkController } from '../controllers/remark.controller';

const router = Router();

router.post('/', authenticate, (req, res, next) => remarkController.createRemark(req, res, next));
router.get('/', authenticate, (req, res, next) => remarkController.listRemarks(req, res, next));
router.patch('/:id/resolve', authenticate, (req, res, next) => remarkController.resolveRemark(req, res, next));
router.post('/:id/resolve', authenticate, (req, res, next) => remarkController.resolveRemark(req, res, next));

export default router;
