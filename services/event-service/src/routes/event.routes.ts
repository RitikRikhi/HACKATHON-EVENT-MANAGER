import { Router } from 'express';
import { authenticate, optionalAuthenticate, authorizeRoles } from '@event-os/config';
import { UserRole } from '@event-os/types';
import { eventController } from '../controllers/event.controller';

const router = Router();

// Health check
router.get('/health', (req, res) => eventController.getHealth(req, res));

// Public routes & join code route (Must come before /:id)
router.get('/join/:code', (req, res, next) => eventController.getEventByJoinCode(req, res, next));
router.get('/', optionalAuthenticate, (req, res, next) => eventController.listEvents(req, res, next));

// Elevated creation routes (ADMIN, SUPER_ADMIN, TEAM_LEAD)
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEAM_LEAD),
  (req, res, next) => eventController.createEvent(req, res, next)
);

// Specific sub-resource routes on /:id
router.get('/:id', optionalAuthenticate, (req, res, next) => eventController.getEventById(req, res, next));

// Projector / Display screen mode
router.get('/:id/screen', (req, res, next) => eventController.getScreenDisplay(req, res, next));

// Publish & Close Event (ADMIN, SUPER_ADMIN only)
router.post(
  '/:id/publish',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (req, res, next) => eventController.publishEvent(req, res, next)
);
router.post(
  '/:id/close',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (req, res, next) => eventController.closeEvent(req, res, next)
);

// Update & Delete route
router.put('/:id', authenticate, (req, res, next) => eventController.updateEvent(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => eventController.deleteEvent(req, res, next));

// Participant Registration & Profile
router.post('/:id/register', authenticate, (req, res, next) => eventController.registerForEvent(req, res, next));
router.put('/:id/profile', authenticate, (req, res, next) => eventController.updateParticipantProfile(req, res, next));
router.delete('/:id/register', authenticate, (req, res, next) => eventController.cancelRegistration(req, res, next));
router.post('/:id/cancel-registration', authenticate, (req, res, next) => eventController.cancelRegistration(req, res, next));
router.get('/:id/registration', authenticate, (req, res, next) => eventController.getUserRegistration(req, res, next));

// View Participants & Looking-for-team pool
router.get('/:id/participants', (req, res, next) => eventController.getEventParticipants(req, res, next));
router.get('/:id/looking-for-team', (req, res, next) => eventController.getLookingForTeamPool(req, res, next));
router.patch('/:id/looking-for-team', authenticate, (req, res, next) => eventController.toggleLookingForTeam(req, res, next));

// Event Members & Roles
router.get('/:id/members', (req, res, next) => eventController.listEventMembers(req, res, next));
router.post('/:id/members', authenticate, (req, res, next) => eventController.addEventMember(req, res, next));
router.delete('/:id/members/:userId', authenticate, (req, res, next) => eventController.removeEventMember(req, res, next));

// Tracks
router.get('/:id/tracks', (req, res, next) => eventController.listTracks(req, res, next));
router.post('/:id/tracks', authenticate, (req, res, next) => eventController.createTrack(req, res, next));

// Rooms & Seats
router.get('/:id/rooms', (req, res, next) => eventController.listRooms(req, res, next));
router.post('/:id/rooms', authenticate, (req, res, next) => eventController.createRoom(req, res, next));
router.get('/:id/seats', (req, res, next) => eventController.listSeats(req, res, next));
router.post('/:id/seats/allocate', authenticate, (req, res, next) => eventController.allocateSeats(req, res, next));
router.post('/:id/seats/manual', authenticate, (req, res, next) => eventController.manualSeatAssignment(req, res, next));
router.post('/:id/seats/swap', authenticate, (req, res, next) => eventController.swapSeats(req, res, next));

// Sponsors & Analytics
router.get('/:id/sponsors', (req, res, next) => eventController.listSponsors(req, res, next));
router.post('/:id/sponsors', authenticate, (req, res, next) => eventController.createSponsor(req, res, next));
router.get('/:id/analytics', (req, res, next) => eventController.getAnalytics(req, res, next));

// Export & Retention
router.post('/:id/export', authenticate, (req, res, next) => eventController.generateExport(req, res, next));
router.post('/:id/retention/cleanup', authenticate, (req, res, next) => eventController.runRetentionCleanup(req, res, next));
router.get('/:id/retention/receipt', (req, res, next) => eventController.getDeletionReceipt(req, res, next));

export default router;
