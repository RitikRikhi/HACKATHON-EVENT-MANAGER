import { Router } from 'express';
import { authenticate, optionalAuthenticate, chatRateLimiter } from '@event-os/config';
import { announcementController } from '../controllers/announcement.controller';

const router = Router();

// Chat Messages
router.post('/messages', authenticate, chatRateLimiter, (req, res, next) =>
  announcementController.sendChatMessage(req, res, next)
);
router.get('/messages', optionalAuthenticate, (req, res, next) =>
  announcementController.listChatMessages(req, res, next)
);
router.delete('/messages/:id', authenticate, (req, res, next) =>
  announcementController.deleteChatMessage(req, res, next)
);

// Mute User
router.post('/mute', authenticate, (req, res, next) =>
  announcementController.muteUserInChat(req, res, next)
);

// Aliases for /chat/messages
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

export default router;
