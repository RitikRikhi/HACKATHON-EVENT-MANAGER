import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '@event-os/config';
import { resultController } from '../controllers/result.controller';

const router = Router();

// Scores (Judging)
router.post('/scores', authenticate, (req, res, next) => resultController.submitScore(req, res, next));
router.get('/scores', authenticate, (req, res, next) => resultController.listScores(req, res, next));

// Results Publishing
router.get('/', optionalAuthenticate, (req, res, next) => resultController.getEventResult(req, res, next));
router.post('/publish', authenticate, (req, res, next) => resultController.publishResult(req, res, next));
router.post('/', authenticate, (req, res, next) => resultController.publishResult(req, res, next));

export default router;
