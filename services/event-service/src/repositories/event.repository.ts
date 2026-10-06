import crypto from 'crypto';
import { supabase, AppError } from '@event-os/config';
import {
  Event,
  EventStatus,
  EventType,
  EventRegistration,
  EventParticipantDTO,
  EventMember,
  EventMemberRole,
  Track,
  Room,
  Seat,
  Sponsor,
  AggregateAnalytics,
  DeletionReceipt,
} from '@event-os/types';

export class EventRepository {
  private tableName = 'events';
  private registrationsTable = 'event_registrations';
  private membersTable = 'event_members';
  private tracksTable = 'tracks';
  private roomsTable = 'rooms';
  private seatsTable = 'seats';
  private sponsorsTable = 'sponsors';

  public async findAll(params: {
    eventType?: EventType;
    status?: EventStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: Event[]; total: number }> {
    const { eventType, status, search, limit = 20, offset = 0 } = params;

    let query = supabase.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search && search.trim().length > 0) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('start_date', { ascending: true });

    if (error) {
      throw new AppError(`Database error finding events: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return {
      events: (data as Event[]) || [],
      total: count || 0,
    };
  }

  public async findById(id: string): Promise<Event | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding event by ID: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Event | null;
  }

  public async findByJoinCode(joinCode: string): Promise<Event | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select('*')
      .eq('join_code', joinCode.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding event by join code: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Event | null;
  }

  public async create(eventData: {
    name: string;
    description?: string;
    event_type: EventType;
    venue: string;
    start_date: string;
    end_date: string;
    registration_deadline?: string;
    capacity: number;
    status: EventStatus;
    created_by: string;
    retention_days?: number;
  }): Promise<Event> {
    const joinCode = 'EVT-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const insertPayload: Record<string, unknown> = {
      name: eventData.name,
      description: eventData.description || null,
      event_type: eventData.event_type,
      venue: eventData.venue,
      start_date: eventData.start_date,
      end_date: eventData.end_date,
      capacity: eventData.capacity,
      status: eventData.status,
      created_by: eventData.created_by,
      join_code: joinCode,
      retention_days: eventData.retention_days || 30,
    };

    if (eventData.registration_deadline) {
      insertPayload.registration_deadline = eventData.registration_deadline;
    }

    const { data, error } = await supabase.client
      .from(this.tableName)
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating event: ${error.message}`, 500, 'DB_ERROR', error);
    }

    // Auto-add creator as ADMIN in event_members
    await this.addMember(data.id, eventData.created_by, EventMemberRole.ADMIN);

    return data as Event;
  }

  public async update(
    id: string,
    updates: Partial<{
      name: string;
      description: string | null;
      event_type: EventType;
      venue: string;
      start_date: string;
      end_date: string;
      registration_deadline: string | null;
      capacity: number;
      status: EventStatus;
      retention_days: number;
      is_closed: boolean;
      closed_at: string | null;
    }>
  ): Promise<Event> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error updating event: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Event;
  }

  public async delete(id: string): Promise<boolean> {
    const { error } = await supabase.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(`Database error deleting event: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // REGISTRATION & PARTICIPANT REPOSITORY METHODS
  // ---------------------------------------------------------------------------

  public async countActiveRegistrations(eventId: string): Promise<number> {
    const { count, error } = await supabase.client
      .from(this.registrationsTable)
      .select('id', { count: 'exact' })
      .eq('event_id', eventId)
      .neq('status', 'CANCELLED');

    if (error) {
      throw new AppError(`Database error counting registrations: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return count || 0;
  }

  public async findRegistration(eventId: string, userId: string): Promise<EventRegistration | null> {
    const { data, error } = await supabase.client
      .from(this.registrationsTable)
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding registration: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as EventRegistration | null;
  }

  public async createOrUpdateRegistration(
    eventId: string,
    userId: string,
    profileData?: {
      college?: string;
      skills?: string[];
      socialLinks?: Record<string, string>;
      consent?: boolean;
      lookingForTeam?: boolean;
      qrPayload?: string;
    }
  ): Promise<EventRegistration> {
    const existing = await this.findRegistration(eventId, userId);

    const payload: Record<string, unknown> = {
      status: 'REGISTERED',
      registered_at: new Date().toISOString(),
    };

    if (profileData) {
      if (profileData.college !== undefined) payload.college = profileData.college;
      if (profileData.skills !== undefined) payload.skills = profileData.skills;
      if (profileData.socialLinks !== undefined) payload.social_links = profileData.socialLinks;
      if (profileData.consent) payload.consent_at = new Date().toISOString();
      if (profileData.lookingForTeam !== undefined) payload.looking_for_team = profileData.lookingForTeam;
      if (profileData.qrPayload) payload.qr_payload = profileData.qrPayload;
    }

    if (existing) {
      const { data, error } = await supabase.client
        .from(this.registrationsTable)
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) {
        throw new AppError(`Database error updating registration: ${error.message}`, 500, 'DB_ERROR', error);
      }

      return data as EventRegistration;
    }

    const { data, error } = await supabase.client
      .from(this.registrationsTable)
      .insert({
        event_id: eventId,
        user_id: userId,
        ...payload,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating registration: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as EventRegistration;
  }

  public async updateParticipantProfile(
    eventId: string,
    userId: string,
    updates: {
      college?: string;
      skills?: string[];
      socialLinks?: Record<string, string>;
      lookingForTeam?: boolean;
    }
  ): Promise<EventRegistration> {
    const payload: Record<string, unknown> = {};
    if (updates.college !== undefined) payload.college = updates.college;
    if (updates.skills !== undefined) payload.skills = updates.skills;
    if (updates.socialLinks !== undefined) payload.social_links = updates.socialLinks;
    if (updates.lookingForTeam !== undefined) payload.looking_for_team = updates.lookingForTeam;

    const { data, error } = await supabase.client
      .from(this.registrationsTable)
      .update(payload)
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error updating participant profile: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as EventRegistration;
  }

  public async cancelRegistration(eventId: string, userId: string): Promise<EventRegistration> {
    const { data, error } = await supabase.client
      .from(this.registrationsTable)
      .update({
        status: 'CANCELLED',
      })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error cancelling registration: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as EventRegistration;
  }

  public async findParticipants(
    eventId: string,
    limit = 20,
    offset = 0
  ): Promise<{ participants: EventParticipantDTO[]; total: number }> {
    const { data, error, count } = await supabase.client
      .from(this.registrationsTable)
      .select(
        `
          id,
          user_id,
          event_id,
          status,
          registered_at,
          college,
          skills,
          social_links,
          consent_at,
          checked_in_at,
          looking_for_team,
          users:user_id (id, name, email, phone, profile_image)
        `,
        { count: 'exact' }
      )
      .eq('event_id', eventId)
      .range(offset, offset + limit - 1)
      .order('registered_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing participants: ${error.message}`, 500, 'DB_ERROR', error);
    }

    const participants: EventParticipantDTO[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      status: row.status,
      registeredAt: row.registered_at,
      college: row.college,
      skills: row.skills,
      socialLinks: row.social_links || {},
      consentAt: row.consent_at,
      checkedInAt: row.checked_in_at,
      lookingForTeam: row.looking_for_team,
      user: {
        id: row.users?.id || row.user_id,
        name: row.users?.name || 'Unknown',
        email: row.users?.email || '',
        phone: row.users?.phone || null,
        profileImage: row.users?.profile_image || null,
      },
    }));

    return {
      participants,
      total: count || 0,
    };
  }

  public async findLookingForTeamPool(eventId: string): Promise<any[]> {
    const { data, error } = await supabase.client
      .from(this.registrationsTable)
      .select(`
        id,
        user_id,
        college,
        skills,
        social_links,
        users:user_id (id, name, profile_image)
      `)
      .eq('event_id', eventId)
      .eq('status', 'REGISTERED')
      .eq('looking_for_team', true);

    if (error) {
      throw new AppError(`Database error finding looking-for-team pool: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data || []).map((row: any) => ({
      participantId: row.id,
      userId: row.user_id,
      name: row.users?.name || 'Anonymous Participant',
      profileImage: row.users?.profile_image || null,
      college: row.college || null,
      skills: row.skills || [],
      socialLinks: row.social_links || {},
    }));
  }

  // ---------------------------------------------------------------------------
  // EVENT MEMBERS & ROLES REPOSITORY METHODS
  // ---------------------------------------------------------------------------

  public async listMembers(eventId: string): Promise<EventMember[]> {
    const { data, error } = await supabase.client
      .from(this.membersTable)
      .select(`
        id,
        event_id,
        user_id,
        role,
        created_at,
        users:user_id (id, name, email, role)
      `)
      .eq('event_id', eventId);

    if (error) {
      throw new AppError(`Database error listing event members: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      user_id: row.user_id,
      role: row.role as EventMemberRole,
      created_at: row.created_at,
      user: row.users,
    }));
  }

  public async addMember(eventId: string, userId: string, role: EventMemberRole): Promise<EventMember> {
    const { data, error } = await supabase.client
      .from(this.membersTable)
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          role,
        },
        { onConflict: 'event_id,user_id,role' }
      )
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error adding event member: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as EventMember;
  }

  public async removeMember(eventId: string, userId: string): Promise<boolean> {
    const { error } = await supabase.client
      .from(this.membersTable)
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(`Database error removing event member: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return true;
  }

  public async checkMemberRole(eventId: string, userId: string): Promise<string[]> {
    const { data, error } = await supabase.client
      .from(this.membersTable)
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      return [];
    }

    return (data || []).map((r: any) => r.role);
  }

  // ---------------------------------------------------------------------------
  // TRACKS, ROOMS & SEATS REPOSITORY METHODS
  // ---------------------------------------------------------------------------

  public async createTrack(eventId: string, name: string, description?: string): Promise<Track> {
    const { data, error } = await supabase.client
      .from(this.tracksTable)
      .insert({ event_id: eventId, name, description })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating track: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Track;
  }

  public async listTracks(eventId: string): Promise<Track[]> {
    const { data, error } = await supabase.client
      .from(this.tracksTable)
      .select('*')
      .eq('event_id', eventId)
      .order('name');

    if (error) {
      throw new AppError(`Database error listing tracks: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as Track[]) || [];
  }

  public async createRoom(eventId: string, name: string, capacity: number): Promise<Room> {
    const { data, error } = await supabase.client
      .from(this.roomsTable)
      .insert({ event_id: eventId, name, capacity })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating room: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Room;
  }

  public async listRooms(eventId: string): Promise<Room[]> {
    const { data, error } = await supabase.client
      .from(this.roomsTable)
      .select('*')
      .eq('event_id', eventId)
      .order('name');

    if (error) {
      throw new AppError(`Database error listing rooms: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as Room[]) || [];
  }

  public async listSeats(eventId: string): Promise<Seat[]> {
    const { data, error } = await supabase.client
      .from(this.seatsTable)
      .select(`
        id,
        event_id,
        room_id,
        label,
        team_id,
        created_at,
        rooms:room_id (id, name, capacity),
        teams:team_id (id, name, track_id)
      `)
      .eq('event_id', eventId)
      .order('label');

    if (error) {
      throw new AppError(`Database error listing seats: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      room_id: row.room_id,
      label: row.label,
      team_id: row.team_id,
      created_at: row.created_at,
      room: row.rooms,
      team: row.teams,
    }));
  }

  public async bulkSaveSeats(seats: Array<{ event_id: string; room_id: string; label: string; team_id?: string | null }>): Promise<void> {
    if (seats.length === 0) return;
    const { error } = await supabase.client
      .from(this.seatsTable)
      .upsert(seats, { onConflict: 'room_id,label' });

    if (error) {
      throw new AppError(`Database error saving seats: ${error.message}`, 500, 'DB_ERROR', error);
    }
  }

  public async updateTeamSeat(teamId: string, roomId: string | null, seatLabel: string | null): Promise<void> {
    const { error } = await supabase.client
      .from('teams')
      .update({
        room_id: roomId,
        seat_label: seatLabel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamId);

    if (error) {
      throw new AppError(`Database error updating team seat: ${error.message}`, 500, 'DB_ERROR', error);
    }
  }

  // ---------------------------------------------------------------------------
  // SPONSORS & ANALYTICS
  // ---------------------------------------------------------------------------

  public async createSponsor(eventId: string, name: string, bannerUrl?: string, link?: string): Promise<Sponsor> {
    const { data, error } = await supabase.client
      .from(this.sponsorsTable)
      .insert({
        event_id: eventId,
        name,
        banner_url: bannerUrl || null,
        link: link || null,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating sponsor: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Sponsor;
  }

  public async listSponsors(eventId: string): Promise<Sponsor[]> {
    const { data, error } = await supabase.client
      .from(this.sponsorsTable)
      .select('*')
      .eq('event_id', eventId)
      .order('created_at');

    if (error) {
      throw new AppError(`Database error listing sponsors: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as Sponsor[]) || [];
  }

  public async getAggregateAnalytics(eventId: string): Promise<AggregateAnalytics> {
    // 1. Total Registered
    const totalParticipants = await this.countActiveRegistrations(eventId);

    // 2. Total Checked In
    const { count: checkedInCount } = await supabase.client
      .from(this.registrationsTable)
      .select('id', { count: 'exact' })
      .eq('event_id', eventId)
      .not('checked_in_at', 'is', null);

    // 3. Total Teams
    const { count: teamsCount } = await supabase.client
      .from('teams')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId);

    // 4. Total Submissions
    const { count: submissionsCount } = await supabase.client
      .from('submissions')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId);

    // 5. Scans Summary
    const { data: scansData } = await supabase.client
      .from('scan_logs')
      .select('type')
      .eq('event_id', eventId);

    const scansSummary = {
      checkin: 0,
      lunch: 0,
      dinner: 0,
      swag: 0,
    };

    (scansData || []).forEach((scan: any) => {
      const t = (scan.type || '').toLowerCase();
      if (t === 'checkin') scansSummary.checkin++;
      else if (t === 'lunch') scansSummary.lunch++;
      else if (t === 'dinner') scansSummary.dinner++;
      else if (t === 'swag') scansSummary.swag++;
    });

    // 6. Track distribution
    const { data: teamsWithTrack } = await supabase.client
      .from('teams')
      .select('track_id, tracks:track_id (name)')
      .eq('event_id', eventId);

    const trackDistribution: Record<string, number> = {};
    (teamsWithTrack || []).forEach((t: any) => {
      const trackName = t.tracks?.name || 'Unassigned';
      trackDistribution[trackName] = (trackDistribution[trackName] || 0) + 1;
    });

    return {
      eventId,
      totalParticipants,
      totalCheckedIn: checkedInCount || 0,
      totalTeams: teamsCount || 0,
      totalSubmissions: submissionsCount || 0,
      scansSummary,
      trackDistribution,
    };
  }

  // ---------------------------------------------------------------------------
  // EXPORT, CLOSE & RETENTION CLEANUP
  // ---------------------------------------------------------------------------

  public async getFullEventExportData(eventId: string): Promise<Record<string, unknown>> {
    const event = await this.findById(eventId);
    const { data: participants } = await supabase.client
      .from(this.registrationsTable)
      .select('id, user_id, status, registered_at, college, skills, social_links, checked_in_at')
      .eq('event_id', eventId);

    const { data: teams } = await supabase.client
      .from('teams')
      .select('id, name, description, team_code, seat_label, track_id')
      .eq('event_id', eventId);

    const { data: scores } = await supabase.client
      .from('scores')
      .select('id, team_id, total, criteria, feedback')
      .eq('event_id', eventId);

    const { data: questions } = await supabase.client
      .from('questions')
      .select('id, body, answered, answer, upvotes, created_at')
      .eq('event_id', eventId);

    const { data: polls } = await supabase.client
      .from('polls')
      .select('id, question, status, poll_options (id, option_text, vote_count)')
      .eq('event_id', eventId);

    const { data: chat } = await supabase.client
      .from('chat_messages')
      .select('id, channel, body, created_at')
      .eq('event_id', eventId)
      .is('deleted_at', null);

    const { data: tickets } = await supabase.client
      .from('helpdesk_tickets')
      .select('id, category, description, status, created_at, resolved_at')
      .eq('event_id', eventId);

    const { data: scanLogs } = await supabase.client
      .from('scan_logs')
      .select('id, type, scanned_at')
      .eq('event_id', eventId);

    const { data: audit } = await supabase.client
      .from('audit_logs')
      .select('id, action, details, created_at')
      .eq('event_id', eventId);

    return {
      event,
      participants: participants || [],
      teams: teams || [],
      scores: scores || [],
      questions: questions || [],
      polls: polls || [],
      chat: chat || [],
      tickets: tickets || [],
      scanLogs: scanLogs || [],
      audit: audit || [],
    };
  }

  public async deleteExpiredEventData(eventId: string, eventName: string): Promise<DeletionReceipt> {
    // Count records before deletion
    const tables = [
      'event_registrations',
      'team_members',
      'teams',
      'scores',
      'submissions',
      'chat_messages',
      'questions',
      'polls',
      'helpdesk_tickets',
      'scan_logs',
      'team_connections',
      'remarks',
      'seats',
      'rooms',
      'tracks',
      'sponsors',
      'uploads',
    ];

    let totalDeleted = 0;

    for (const tbl of tables) {
      const { data } = await supabase.client
        .from(tbl)
        .delete()
        .eq('event_id', eventId)
        .select('id');
      totalDeleted += (data?.length || 0);
    }

    // Mark event closed and retention completed
    await supabase.client
      .from('events')
      .update({
        status: EventStatus.COMPLETED,
        is_closed: true,
        closed_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    const receiptToken = 'RCPT-' + crypto.randomBytes(16).toString('hex').toUpperCase();

    const { data: receipt } = await supabase.client
      .from('deletion_receipts')
      .insert({
        event_id: eventId,
        event_name: eventName,
        records_deleted: totalDeleted,
        storage_files_deleted: 0,
        receipt_token: receiptToken,
      })
      .select('*')
      .single();

    return receipt as DeletionReceipt;
  }

  public async getDeletionReceipt(eventId: string): Promise<DeletionReceipt | null> {
    const { data, error } = await supabase.client
      .from('deletion_receipts')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data as DeletionReceipt | null;
  }
}

export const eventRepository = new EventRepository();
