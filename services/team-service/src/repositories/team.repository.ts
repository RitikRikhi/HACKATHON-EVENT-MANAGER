import { supabase, AppError } from '@event-os/config';
import {
  Team,
  TeamMember,
  TeamRole,
  TeamStatus,
  TeamJoinRequest,
  TeamInviteLink,
  JoinRequestType,
  JoinRequestStatus,
} from '@event-os/types';
import crypto from 'crypto';

export class TeamRepository {
  private teamsTable = 'teams';
  private membersTable = 'team_members';
  private requestsTable = 'team_join_requests';
  private inviteLinksTable = 'team_invite_links';
  private eventRegistrationsTable = 'event_registrations';

  /**
   * Generate a unique, readable uppercase 6-character team code (e.g. NN7X42)
   */
  public generateTeamCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async createTeam(data: {
    name: string;
    description?: string;
    event_id: string;
    created_by: string;
  }): Promise<Team> {
    let teamCode = this.generateTeamCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const existing = await this.findByTeamCode(teamCode);
      if (!existing) {
        isUnique = true;
      } else {
        teamCode = this.generateTeamCode();
        attempts++;
      }
    }

    const { data: result, error } = await supabase.client
      .from(this.teamsTable)
      .insert({
        name: data.name,
        description: data.description || null,
        event_id: data.event_id,
        created_by: data.created_by,
        team_code: teamCode,
        status: TeamStatus.ACTIVE,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating team: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as Team;
  }

  public async findById(id: string): Promise<Team | null> {
    const { data, error } = await supabase.client
      .from(this.teamsTable)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding team by ID: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Team | null;
  }

  public async findByTeamCode(teamCode: string): Promise<Team | null> {
    const { data, error } = await supabase.client
      .from(this.teamsTable)
      .select('*')
      .eq('team_code', teamCode.toUpperCase())
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding team by code: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Team | null;
  }

  public async findAll(eventId?: string): Promise<Team[]> {
    let query = supabase.client.from(this.teamsTable).select('*');

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing teams: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as Team[]) || [];
  }

  public async findUserTeams(userId: string): Promise<any[]> {
    const { data, error } = await supabase.client
      .from(this.membersTable)
      .select(`
        id,
        role,
        joined_at,
        team:teams (
          id,
          name,
          description,
          event_id,
          team_code,
          status,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(`Database error finding user teams: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data || []).map((m: any) => ({
      membershipId: m.id,
      role: m.role,
      joinedAt: m.joined_at,
      team: m.team,
    }));
  }

  public async deleteTeam(id: string): Promise<boolean> {
    const { error } = await supabase.client
      .from(this.teamsTable)
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(`Database error deleting team: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return true;
  }

  public async addMember(teamId: string, userId: string, role: TeamRole): Promise<TeamMember> {
    const { data, error } = await supabase.client
      .from(this.membersTable)
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
        status: 'ACTIVE',
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error adding team member: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as TeamMember;
  }

  public async removeMember(teamId: string, userId: string): Promise<boolean> {
    const { error } = await supabase.client
      .from(this.membersTable)
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(`Database error removing team member: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return true;
  }

  public async getMembers(teamId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase.client
      .from(this.membersTable)
      .select(`
        id,
        team_id,
        user_id,
        role,
        status,
        joined_at,
        users:user_id (id, name, email, role, phone, profile_image)
      `)
      .eq('team_id', teamId);

    if (error) {
      throw new AppError(`Database error getting team members: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      team_id: m.team_id,
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      joined_at: m.joined_at,
      user: m.users
        ? {
            id: m.users.id,
            name: m.users.name,
            email: m.users.email,
            role: m.users.role,
            phone: m.users.phone,
            profileImage: m.users.profile_image,
          }
        : undefined,
    })) as TeamMember[];
  }

  public async countMembers(teamId: string): Promise<number> {
    const { count, error } = await supabase.client
      .from(this.membersTable)
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId);

    if (error) {
      throw new AppError(`Database error counting team members: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return count || 0;
  }

  public async findMember(teamId: string, userId: string): Promise<TeamMember | null> {
    const { data, error } = await supabase.client
      .from(this.membersTable)
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding team member: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as TeamMember | null;
  }

  public async transferLeadership(teamId: string, currentLeadId: string, newLeadId: string): Promise<void> {
    // 1. Demote current lead to MEMBER
    const { error: demoteError } = await supabase.client
      .from(this.membersTable)
      .update({ role: TeamRole.MEMBER })
      .eq('team_id', teamId)
      .eq('user_id', currentLeadId);

    if (demoteError) {
      throw new AppError(`Database error demoting current team lead: ${demoteError.message}`, 500, 'DB_ERROR', demoteError);
    }

    // 2. Promote new lead to TEAM_LEAD
    const { error: promoteError } = await supabase.client
      .from(this.membersTable)
      .update({ role: TeamRole.TEAM_LEAD })
      .eq('team_id', teamId)
      .eq('user_id', newLeadId);

    if (promoteError) {
      throw new AppError(`Database error promoting new team lead: ${promoteError.message}`, 500, 'DB_ERROR', promoteError);
    }

    // 3. Update team created_by or leader reference
    await supabase.client
      .from(this.teamsTable)
      .update({ created_by: newLeadId, updated_at: new Date().toISOString() })
      .eq('id', teamId);
  }

  public async isUserRegisteredForEvent(userId: string, eventId: string): Promise<boolean> {
    const { data, error } = await supabase.client
      .from(this.eventRegistrationsTable)
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('status', 'REGISTERED')
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error checking event registration: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return !!data;
  }

  public async findUserTeamInEvent(userId: string, eventId: string): Promise<Team | null> {
    const { data, error } = await supabase.client
      .from(this.membersTable)
      .select(`
        id,
        team:teams!inner (
          id,
          name,
          description,
          event_id,
          team_code,
          status,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('teams.event_id', eventId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // ignore not found error
      throw new AppError(`Database error checking user team in event: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data && (data as any).team ? (data as any).team : null;
  }

  // ---------------------------------------------------------------------------
  // JOIN REQUESTS
  // ---------------------------------------------------------------------------

  public async createJoinRequest(data: {
    team_id: string;
    user_id: string;
    type: JoinRequestType;
    invitation_token?: string | null;
    status?: JoinRequestStatus;
    expires_at?: string | null;
  }): Promise<TeamJoinRequest> {
    const { data: result, error } = await supabase.client
      .from(this.requestsTable)
      .insert({
        team_id: data.team_id,
        user_id: data.user_id,
        type: data.type,
        invitation_token: data.invitation_token || null,
        status: data.status || JoinRequestStatus.PENDING,
        expires_at: data.expires_at || null,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating join request: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as TeamJoinRequest;
  }

  public async findPendingJoinRequest(teamId: string, userId: string): Promise<TeamJoinRequest | null> {
    const { data, error } = await supabase.client
      .from(this.requestsTable)
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', JoinRequestStatus.PENDING)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding pending join request: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as TeamJoinRequest | null;
  }

  public async findJoinRequestById(requestId: string): Promise<TeamJoinRequest | null> {
    const { data, error } = await supabase.client
      .from(this.requestsTable)
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding join request: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as TeamJoinRequest | null;
  }

  public async getJoinRequests(teamId: string, status?: JoinRequestStatus): Promise<TeamJoinRequest[]> {
    let query = supabase.client
      .from(this.requestsTable)
      .select(`
        id,
        team_id,
        user_id,
        type,
        invitation_token,
        status,
        expires_at,
        created_at,
        updated_at,
        users:user_id (id, name, email, role, phone, profile_image)
      `)
      .eq('team_id', teamId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error getting join requests: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      team_id: r.team_id,
      user_id: r.user_id,
      type: r.type,
      invitation_token: r.invitation_token,
      status: r.status,
      expires_at: r.expires_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user: r.users
        ? {
            id: r.users.id,
            name: r.users.name,
            email: r.users.email,
            role: r.users.role,
            phone: r.users.phone,
            profileImage: r.users.profile_image,
          }
        : undefined,
    })) as TeamJoinRequest[];
  }

  public async updateJoinRequestStatus(requestId: string, status: JoinRequestStatus): Promise<TeamJoinRequest> {
    const { data, error } = await supabase.client
      .from(this.requestsTable)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error updating join request status: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as TeamJoinRequest;
  }

  // ---------------------------------------------------------------------------
  // INVITE LINKS
  // ---------------------------------------------------------------------------

  public generateInviteToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public async createInviteLink(data: {
    team_id: string;
    created_by: string;
    max_uses?: number | null;
    expires_at?: string | null;
  }): Promise<TeamInviteLink> {
    const token = this.generateInviteToken();

    const { data: result, error } = await supabase.client
      .from(this.inviteLinksTable)
      .insert({
        team_id: data.team_id,
        token,
        created_by: data.created_by,
        max_uses: data.max_uses || null,
        used_count: 0,
        expires_at: data.expires_at || null,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating invite link: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as TeamInviteLink;
  }

  public async findInviteLink(token: string): Promise<TeamInviteLink | null> {
    const { data, error } = await supabase.client
      .from(this.inviteLinksTable)
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding invite link: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as TeamInviteLink | null;
  }

  public async incrementInviteLinkUsage(token: string): Promise<void> {
    const { data } = await supabase.client
      .from(this.inviteLinksTable)
      .select('used_count, max_uses')
      .eq('token', token)
      .maybeSingle();

    if (data) {
      const nextCount = (data.used_count || 0) + 1;
      const updates: any = {
        used_count: nextCount,
        updated_at: new Date().toISOString(),
      };

      if (data.max_uses && nextCount >= data.max_uses) {
        updates.is_active = false;
      }

      await supabase.client
        .from(this.inviteLinksTable)
        .update(updates)
        .eq('token', token);
    }
  }

  // ---------------------------------------------------------------------------
  // LOOKING FOR TEAM POOL CLEANUP
  // ---------------------------------------------------------------------------

  public async removeFromLookingForTeamPool(eventId: string, userId: string): Promise<void> {
    try {
      await supabase.client
        .from(this.eventRegistrationsTable)
        .update({ looking_for_team: false })
        .eq('event_id', eventId)
        .eq('user_id', userId);
    } catch (err) {
      console.warn(`[TeamRepository] Failed to update looking_for_team for user ${userId}:`, (err as Error).message);
    }
  }

  // ---------------------------------------------------------------------------
  // TEAM CONNECTIONS & BLOCKING
  // ---------------------------------------------------------------------------

  public async isTeamBlocked(teamAId: string, teamBId: string): Promise<boolean> {
    const { data } = await supabase.client
      .from('team_blocks')
      .select('id')
      .or(`and(blocker_team.eq.${teamAId},blocked_team.eq.${teamBId}),and(blocker_team.eq.${teamBId},blocked_team.eq.${teamAId})`)
      .limit(1);

    return (data && data.length > 0) || false;
  }

  public async createConnection(eventId: string, fromTeamId: string, toTeamId: string): Promise<any> {
    const { data, error } = await supabase.client
      .from('team_connections')
      .insert({
        event_id: eventId,
        from_team: fromTeamId,
        to_team: toTeamId,
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating connection request: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data;
  }

  public async findConnectionById(connectionId: string): Promise<any | null> {
    const { data, error } = await supabase.client
      .from('team_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding connection: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data;
  }

  public async listTeamConnections(teamId: string): Promise<any[]> {
    const { data, error } = await supabase.client
      .from('team_connections')
      .select(`
        id,
        event_id,
        from_team,
        to_team,
        status,
        created_at,
        updated_at,
        fromTeam:from_team (id, name, description, seat_label),
        toTeam:to_team (id, name, description, seat_label)
      `)
      .or(`from_team.eq.${teamId},to_team.eq.${teamId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing team connections: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data || [];
  }

  public async updateConnectionStatus(connectionId: string, status: string): Promise<any> {
    const { data, error } = await supabase.client
      .from('team_connections')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error updating connection status: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data;
  }

  public async blockTeam(eventId: string, blockerTeamId: string, blockedTeamId: string, reason?: string): Promise<void> {
    await supabase.client
      .from('team_blocks')
      .upsert({
        event_id: eventId,
        blocker_team: blockerTeamId,
        blocked_team: blockedTeamId,
        reason: reason || null,
      }, { onConflict: 'blocker_team,blocked_team' });

    // Update any existing connection to BLOCKED
    await supabase.client
      .from('team_connections')
      .update({ status: 'BLOCKED', updated_at: new Date().toISOString() })
      .or(`and(from_team.eq.${blockerTeamId},to_team.eq.${blockedTeamId}),and(from_team.eq.${blockedTeamId},to_team.eq.${blockerTeamId})`);
  }

  public async getSanitizedTeamSocialProfile(teamId: string): Promise<any> {
    const team = await this.findById(teamId);
    if (!team) return null;

    const members = await this.getMembers(teamId);

    // For connected teams: fetch explicit social links from event_registrations (NO email, NO phone!)
    const memberProfiles = await Promise.all(
      members.map(async (m) => {
        const { data: reg } = await supabase.client
          .from(this.eventRegistrationsTable)
          .select('college, skills, social_links')
          .eq('event_id', team.event_id)
          .eq('user_id', m.user_id)
          .maybeSingle();

        return {
          userId: m.user_id,
          name: m.user?.name || 'Member',
          role: m.role,
          college: reg?.college || null,
          skills: reg?.skills || [],
          socialLinks: reg?.social_links || {},
        };
      })
    );

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      seatLabel: team.seat_label || null,
      members: memberProfiles,
    };
  }
}

export const teamRepository = new TeamRepository();

