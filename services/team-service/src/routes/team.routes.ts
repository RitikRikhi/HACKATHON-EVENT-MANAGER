import { Router } from 'express';
import { authenticate } from '@event-os/config';
import { teamController } from '../controllers/team.controller';

const router = Router();

// Health check
router.get('/health', (req, res) => teamController.getHealth(req, res));

// -----------------------------------------------------------------------------
// USER & INVITE ROUTES (Must precede /:id)
// -----------------------------------------------------------------------------

// Get current user's teams
router.get('/my', authenticate, (req, res, next) => teamController.getMyTeams(req, res, next));

// Join team via unique code
router.post('/join', authenticate, (req, res, next) => teamController.requestJoinByCode(req, res, next));

// Invite link inspection & join via token
router.get('/invite/:token', (req, res, next) => teamController.getInviteLinkDetails(req, res, next));
router.post('/invite/:token/join', authenticate, (req, res, next) => teamController.requestJoinByInviteLink(req, res, next));
router.post('/invite/join', authenticate, (req, res, next) => teamController.requestJoinByInviteLink(req, res, next));

// Get team by code
router.get('/code/:code', (req, res, next) => teamController.getTeamByCode(req, res, next));

// -----------------------------------------------------------------------------
// GENERAL TEAM COLLECTION ROUTES
// -----------------------------------------------------------------------------

// List teams (filter by eventId query)
router.get('/', (req, res, next) => teamController.listTeams(req, res, next));

// Create a new team
router.post('/', authenticate, (req, res, next) => teamController.createTeam(req, res, next));

// -----------------------------------------------------------------------------
// SINGLE TEAM ROUTES
// -----------------------------------------------------------------------------

// Get team by ID
router.get('/:id', (req, res, next) => teamController.getTeamById(req, res, next));

// Delete / Disband team
router.delete('/:id', authenticate, (req, res, next) => teamController.deleteTeam(req, res, next));

// Team Members
router.get('/:id/members', (req, res, next) => teamController.getMembers(req, res, next));
router.post('/:id/members', authenticate, (req, res, next) => teamController.addMember(req, res, next));
router.delete('/:id/members/:userId', authenticate, (req, res, next) => teamController.removeMember(req, res, next));

// Leave team
router.post('/:id/leave', authenticate, (req, res, next) => teamController.leaveTeam(req, res, next));

// Transfer leadership
router.post('/:id/transfer-leadership', authenticate, (req, res, next) => teamController.transferLeadership(req, res, next));

// Generate invite link (Team Lead only)
router.post('/:id/invite-link', authenticate, (req, res, next) => teamController.createInviteLink(req, res, next));

// Join Requests Management (Team Lead only)
router.get('/:id/join-requests', authenticate, (req, res, next) => teamController.getJoinRequests(req, res, next));
router.post('/:id/join-requests/:requestId/accept', authenticate, (req, res, next) => teamController.acceptJoinRequest(req, res, next));
router.put('/:id/join-requests/:requestId/accept', authenticate, (req, res, next) => teamController.acceptJoinRequest(req, res, next));
router.post('/:id/join-requests/:requestId/reject', authenticate, (req, res, next) => teamController.rejectJoinRequest(req, res, next));
router.put('/:id/join-requests/:requestId/reject', authenticate, (req, res, next) => teamController.rejectJoinRequest(req, res, next));

// -----------------------------------------------------------------------------
// TEAM CONNECTIONS & BLOCKING
// -----------------------------------------------------------------------------

router.post('/:id/connections', authenticate, (req, res, next) => teamController.sendConnectionRequest(req, res, next));
router.get('/:id/connections', authenticate, (req, res, next) => teamController.listTeamConnections(req, res, next));
router.post('/:id/connections/:connectionId/accept', authenticate, (req, res, next) => teamController.acceptConnection(req, res, next));
router.post('/:id/connections/:connectionId/reject', authenticate, (req, res, next) => teamController.rejectConnection(req, res, next));
router.post('/:id/block', authenticate, (req, res, next) => teamController.reportOrBlockTeam(req, res, next));
router.get('/:id/connected-profile', authenticate, (req, res, next) => teamController.getConnectedTeamProfile(req, res, next));

export default router;
