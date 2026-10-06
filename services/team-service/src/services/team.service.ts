import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '@event-os/config';
import {
  Team,
  CreateTeamDTO,
  AddTeamMemberDTO,
  TeamRole,
  UserRole,
  TeamWithMembers,
  NotificationType,
  TeamStatus,
  JoinRequestType,
  JoinRequestStatus,
  CreateInviteLinkDTO,
} from '@event-os/types';
import { teamRepository } from '../repositories/team.repository';
import { config } from '../config';

export class TeamService {
  public async createTeam(dto: CreateTeamDTO, userId: string): Promise<TeamWithMembers> {
    // 1. Verify user is registered for the event
    const isRegistered = await teamRepository.isUserRegisteredForEvent(userId, dto.eventId);
    if (!isRegistered) {
      throw new BadRequestError('You must be registered for the event to create a team.');
    }

    // 2. Verify user is not already part of a team in this event
    const existingTeam = await teamRepository.findUserTeamInEvent(userId, dto.eventId);
    if (existingTeam) {
      throw new ConflictError(`You are already part of a team ("${existingTeam.name}") in this event.`);
    }

    // 3. Create the team
    const newTeam = await teamRepository.createTeam({
      name: dto.name,
      description: dto.description,
      event_id: dto.eventId,
      created_by: userId,
    });

    // 4. Add the creator as the TEAM_LEAD of the team
    const leaderMember = await teamRepository.addMember(newTeam.id, userId, TeamRole.TEAM_LEAD);

    // 5. Auto-remove from looking-for-team pool
    await teamRepository.removeFromLookingForTeamPool(dto.eventId, userId);

    return {
      ...newTeam,
      members: [leaderMember],
    };
  }

  public async getTeamById(id: string): Promise<TeamWithMembers> {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new NotFoundError(`Team with ID ${id} not found.`);
    }

    const members = await teamRepository.getMembers(id);
    return {
      ...team,
      members,
    };
  }

  public async getTeamByCode(teamCode: string): Promise<TeamWithMembers> {
    const team = await teamRepository.findByTeamCode(teamCode);
    if (!team) {
      throw new NotFoundError(`Team with code "${teamCode}" not found.`);
    }

    const members = await teamRepository.getMembers(team.id);
    return {
      ...team,
      members,
    };
  }

  public async listTeams(eventId?: string): Promise<Team[]> {
    return await teamRepository.findAll(eventId);
  }

  public async getMyTeams(userId: string): Promise<any[]> {
    return await teamRepository.findUserTeams(userId);
  }

  public async deleteTeam(id: string, userId: string, userRole: UserRole): Promise<boolean> {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new NotFoundError(`Team with ID ${id} not found.`);
    }

    const isOwner = team.created_by === userId;
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isOwner && !isElevated) {
      throw new ForbiddenError('You do not have permission to delete this team.');
    }

    return await teamRepository.deleteTeam(id);
  }

  // ---------------------------------------------------------------------------
  // JOIN VIA TEAM CODE
  // ---------------------------------------------------------------------------

  public async requestJoinByCode(teamCode: string, userId: string) {
    const team = await teamRepository.findByTeamCode(teamCode);
    if (!team) {
      throw new NotFoundError(`Team with code "${teamCode}" not found.`);
    }

    if (team.status === TeamStatus.DISBANDED) {
      throw new BadRequestError('This team has been disbanded.');
    }

    // 1. Verify user is registered for the event
    const isRegistered = await teamRepository.isUserRegisteredForEvent(userId, team.event_id);
    if (!isRegistered) {
      throw new BadRequestError('You must be registered for the event before requesting to join a team.');
    }

    // 2. Check if already a member of this team
    const existingMember = await teamRepository.findMember(team.id, userId);
    if (existingMember) {
      throw new ConflictError('You are already a member of this team.');
    }

    // 3. Check if already in another team in this event
    const existingEventTeam = await teamRepository.findUserTeamInEvent(userId, team.event_id);
    if (existingEventTeam) {
      throw new ConflictError(`You are already part of a team ("${existingEventTeam.name}") in this event.`);
    }

    // 4. Check if pending request already exists
    const pendingRequest = await teamRepository.findPendingJoinRequest(team.id, userId);
    if (pendingRequest) {
      throw new ConflictError('You already have a pending join request for this team.');
    }

    // 5. Create PENDING join request
    const joinRequest = await teamRepository.createJoinRequest({
      team_id: team.id,
      user_id: userId,
      type: JoinRequestType.CODE,
    });

    // 6. Notify Team Lead
    this.dispatchNotification(team.created_by, {
      title: 'New Team Join Request',
      message: `A participant has requested to join your team "${team.name}" using team code.`,
      type: NotificationType.TEAM,
      metadata: { teamId: team.id, requestId: joinRequest.id },
    });

    return {
      message: 'Join request submitted successfully. Awaiting Team Lead approval.',
      request: joinRequest,
      team: {
        id: team.id,
        name: team.name,
        eventId: team.event_id,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // INVITE LINKS
  // ---------------------------------------------------------------------------

  public async createInviteLink(
    teamId: string,
    dto: CreateInviteLinkDTO,
    userId: string,
    userRole: UserRole
  ) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found.`);
    }

    const currentMember = await teamRepository.findMember(teamId, userId);
    const isTeamLead = currentMember?.role === TeamRole.TEAM_LEAD;
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isTeamLead && !isElevated) {
      throw new ForbiddenError('Only the Team Lead can generate invite links.');
    }

    let expiresAt: string | null = null;
    if (dto.expiresInHours) {
      const exp = new Date();
      exp.setHours(exp.getHours() + dto.expiresInHours);
      expiresAt = exp.toISOString();
    }

    const inviteLink = await teamRepository.createInviteLink({
      team_id: teamId,
      created_by: userId,
      max_uses: dto.maxUses,
      expires_at: expiresAt,
    });

    return {
      ...inviteLink,
      inviteUrl: `/api/teams/invite/${inviteLink.token}`,
    };
  }

  public async getInviteLinkDetails(token: string) {
    const invite = await teamRepository.findInviteLink(token);
    if (!invite || !invite.is_active) {
      throw new NotFoundError('Invalid or expired invitation link.');
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new BadRequestError('This invitation link has expired.');
    }

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      throw new BadRequestError('This invitation link has reached its maximum usage limit.');
    }

    const team = await teamRepository.findById(invite.team_id);
    if (!team) {
      throw new NotFoundError('Team associated with this invitation link no longer exists.');
    }

    return {
      token: invite.token,
      teamId: team.id,
      teamName: team.name,
      eventId: team.event_id,
      expiresAt: invite.expires_at,
      isActive: invite.is_active,
    };
  }

  public async requestJoinByInviteLink(token: string, userId: string) {
    const invite = await teamRepository.findInviteLink(token);
    if (!invite || !invite.is_active) {
      throw new NotFoundError('Invalid or expired invitation link.');
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new BadRequestError('This invitation link has expired.');
    }

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      throw new BadRequestError('This invitation link has reached its maximum usage limit.');
    }

    const team = await teamRepository.findById(invite.team_id);
    if (!team) {
      throw new NotFoundError('Team associated with this invitation link no longer exists.');
    }

    // 1. Verify user is registered for the event
    const isRegistered = await teamRepository.isUserRegisteredForEvent(userId, team.event_id);
    if (!isRegistered) {
      throw new BadRequestError('You must be registered for the event before requesting to join a team.');
    }

    // 2. Check if already in this team
    const existingMember = await teamRepository.findMember(team.id, userId);
    if (existingMember) {
      throw new ConflictError('You are already a member of this team.');
    }

    // 3. Check if in another team in this event
    const existingEventTeam = await teamRepository.findUserTeamInEvent(userId, team.event_id);
    if (existingEventTeam) {
      throw new ConflictError(`You are already part of a team ("${existingEventTeam.name}") in this event.`);
    }

    // 4. Check if pending request exists
    const pendingRequest = await teamRepository.findPendingJoinRequest(team.id, userId);
    if (pendingRequest) {
      throw new ConflictError('You already have a pending join request for this team.');
    }

    // 5. Create PENDING join request
    const joinRequest = await teamRepository.createJoinRequest({
      team_id: team.id,
      user_id: userId,
      type: JoinRequestType.LINK,
      invitation_token: token,
    });

    // 6. Increment usage
    await teamRepository.incrementInviteLinkUsage(token);

    // 7. Notify Team Lead
    this.dispatchNotification(team.created_by, {
      title: 'New Team Join Request',
      message: `A participant has requested to join your team "${team.name}" using an invitation link.`,
      type: NotificationType.TEAM,
      metadata: { teamId: team.id, requestId: joinRequest.id },
    });

    return {
      message: 'Join request submitted successfully via invitation link. Awaiting Team Lead approval.',
      request: joinRequest,
      team: {
        id: team.id,
        name: team.name,
        eventId: team.event_id,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // JOIN REQUEST MANAGEMENT (LEAD APPROVAL)
  // ---------------------------------------------------------------------------

  public async getJoinRequests(teamId: string, userId: string, userRole: UserRole, status?: JoinRequestStatus) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found.`);
    }

    const currentMember = await teamRepository.findMember(teamId, userId);
    const isTeamLead = currentMember?.role === TeamRole.TEAM_LEAD;
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isTeamLead && !isElevated) {
      throw new ForbiddenError('Only the Team Lead or Admin can view join requests.');
    }

    return await teamRepository.getJoinRequests(teamId, status);
  }

  public async acceptJoinRequest(teamId: string, requestId: string, userId: string, userRole: UserRole) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found.`);
    }

    const currentMember = await teamRepository.findMember(teamId, userId);
    const isTeamLead = currentMember?.role === TeamRole.TEAM_LEAD;
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isTeamLead && !isElevated) {
      throw new ForbiddenError('Only the Team Lead or Admin can accept join requests.');
    }

    const request = await teamRepository.findJoinRequestById(requestId);
    if (!request || request.team_id !== teamId) {
      throw new NotFoundError('Join request not found for this team.');
    }

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestError(`Cannot accept a request that is already ${request.status}.`);
    }

    // Check if user is already a member
    const existingMember = await teamRepository.findMember(teamId, request.user_id);
    if (existingMember) {
      await teamRepository.updateJoinRequestStatus(requestId, JoinRequestStatus.ACCEPTED);
      return { request: { ...request, status: JoinRequestStatus.ACCEPTED }, member: existingMember };
    }

    // Add member to team
    const newMember = await teamRepository.addMember(teamId, request.user_id, TeamRole.MEMBER);

    // Auto-remove member from looking-for-team pool
    await teamRepository.removeFromLookingForTeamPool(team.event_id, request.user_id);

    // Update request status to ACCEPTED
    const updatedRequest = await teamRepository.updateJoinRequestStatus(requestId, JoinRequestStatus.ACCEPTED);

    // Notify user
    this.dispatchNotification(request.user_id, {
      title: 'Team Join Request Accepted',
      message: `Your request to join team "${team.name}" has been accepted!`,
      type: NotificationType.TEAM,
      metadata: { teamId, memberId: newMember.id },
    });

    return {
      request: updatedRequest,
      member: newMember,
    };
  }

  public async rejectJoinRequest(teamId: string, requestId: string, userId: string, userRole: UserRole) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found.`);
    }

    const currentMember = await teamRepository.findMember(teamId, userId);
    const isTeamLead = currentMember?.role === TeamRole.TEAM_LEAD;
    const isElevated = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isTeamLead && !isElevated) {
      throw new ForbiddenError('Only the Team Lead or Admin can reject join requests.');
    }

    const request = await teamRepository.findJoinRequestById(requestId);
    if (!request || request.team_id !== teamId) {
      throw new NotFoundError('Join request not found for this team.');
    }

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestError(`Cannot reject a request that is already ${request.status}.`);
    }

    const updatedRequest = await teamRepository.updateJoinRequestStatus(requestId, JoinRequestStatus.REJECTED);

    // Notify user
    this.dispatchNotification(request.user_id, {
      title: 'Team Join Request Declined',
      message: `Your request to join team "${team.name}" has been declined.`,
      type: NotificationType.TEAM,
      metadata: { teamId },
    });

    return updatedRequest;
  }

  // ---------------------------------------------------------------------------
  // LEADERSHIP TRANSFER & MEMBER MANAGEMENT
  // ---------------------------------------------------------------------------

  public async transferLeadership(
    teamId: string,
    newLeaderId: string,
    currentUserId: string,
    currentUserRole: UserRole
  ): Promise<TeamWithMembers> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found.`);
    }

    const currentMember = await teamRepository.findMember(teamId, currentUserId);
    const isTeamLead = currentMember?.role === TeamRole.TEAM_LEAD;
    const isElevated = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.SUPER_ADMIN;

    if (!isTeamLead && !isElevated) {
      throw new ForbiddenError('Only the current Team Lead or Admin can transfer leadership.');
    }

    if (newLeaderId === currentUserId && isTeamLead) {
      throw new BadRequestError('You are already the Team Lead.');
    }

    // Verify new leader is currently a member of the team
    const newLeaderMember = await teamRepository.findMember(teamId, newLeaderId);
    if (!newLeaderMember) {
      throw new BadRequestError('The specified user is not a member of this team.');
    }

    // Perform leadership transfer
    const actualOldLeadId = isTeamLead ? currentUserId : team.created_by;
    await teamRepository.transferLeadership(teamId, actualOldLeadId, newLeaderId);

    // Notify new leader
    this.dispatchNotification(newLeaderId, {
      title: 'Team Leadership Transferred',
      message: `You are now the Team Lead of team "${team.name}".`,
      type: NotificationType.TEAM,
      metadata: { teamId },
    });

    return await this.getTeamById(teamId);
  }

  public async leaveTeam(teamId: string, userId: string) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found.`);
    }

    const currentMember = await teamRepository.findMember(teamId, userId);
    if (!currentMember) {
      throw new NotFoundError('You are not a member of this team.');
    }

    const totalMembers = await teamRepository.countMembers(teamId);

    // If Team Lead is leaving
    if (currentMember.role === TeamRole.TEAM_LEAD) {
      if (totalMembers > 1) {
        throw new BadRequestError(
          'As the Team Lead, you must transfer leadership to another member before leaving the team.'
        );
      } else {
        // Sole member - remove member and delete team
        await teamRepository.removeMember(teamId, userId);
        await teamRepository.deleteTeam(teamId);
        return { teamId, left: true, teamDisbanded: true };
      }
    }

    // Regular member leaving
    await teamRepository.removeMember(teamId, userId);
    return { teamId, left: true, teamDisbanded: false };
  }

  public async removeMember(
    teamId: string,
    targetUserId: string,
    currentUserId: string,
    currentUserRole: UserRole
  ): Promise<boolean> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found.`);
    }

    const currentMember = await teamRepository.findMember(teamId, currentUserId);
    const isTeamLead = currentMember?.role === TeamRole.TEAM_LEAD;
    const isElevated = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.SUPER_ADMIN;

    if (!isTeamLead && !isElevated) {
      throw new ForbiddenError('Only the Team Lead or Admin can remove members from the team.');
    }

    const targetMember = await teamRepository.findMember(teamId, targetUserId);
    if (!targetMember) {
      throw new NotFoundError('Target user is not a member of this team.');
    }

    if (targetMember.role === TeamRole.TEAM_LEAD && !isElevated) {
      throw new BadRequestError('Cannot remove the Team Lead. Transfer leadership first.');
    }

    return await teamRepository.removeMember(teamId, targetUserId);
  }

  public async addMember(
    teamId: string,
    dto: AddTeamMemberDTO,
    currentUserId: string,
    currentUserRole: UserRole
  ) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found.`);
    }

    const currentMember = await teamRepository.findMember(teamId, currentUserId);
    const isTeamLead = currentMember?.role === TeamRole.TEAM_LEAD;
    const isElevated = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.SUPER_ADMIN;

    if (!isTeamLead && !isElevated) {
      throw new ForbiddenError('Only team leads and admins can directly add members to this team.');
    }

    const existing = await teamRepository.findMember(teamId, dto.userId);
    if (existing) {
      throw new ConflictError('This user is already a member of the team.');
    }

    const member = await teamRepository.addMember(teamId, dto.userId, dto.role || TeamRole.MEMBER);
    await teamRepository.removeFromLookingForTeamPool(team.event_id, dto.userId);

    this.dispatchNotification(dto.userId, {
      title: 'Team Assignment',
      message: `You have been added to team "${team.name}" as ${member.role}.`,
      type: NotificationType.TEAM,
      metadata: { teamId, role: member.role },
    });

    return member;
  }

  public async getMembers(teamId: string) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError(`Team with ID ${teamId} not found.`);
    }

    return await teamRepository.getMembers(teamId);
  }

  // ---------------------------------------------------------------------------
  // TEAM CONNECTIONS & BLOCKING
  // ---------------------------------------------------------------------------

  public async sendConnectionRequest(fromTeamId: string, toTeamId: string, userId: string): Promise<any> {
    if (fromTeamId === toTeamId) {
      throw new BadRequestError('Cannot connect a team to itself.');
    }

    const fromTeam = await teamRepository.findById(fromTeamId);
    const toTeam = await teamRepository.findById(toTeamId);

    if (!fromTeam || !toTeam) {
      throw new NotFoundError('One or both teams not found.');
    }

    if (fromTeam.event_id !== toTeam.event_id) {
      throw new BadRequestError('Teams must belong to the same event to connect.');
    }

    // Verify user belongs to fromTeam
    const isMember = await teamRepository.findMember(fromTeamId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of the requesting team.');
    }

    // Check if blocked
    const isBlocked = await teamRepository.isTeamBlocked(fromTeamId, toTeamId);
    if (isBlocked) {
      throw new ForbiddenError('Unable to send connection request to this team.');
    }

    return await teamRepository.createConnection(fromTeam.event_id, fromTeamId, toTeamId);
  }

  public async listTeamConnections(teamId: string, userId: string): Promise<any[]> {
    const isMember = await teamRepository.findMember(teamId, userId);
    if (!isMember) {
      throw new ForbiddenError('You must be a member of the team to view its connections.');
    }

    return await teamRepository.listTeamConnections(teamId);
  }

  public async acceptConnection(teamId: string, connectionId: string, userId: string): Promise<any> {
    const isMember = await teamRepository.findMember(teamId, userId);
    if (!isMember) {
      throw new ForbiddenError('You must be a member of the target team to accept connections.');
    }

    const connection = await teamRepository.findConnectionById(connectionId);
    if (!connection || connection.to_team !== teamId) {
      throw new NotFoundError('Connection request not found for this team.');
    }

    return await teamRepository.updateConnectionStatus(connectionId, 'ACCEPTED');
  }

  public async rejectConnection(teamId: string, connectionId: string, userId: string): Promise<any> {
    const isMember = await teamRepository.findMember(teamId, userId);
    if (!isMember) {
      throw new ForbiddenError('You must be a member of the target team to reject connections.');
    }

    const connection = await teamRepository.findConnectionById(connectionId);
    if (!connection || connection.to_team !== teamId) {
      throw new NotFoundError('Connection request not found for this team.');
    }

    return await teamRepository.updateConnectionStatus(connectionId, 'REJECTED');
  }

  public async reportOrBlockTeam(
    eventId: string,
    fromTeamId: string,
    targetTeamId: string,
    reason: string | undefined,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const isMember = await teamRepository.findMember(fromTeamId, userId);
    if (!isMember) {
      throw new ForbiddenError('You must be a member of the team to block another team.');
    }

    await teamRepository.blockTeam(eventId, fromTeamId, targetTeamId, reason);
    return { success: true, message: 'Team has been blocked.' };
  }

  public async getConnectedTeamProfile(viewerTeamId: string, targetTeamId: string): Promise<any> {
    const isBlocked = await teamRepository.isTeamBlocked(viewerTeamId, targetTeamId);
    if (isBlocked) {
      throw new ForbiddenError('Access denied: Interaction is blocked between these teams.');
    }

    return await teamRepository.getSanitizedTeamSocialProfile(targetTeamId);
  }

  private async dispatchNotification(userId: string, payload: {
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      if (!config.notificationServiceUrl) return;

      await fetch(`${config.notificationServiceUrl}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          metadata: payload.metadata,
        }),
      });
    } catch (err) {
      console.warn('[TeamService] Failed to dispatch notification:', (err as Error).message);
    }
  }
}

export const teamService = new TeamService();
