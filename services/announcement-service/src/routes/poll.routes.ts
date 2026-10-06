import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '@event-os/config';
import { announcementController } from '../controllers/announcement.controller';

const router = Router();

router.post('/', authenticate, (req, res, next) =>
  announcementController.createPoll(req, res, next)
);
router.get('/', optionalAuthenticate, (req, res, next) =>
  announcementController.listPolls(req, res, next)
);
router.post('/:id/vote', authenticate, (req, res, next) =>
  announcementController.votePoll(req, res, next)
);
router.post('/:id/close', authenticate, (req, res, next) =>
  announcementController.closePoll(req, res, next)
);

// Aliases
router.post('/polls', authenticate, (req, res, next) =>
  announcementController.createPoll(req, res, next)
);
router.get('/polls', optionalAuthenticate, (req, res, next) =>
  announcementController.listPolls(req, res, next)
);
router.post('/polls/:id/vote', authenticate, (req, res, next) =>
  announcementController.votePoll(req, res, next)
);
router.post('/polls/:id/close', authenticate, (req, res, next) =>
  announcementController.closePoll(req, res, next)
);

export default router;
