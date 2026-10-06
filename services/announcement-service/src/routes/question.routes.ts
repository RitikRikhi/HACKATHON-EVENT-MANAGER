import { Router } from 'express';
import { authenticate, optionalAuthenticate, questionRateLimiter } from '@event-os/config';
import { announcementController } from '../controllers/announcement.controller';

const router = Router();

router.post('/', authenticate, questionRateLimiter, (req, res, next) =>
  announcementController.askQuestion(req, res, next)
);
router.get('/', optionalAuthenticate, (req, res, next) =>
  announcementController.listQuestions(req, res, next)
);
router.post('/:id/upvote', authenticate, (req, res, next) =>
  announcementController.upvoteQuestion(req, res, next)
);
router.post('/:id/answer', authenticate, (req, res, next) =>
  announcementController.answerQuestion(req, res, next)
);

// Aliases
router.post('/questions', authenticate, questionRateLimiter, (req, res, next) =>
  announcementController.askQuestion(req, res, next)
);
router.get('/questions', optionalAuthenticate, (req, res, next) =>
  announcementController.listQuestions(req, res, next)
);
router.post('/questions/:id/upvote', authenticate, (req, res, next) =>
  announcementController.upvoteQuestion(req, res, next)
);
router.post('/questions/:id/answer', authenticate, (req, res, next) =>
  announcementController.answerQuestion(req, res, next)
);

export default router;
