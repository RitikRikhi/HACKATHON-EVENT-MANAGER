import { Router } from 'express';
import { authenticate } from '@event-os/config';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

// Internal / Inter-service creation endpoints
router.post('/', (req, res, next) => notificationController.createNotification(req, res, next));
router.post('/broadcast', (req, res, next) => notificationController.broadcastNotification(req, res, next));

// User Notification Endpoints
router.get('/unread-count', authenticate, (req, res, next) => notificationController.getUnreadCount(req, res, next));
router.patch('/read-all', authenticate, (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.patch('/:id/read', authenticate, (req, res, next) => notificationController.markAsRead(req, res, next));
router.get('/', authenticate, (req, res, next) => notificationController.getUserNotifications(req, res, next));

export default router;
