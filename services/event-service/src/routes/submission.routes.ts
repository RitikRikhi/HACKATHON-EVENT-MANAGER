import { Router } from 'express';
import { authenticate } from '@event-os/config';
import { submissionController } from '../controllers/submission.controller';

const router = Router();

router.post('/', authenticate, (req, res, next) => submissionController.submitProject(req, res, next));
router.get('/', authenticate, (req, res, next) => submissionController.listEventSubmissions(req, res, next));
router.get('/team/:teamId', authenticate, (req, res, next) => submissionController.getTeamSubmission(req, res, next));

export default router;
