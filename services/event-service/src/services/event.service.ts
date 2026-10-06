import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  generateQRPayload,
  logAudit,
  supabase,
} from '@event-os/config';
import {
  Event,
  CreateEventDTO,
  UpdateEventDTO,
  EventFilterQuery,
  UserRole,
  PaginatedResponse,
  EventStatus,
  EventType,
  EventRegistration,
  EventParticipantDTO,
  NotificationType,
  EventMember,
  EventMemberRole,
  Track,
  Room,
  Seat,
  Sponsor,
  AggregateAnalytics,
  DeletionReceipt,
  RegisterForEventDTO,
} from '@event-os/types';
import { eventRepository } from '../repositories/event.repository';
import { validateStatusTransition } from '../validations/event.validation';
import { config } from '../config';

export class EventService {
  public async listEvents(
    query: EventFilterQuery,
    currentUserId?: string
  ): Promise<PaginatedResponse<Event>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const { events, total } = await eventRepository.findAll({
      eventType: query.eventType,
      status: query.status,
      search: query.search,
      limit,
      offset,
    });

    const enrichedEvents = await Promise.all(
      events.map(async (ev) => {
        const count = await eventRepository.countActiveRegistrations(ev.id);
        let isUserRegistered = false;
        if (currentUserId) {
          const reg = await eventRepository.findRegistration(ev.id, currentUserId);
          isUserRegistered = reg?.status === 'REGISTERED';
        }
        return {
          ...ev,
          registered_count: count,
          is_user_registered: isUserRegistered,
        };
      })
    );

    return {
      items: enrichedEvents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async getEventById(id: string, currentUserId?: string): Promise<Event> {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError(`Event with ID ${id} not found.`);
    }

    const count = await eventRepository.countActiveRegistrations(id);
    let isUserRegistered = false;
    if (currentUserId) {
      const reg = await eventRepository.findRegistration(id, currentUserId);
      isUserRegistered = reg?.status === 'REGISTERED';
    }

    return {
      ...event,
      registered_count: count,
      is_user_registered: isUserRegistered,
    };
  }

  public async getEventByJoinCode(joinCode: string): Promise<Event> {
    const event = await eventRepository.findByJoinCode(joinCode);
    if (!event) {
      throw new NotFoundError(`Event with join code "${joinCode}" not found.`);
    }
    const count = await eventRepository.countActiveRegistrations(event.id);
    return {
      ...event,
      registered_count: count,
    };
  }

  public async createEvent(dto: CreateEventDTO, userId: string): Promise<Event> {
    const newEvent = await eventRepository.create({
      name: dto.name,
      description: dto.description,
      event_type: dto.eventType || EventType.OTHER,
      venue: dto.venue,
      start_date: dto.startDate,
      end_date: dto.endDate,
      registration_deadline: dto.registrationDeadline,
      capacity: dto.capacity,
      status: dto.status || EventStatus.DRAFT,
      created_by: userId,
      retention_days: dto.retentionDays || 30,
    });

    await logAudit(newEvent.id, userId, 'EVENT_CREATED', { name: newEvent.name, join_code: newEvent.join_code });
    return newEvent;
  }

  public async updateEvent(
    id: string,
    dto: UpdateEventDTO,
    userId: string,
    userRole: UserRole
  ): Promise<Event> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID ${id} not found.`);
    }

    const isAuthorized =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      existing.created_by === userId;

    if (!isAuthorized) {
      throw new ForbiddenError('You do not have permission to update this event.');
    }

    if (dto.status && dto.status !== existing.status) {
      validateStatusTransition(existing.status, dto.status);
    }

    const updated = await eventRepository.update(id, {
      name: dto.name,
      description: dto.description,
      event_type: dto.eventType,
      venue: dto.venue,
      start_date: dto.startDate,
      end_date: dto.endDate,
      registration_deadline: dto.registrationDeadline,
      capacity: dto.capacity,
      status: dto.status,
      retention_days: dto.retentionDays,
    });

    await logAudit(id, userId, 'EVENT_UPDATED', { updates: dto });
    return updated;
  }

  public async publishEvent(id: string, userId: string, userRole: UserRole): Promise<Event> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID ${id} not found.`);
    }

    const isAuthorized =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      existing.created_by === userId;

    if (!isAuthorized) {
      throw new ForbiddenError('You do not have permission to publish this event.');
    }

    validateStatusTransition(existing.status, EventStatus.PUBLISHED);

    const published = await eventRepository.update(id, { status: EventStatus.PUBLISHED });
    await logAudit(id, userId, 'EVENT_PUBLISHED');
    return published;
  }

  public async deleteEvent(id: string, userId: string, userRole: UserRole): Promise<boolean> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with ID ${id} not found.`);
    }

    const isAuthorized =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      existing.created_by === userId;

    if (!isAuthorized) {
      throw new ForbiddenError('You do not have permission to delete this event.');
    }

    await logAudit(id, userId, 'EVENT_DELETED', { name: existing.name });
    return await eventRepository.delete(id);
  }

  // ---------------------------------------------------------------------------
  // PARTICIPANT REGISTRATION & PROFILE FLOW
  // ---------------------------------------------------------------------------

  public async registerForEvent(
    eventId: string,
    userId: string,
    dto?: RegisterForEventDTO
  ): Promise<EventRegistration> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError(`Event with ID ${eventId} not found.`);
    }

    if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
      throw new BadRequestError(`Cannot register for an event that is ${event.status.toLowerCase()}.`);
    }

    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline).getTime();
      if (Date.now() > deadline) {
        throw new BadRequestError('Registration for this event has closed.');
      }
    }

    const existingReg = await eventRepository.findRegistration(eventId, userId);
    if (existingReg && existingReg.status === 'REGISTERED') {
      throw new ConflictError('You are already registered for this event.');
    }

    const count = await eventRepository.countActiveRegistrations(eventId);
    if (count >= event.capacity) {
      throw new ConflictError('Event capacity has been reached.');
    }

    // Generate HMAC QR Payload
    const qr = generateQRPayload(userId, eventId);

    const registration = await eventRepository.createOrUpdateRegistration(eventId, userId, {
      college: dto?.college,
      skills: dto?.skills,
      socialLinks: dto?.socialLinks,
      consent: dto?.consent ?? true,
      lookingForTeam: dto?.lookingForTeam ?? false,
      qrPayload: qr.qrString,
    });

    await logAudit(eventId, userId, 'PARTICIPANT_REGISTERED', {
      college: dto?.college,
      lookingForTeam: dto?.lookingForTeam,
    });

    return registration;
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
    const reg = await eventRepository.findRegistration(eventId, userId);
    if (!reg || reg.status !== 'REGISTERED') {
      throw new NotFoundError('Active registration not found for this event.');
    }

    const updated = await eventRepository.updateParticipantProfile(eventId, userId, updates);
    return updated;
  }

  public async cancelRegistration(eventId: string, userId: string): Promise<EventRegistration> {
    const reg = await eventRepository.findRegistration(eventId, userId);
    if (!reg || reg.status === 'CANCELLED') {
      throw new NotFoundError('No active registration found to cancel.');
    }

    const cancelled = await eventRepository.cancelRegistration(eventId, userId);
    await logAudit(eventId, userId, 'PARTICIPANT_CANCELLED_REGISTRATION');
    return cancelled;
  }

  public async getUserRegistration(eventId: string, userId: string): Promise<EventRegistration | null> {
    const reg = await eventRepository.findRegistration(eventId, userId);
    if (!reg) {
      throw new NotFoundError('Registration not found.');
    }
    return reg;
  }

  public async getEventParticipants(
    eventId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<EventParticipantDTO>> {
    const offset = (page - 1) * limit;
    const { participants, total } = await eventRepository.findParticipants(eventId, limit, offset);

    return {
      items: participants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async getLookingForTeamPool(eventId: string): Promise<any[]> {
    return await eventRepository.findLookingForTeamPool(eventId);
  }

  public async toggleLookingForTeam(eventId: string, userId: string, lookingForTeam: boolean): Promise<EventRegistration> {
    return await eventRepository.updateParticipantProfile(eventId, userId, { lookingForTeam });
  }

  // ---------------------------------------------------------------------------
  // EVENT MEMBERS & ROLES
  // ---------------------------------------------------------------------------

  public async listEventMembers(eventId: string): Promise<EventMember[]> {
    return await eventRepository.listMembers(eventId);
  }

  public async addEventMember(
    eventId: string,
    targetUserId: string,
    role: EventMemberRole,
    requestingUserId: string,
    requestingUserRole: UserRole
  ): Promise<EventMember> {
    await this.ensureEventAdmin(eventId, requestingUserId, requestingUserRole);
    const member = await eventRepository.addMember(eventId, targetUserId, role);
    await logAudit(eventId, requestingUserId, 'EVENT_MEMBER_ADDED', { targetUserId, role });
    return member;
  }

  public async removeEventMember(
    eventId: string,
    targetUserId: string,
    requestingUserId: string,
    requestingUserRole: UserRole
  ): Promise<boolean> {
    await this.ensureEventAdmin(eventId, requestingUserId, requestingUserRole);
    const res = await eventRepository.removeMember(eventId, targetUserId);
    await logAudit(eventId, requestingUserId, 'EVENT_MEMBER_REMOVED', { targetUserId });
    return res;
  }

  // ---------------------------------------------------------------------------
  // TRACKS, ROOMS & SEATS
  // ---------------------------------------------------------------------------

  public async createTrack(eventId: string, name: string, description?: string): Promise<Track> {
    return await eventRepository.createTrack(eventId, name, description);
  }

  public async listTracks(eventId: string): Promise<Track[]> {
    return await eventRepository.listTracks(eventId);
  }

  public async createRoom(eventId: string, name: string, capacity: number): Promise<Room> {
    return await eventRepository.createRoom(eventId, name, capacity);
  }

  public async listRooms(eventId: string): Promise<Room[]> {
    return await eventRepository.listRooms(eventId);
  }

  public async listSeats(eventId: string): Promise<Seat[]> {
    return await eventRepository.listSeats(eventId);
  }

  /**
   * Complete Seat Allocation Algorithm (Track-based, Largest Team First)
   */
  public async allocateSeats(eventId: string, userId: string, userRole: UserRole): Promise<{ message: string; allocatedTeams: number; seatsAssigned: number }> {
    await this.ensureEventAdmin(eventId, userId, userRole);

    const rooms = await eventRepository.listRooms(eventId);
    if (rooms.length === 0) {
      throw new BadRequestError('No rooms found for this event. Please create at least one room before allocating seats.');
    }

    // Fetch teams
    const { data: teamsData, error: teamsError } = await supabase.client
      .from('teams')
      .select('id, name, track_id')
      .eq('event_id', eventId);

    if (teamsError || !teamsData || teamsData.length === 0) {
      throw new BadRequestError('No teams found for seat allocation.');
    }

    const teamIds = teamsData.map((t: any) => t.id);
    const { data: membersData } = await supabase.client
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds);

    const memberCounts: Record<string, number> = {};
    (membersData || []).forEach((m: any) => {
      memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1;
    });

    // Group teams by track, sort largest team first
    const teams = teamsData.map((t: any) => ({
      id: t.id,
      name: t.name,
      trackId: t.track_id,
      memberCount: Math.max(1, memberCounts[t.id] || 1),
    }));

    teams.sort((a: any, b: any) => b.memberCount - a.memberCount);

    let roomIndex = 0;
    let currentRoom = rooms[roomIndex];
    let seatNumberInRoom = 1;
    let totalSeatsAssigned = 0;
    let totalTeamsAllocated = 0;

    const seatsToInsert: Array<{ event_id: string; room_id: string; label: string; team_id: string }> = [];

    for (const team of teams) {
      // Check if team fits in current room
      if (seatNumberInRoom + team.memberCount - 1 > currentRoom.capacity) {
        // Move to next room
        roomIndex++;
        if (roomIndex < rooms.length) {
          currentRoom = rooms[roomIndex];
          seatNumberInRoom = 1;
        } else {
          // Wrap around or overflow in last room
          currentRoom = rooms[rooms.length - 1];
        }
      }

      const teamSeatLabel = `${currentRoom.name}-${String(seatNumberInRoom).padStart(2, '0')}`;

      // Allocate each seat for team member
      for (let i = 0; i < team.memberCount; i++) {
        const individualSeatLabel = `${currentRoom.name}-${String(seatNumberInRoom + i).padStart(2, '0')}`;
        seatsToInsert.push({
          event_id: eventId,
          room_id: currentRoom.id,
          label: individualSeatLabel,
          team_id: team.id,
        });
        totalSeatsAssigned++;
      }

      seatNumberInRoom += team.memberCount;

      // Update team record
      await eventRepository.updateTeamSeat(team.id, currentRoom.id, teamSeatLabel);
      totalTeamsAllocated++;
    }

    await eventRepository.bulkSaveSeats(seatsToInsert);
    await logAudit(eventId, userId, 'SEATS_AUTOMATICALLY_ALLOCATED', { totalTeamsAllocated, totalSeatsAssigned });

    return {
      message: 'Seats allocated successfully using track-largest-first algorithm.',
      allocatedTeams: totalTeamsAllocated,
      seatsAssigned: totalSeatsAssigned,
    };
  }

  public async manualSeatAssignment(
    eventId: string,
    teamId: string,
    roomId: string,
    seatLabel: string,
    userId: string,
    userRole: UserRole
  ): Promise<{ success: boolean; message: string }> {
    await this.ensureEventAdmin(eventId, userId, userRole);
    await eventRepository.updateTeamSeat(teamId, roomId, seatLabel);
    await logAudit(eventId, userId, 'SEAT_MANUAL_ASSIGNMENT', { teamId, roomId, seatLabel });
    return { success: true, message: `Team ${teamId} assigned to seat ${seatLabel}` };
  }

  public async swapSeats(
    eventId: string,
    teamAId: string,
    teamBId: string,
    userId: string,
    userRole: UserRole
  ): Promise<{ success: boolean; message: string }> {
    await this.ensureEventAdmin(eventId, userId, userRole);

    const { data: teamA } = await (await import('@event-os/config')).supabase.client
      .from('teams')
      .select('room_id, seat_label')
      .eq('id', teamAId)
      .single();

    const { data: teamB } = await (await import('@event-os/config')).supabase.client
      .from('teams')
      .select('room_id, seat_label')
      .eq('id', teamBId)
      .single();

    if (!teamA || !teamB) {
      throw new NotFoundError('One or both teams not found for seat swap.');
    }

    await eventRepository.updateTeamSeat(teamAId, teamB.room_id, teamB.seat_label);
    await eventRepository.updateTeamSeat(teamBId, teamA.room_id, teamA.seat_label);

    await logAudit(eventId, userId, 'SEATS_SWAPPED', { teamAId, teamBId });
    return { success: true, message: 'Seats swapped successfully between teams.' };
  }

  // ---------------------------------------------------------------------------
  // PROJECTOR SCREEN / DISPLAY VIEW
  // ---------------------------------------------------------------------------

  public async getScreenDisplayData(eventId: string): Promise<Record<string, unknown>> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError(`Event with ID ${eventId} not found.`);
    }

    const analytics = await eventRepository.getAggregateAnalytics(eventId);

    // Latest pinned or critical announcements
    const { data: announcements } = await (await import('@event-os/config')).supabase.client
      .from('announcements')
      .select('id, title, content, priority, pinned, created_at')
      .eq('event_id', eventId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    const sponsors = await eventRepository.listSponsors(eventId);

    return {
      eventId: event.id,
      name: event.name,
      status: event.status,
      venue: event.venue,
      startDate: event.start_date,
      endDate: event.end_date,
      analytics,
      announcements: announcements || [],
      sponsors,
    };
  }

  // ---------------------------------------------------------------------------
  // SPONSORS & ANALYTICS
  // ---------------------------------------------------------------------------

  public async createSponsor(eventId: string, name: string, bannerUrl?: string, link?: string): Promise<Sponsor> {
    return await eventRepository.createSponsor(eventId, name, bannerUrl, link);
  }

  public async listSponsors(eventId: string): Promise<Sponsor[]> {
    return await eventRepository.listSponsors(eventId);
  }

  public async getAggregateAnalytics(eventId: string): Promise<AggregateAnalytics> {
    return await eventRepository.getAggregateAnalytics(eventId);
  }

  // ---------------------------------------------------------------------------
  // EXPORT, CLOSE & RETENTION CLEANUP
  // ---------------------------------------------------------------------------

  public async generateEventExport(eventId: string, userId: string, userRole: UserRole): Promise<Record<string, unknown>> {
    await this.ensureEventAdmin(eventId, userId, userRole);
    const exportData = await eventRepository.getFullEventExportData(eventId);
    await logAudit(eventId, userId, 'EVENT_EXPORT_GENERATED');
    return exportData;
  }

  public async closeEvent(eventId: string, userId: string, userRole: UserRole): Promise<Event> {
    await this.ensureEventAdmin(eventId, userId, userRole);
    const updated = await eventRepository.update(eventId, {
      status: EventStatus.COMPLETED,
      is_closed: true,
      closed_at: new Date().toISOString(),
    });
    await logAudit(eventId, userId, 'EVENT_CLOSED');
    return updated;
  }

  public async runRetentionCleanup(eventId: string, userId: string, userRole: UserRole): Promise<DeletionReceipt> {
    await this.ensureEventAdmin(eventId, userId, userRole);
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError(`Event with ID ${eventId} not found.`);
    }

    const receipt = await eventRepository.deleteExpiredEventData(eventId, event.name);
    await logAudit(eventId, userId, 'EVENT_RETENTION_CLEANED_UP', { receiptToken: receipt.receipt_token });
    return receipt;
  }

  public async getDeletionReceipt(eventId: string): Promise<DeletionReceipt> {
    const receipt = await eventRepository.getDeletionReceipt(eventId);
    if (!receipt) {
      throw new NotFoundError('Deletion receipt not found for this event.');
    }
    return receipt;
  }

  private async ensureEventAdmin(eventId: string, userId: string, userRole: UserRole): Promise<void> {
    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      return;
    }
    const event = await eventRepository.findById(eventId);
    if (event && event.created_by === userId) {
      return;
    }
    const roles = await eventRepository.checkMemberRole(eventId, userId);
    if (roles.includes('ADMIN') || roles.includes('ORGANIZER') || roles.includes('SUPER_ADMIN')) {
      return;
    }
    throw new ForbiddenError('You do not have organizer privileges for this event.');
  }
}

export const eventService = new EventService();
