import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { teamService } from '../services/team.service';
import {
  validateCreateTeamInput,
  validateJoinByCodeInput,
  validateCreateInviteLinkInput,
  validateTransferLeadershipInput,
  validateAddMemberInput,
} from '../validations/team.validation';
import { JoinRequestStatus } from '@event-os/types';

export class TeamController {
  public async createTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const validatedData = validateCreateTeamInput(req.body);
      const team = await teamService.createTeam(validatedData, req.user.userId);
      sendSuccess(res, team, 'Team created successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async getTeamById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const team = await teamService.getTeamById(id);
      sendSuccess(res, team, 'Team retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getTeamByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const team = await teamService.getTeamByCode(code);
      sendSuccess(res, team, 'Team retrieved successfully by code');
    } catch (error) {
      next(error);
    }
  }

  public async listTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.query.eventId as string;
      const teams = await teamService.listTeams(eventId);
      sendSuccess(res, teams, 'Teams retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getMyTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const teams = await teamService.getMyTeams(req.user.userId);
      sendSuccess(res, teams, 'User teams retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async deleteTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await teamService.deleteTeam(id, req.user.userId, req.user.role);
      sendSuccess(res, { id, deleted: true }, 'Team deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // JOIN VIA CODE
  // ---------------------------------------------------------------------------

  public async requestJoinByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const validated = validateJoinByCodeInput(req.body);
      const result = await teamService.requestJoinByCode(validated.teamCode, req.user.userId);
      sendSuccess(res, result, result.message, HttpStatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // INVITE LINK ENDPOINTS
  // ---------------------------------------------------------------------------

  public async createInviteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const teamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validated = validateCreateInviteLinkInput(req.body);
      const result = await teamService.createInviteLink(teamId, validated, req.user.userId, req.user.role);
      sendSuccess(res, result, 'Team invitation link generated successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async getInviteLinkDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
      const result = await teamService.getInviteLinkDetails(token);
      sendSuccess(res, result, 'Invitation details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async requestJoinByInviteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const token = (Array.isArray(req.params.token) ? req.params.token[0] : req.params.token) || req.body.token;
      if (!token) {
        throw new BadRequestError('Invitation token is required.');
      }

      const result = await teamService.requestJoinByInviteLink(token, req.user.userId);
      sendSuccess(res, result, result.message, HttpStatusCodes.OK);
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // JOIN REQUESTS APPROVAL (LEAD ONLY)
  // ---------------------------------------------------------------------------

  public async getJoinRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const teamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const status = req.query.status as JoinRequestStatus | undefined;
      const requests = await teamService.getJoinRequests(teamId, req.user.userId, req.user.role, status);
      sendSuccess(res, requests, 'Join requests retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async acceptJoinRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const teamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

      const result = await teamService.acceptJoinRequest(teamId, requestId, req.user.userId, req.user.role);
      sendSuccess(res, result, 'Join request accepted successfully');
    } catch (error) {
      next(error);
    }
  }

  public async rejectJoinRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const teamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

      const result = await teamService.rejectJoinRequest(teamId, requestId, req.user.userId, req.user.role);
      sendSuccess(res, result, 'Join request rejected successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // LEADERSHIP & MEMBERS
  // ---------------------------------------------------------------------------

  public async transferLeadership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const teamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validated = validateTransferLeadershipInput(req.body);
      const team = await teamService.transferLeadership(
        teamId,
        validated.newLeaderId,
        req.user.userId,
        req.user.role
      );
      sendSuccess(res, team, 'Team leadership transferred successfully');
    } catch (error) {
      next(error);
    }
  }

  public async leaveTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const teamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await teamService.leaveTeam(teamId, req.user.userId);
      sendSuccess(res, result, 'Left team successfully');
    } catch (error) {
      next(error);
    }
  }

  public async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = validateAddMemberInput(req.body);
      const member = await teamService.addMember(id, validatedData, req.user.userId, req.user.role);
      sendSuccess(res, member, 'Team member added successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      await teamService.removeMember(id, userId, req.user.userId, req.user.role);
      sendSuccess(res, { teamId: id, userId, removed: true }, 'Team member removed successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const members = await teamService.getMembers(id);
      sendSuccess(res, members, 'Team members retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // TEAM CONNECTIONS & BLOCKING
  // ---------------------------------------------------------------------------

  public async sendConnectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const fromTeamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { targetTeamId } = req.body;
      if (!targetTeamId) throw new BadRequestError('targetTeamId is required.');

      const connection = await teamService.sendConnectionRequest(fromTeamId, targetTeamId, req.user.userId);
      sendSuccess(res, connection, 'Connection request sent successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listTeamConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const teamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const connections = await teamService.listTeamConnections(teamId, req.user.userId);
      sendSuccess(res, connections, 'Team connections retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async acceptConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const teamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const connectionId = Array.isArray(req.params.connectionId) ? req.params.connectionId[0] : req.params.connectionId;
      const connection = await teamService.acceptConnection(teamId, connectionId, req.user.userId);
      sendSuccess(res, connection, 'Connection request accepted');
    } catch (error) {
      next(error);
    }
  }

  public async rejectConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const teamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const connectionId = Array.isArray(req.params.connectionId) ? req.params.connectionId[0] : req.params.connectionId;
      const connection = await teamService.rejectConnection(teamId, connectionId, req.user.userId);
      sendSuccess(res, connection, 'Connection request rejected');
    } catch (error) {
      next(error);
    }
  }

  public async reportOrBlockTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const fromTeamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { eventId, targetTeamId, reason } = req.body;
      if (!eventId || !targetTeamId) throw new BadRequestError('eventId and targetTeamId are required.');

      const result = await teamService.reportOrBlockTeam(eventId, fromTeamId, targetTeamId, reason, req.user.userId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  public async getConnectedTeamProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const viewerTeamId = req.query.viewerTeamId as string;
      const targetTeamId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!viewerTeamId) throw new BadRequestError('viewerTeamId is required.');

      const profile = await teamService.getConnectedTeamProfile(viewerTeamId, targetTeamId);
      sendSuccess(res, profile, 'Connected team profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  public async getHealth(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, { status: 'Operational', service: 'team-service', timestamp: new Date().toISOString() });
  }
}

export const teamController = new TeamController();
