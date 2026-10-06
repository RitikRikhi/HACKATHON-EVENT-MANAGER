import { Router } from 'express';
import {
  authenticate,
  optionalAuthenticate,
  authorizeRoles,
  chatRateLimiter,
  questionRateLimiter,
} from '@event-os/config';
import { UserRole } from '@event-os/types';
import { announcementController } from '../controllers/announcement.controller';

const router = Router();

// Health check
router.get('/health', (req, res) => announcementController.getHealth(req, res));

// -----------------------------------------------------------------------------
// ANNOUNCEMENTS
// -----------------------------------------------------------------------------

router.get('/', (req, res, next) => announcementController.listAnnouncements(req, res, next));
router.get('/:id', (req, res, next) => announcementController.getAnnouncementById(req, res, next));

router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEAM_LEAD),
  (req, res, next) => announcementController.createAnnouncement(req, res, next)
);

router.put('/:id', authenticate, (req, res, next) =>
  announcementController.updateAnnouncement(req, res, next)
);

router.delete('/:id', authenticate, (req, res, next) =>
  announcementController.deleteAnnouncement(req, res, next)
);

// -----------------------------------------------------------------------------
// COMMUNITY CHAT
// -----------------------------------------------------------------------------

router.post('/chat/messages', authenticate, chatRateLimiter, (req, res, next) =>
  announcementController.sendChatMessage(req, res, next)
);
router.get('/chat/messages', optionalAuthenticate, (req, res, next) =>
  announcementController.listChatMessages(req, res, next)
);
router.delete('/chat/messages/:id', authenticate, (req, res, next) =>
  announcementController.deleteChatMessage(req, res, next)
);
router.post('/chat/mute', authenticate, (req, res, next) =>
  announcementController.muteUserInChat(req, res, next)
);

// -----------------------------------------------------------------------------
// QUESTIONS (Q&A)
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// POLLS
// -----------------------------------------------------------------------------

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
