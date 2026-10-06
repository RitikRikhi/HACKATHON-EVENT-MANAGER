import { Router } from 'express';
import { authenticate } from '@event-os/config';
import { checkinController } from '../controllers/checkin.controller';

const router = Router();

// Health check
router.get('/health', (req, res) => checkinController.getHealth(req, res));

// Direct QR Scan (CHECKIN, LUNCH, DINNER, SWAG)
router.post('/scan', authenticate, (req, res, next) => checkinController.scanQR(req, res, next));

// Offline Check-in: cached roster and batch offline scans sync
router.get('/roster/:eventId', (req, res, next) => checkinController.getEventOfflineRoster(req, res, next));
router.post('/sync', authenticate, (req, res, next) => checkinController.syncOfflineScans(req, res, next));

// Printed roster fallback reconciliation
router.post('/reconcile-printed', authenticate, (req, res, next) => checkinController.reconcilePrintedRoster(req, res, next));

// Scan logs
router.get('/scans/:eventId', (req, res, next) => checkinController.listScanLogs(req, res, next));

// Standard Check-in
router.post('/', authenticate, (req, res, next) => checkinController.processCheckIn(req, res, next));
router.get('/event/:eventId', authenticate, (req, res, next) => checkinController.getEventAttendance(req, res, next));
router.get('/stats/:eventId', authenticate, (req, res, next) => checkinController.getEventStats(req, res, next));
router.get('/user/:userId', authenticate, (req, res, next) => checkinController.getUserCheckins(req, res, next));

export default router;
