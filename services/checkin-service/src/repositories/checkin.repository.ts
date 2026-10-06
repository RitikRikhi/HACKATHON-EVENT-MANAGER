import { supabase, AppError } from '@event-os/config';
import { CheckIn, ScanType, ScanLog } from '@event-os/types';

export class CheckinRepository {
  private tableName = 'checkins';
  private scanLogsTable = 'scan_logs';
  private registrationsTable = 'event_registrations';

  public async createCheckin(data: {
    event_id: string;
    ticket_id?: string | null;
    user_id: string;
    checked_in_by?: string | null;
    status?: string;
    notes?: string;
  }): Promise<CheckIn> {
    // 1. Mark registration checked_in_at
    await supabase.client
      .from(this.registrationsTable)
      .update({
        checked_in_at: new Date().toISOString(),
        status: 'ATTENDED',
      })
      .eq('event_id', data.event_id)
      .eq('user_id', data.user_id);

    // 2. Insert checkin record if ticket_id is present or fallback
    let resultCheckin: any = null;
    if (data.ticket_id) {
      const { data: result, error } = await supabase.client
        .from(this.tableName)
        .upsert({
          event_id: data.event_id,
          ticket_id: data.ticket_id,
          user_id: data.user_id,
          checked_in_by: data.checked_in_by || null,
          status: data.status || 'SUCCESS',
          notes: data.notes || null,
        }, { onConflict: 'ticket_id' })
        .select(`
          *,
          ticket:ticket_id (*),
          user:user_id (id, name, email, role)
        `)
        .single();

      if (!error && result) {
        resultCheckin = result;
      }
    }

    if (!resultCheckin) {
      const { data: user } = await supabase.client
        .from('users')
        .select('id, name, email, role')
        .eq('id', data.user_id)
        .single();

      resultCheckin = {
        id: data.ticket_id || data.user_id,
        event_id: data.event_id,
        ticket_id: data.ticket_id || '',
        user_id: data.user_id,
        checked_in_by: data.checked_in_by || null,
        status: 'SUCCESS',
        checked_in_at: new Date().toISOString(),
        notes: data.notes || null,
        user: user || undefined,
      };
    }

    return resultCheckin as CheckIn;
  }

  public async findByTicketId(ticketId: string): Promise<CheckIn | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select('*')
      .eq('ticket_id', ticketId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding checkin: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as CheckIn | null;
  }

  public async findRegistration(eventId: string, userId: string): Promise<any | null> {
    const { data, error } = await supabase.client
      .from(this.registrationsTable)
      .select('id, event_id, user_id, status, registered_at, checked_in_at, college, skills')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding registration: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data;
  }

  // ---------------------------------------------------------------------------
  // SCAN LOGS (CHECKIN, LUNCH, DINNER, SWAG)
  // ---------------------------------------------------------------------------

  public async findScanLog(eventId: string, participantId: string, type: ScanType): Promise<ScanLog | null> {
    const { data, error } = await supabase.client
      .from(this.scanLogsTable)
      .select('*')
      .eq('event_id', eventId)
      .eq('participant_id', participantId)
      .eq('type', type)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding scan log: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as ScanLog | null;
  }

  public async createScanLog(data: {
    event_id: string;
    participant_id: string;
    type: ScanType;
    scanned_by?: string | null;
    idempotency_key?: string | null;
  }): Promise<ScanLog> {
    const { data: result, error } = await supabase.client
      .from(this.scanLogsTable)
      .insert({
        event_id: data.event_id,
        participant_id: data.participant_id,
        type: data.type,
        scanned_by: data.scanned_by || null,
        idempotency_key: data.idempotency_key || null,
        scanned_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating scan log: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as ScanLog;
  }

  public async listScanLogs(eventId: string, type?: ScanType): Promise<ScanLog[]> {
    let query = supabase.client
      .from(this.scanLogsTable)
      .select('*')
      .eq('event_id', eventId)
      .order('scanned_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError(`Database error listing scan logs: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as ScanLog[]) || [];
  }

  // ---------------------------------------------------------------------------
  // SEAT REVEAL RESOLUTION
  // ---------------------------------------------------------------------------

  public async resolveParticipantSeatInfo(eventId: string, userId: string): Promise<{ roomName?: string; seatLabel?: string }> {
    try {
      // Find team for user in this event
      const { data: member } = await supabase.client
        .from('team_members')
        .select(`
          team_id,
          teams:team_id (
            id,
            name,
            event_id,
            seat_label,
            rooms:room_id (name)
          )
        `)
        .eq('user_id', userId);

      if (!member || member.length === 0) {
        return {};
      }

      for (const m of member) {
        const t = (m as any).teams;
        if (t && t.event_id === eventId) {
          return {
            roomName: t.rooms?.name || undefined,
            seatLabel: t.seat_label || undefined,
          };
        }
      }

      return {};
    } catch {
      return {};
    }
  }

  // ---------------------------------------------------------------------------
  // OFFLINE ROSTER CACHE
  // ---------------------------------------------------------------------------

  public async getEventOfflineRoster(eventId: string): Promise<any[]> {
    const { data: registrations, error } = await supabase.client
      .from(this.registrationsTable)
      .select(`
        id,
        user_id,
        event_id,
        status,
        checked_in_at,
        users:user_id (id, name, email)
      `)
      .eq('event_id', eventId)
      .eq('status', 'REGISTERED');

    if (error) {
      throw new AppError(`Database error fetching roster: ${error.message}`, 500, 'DB_ERROR', error);
    }

    const roster = await Promise.all(
      (registrations || []).map(async (reg: any) => {
        const seatInfo = await this.resolveParticipantSeatInfo(eventId, reg.user_id);
        return {
          participantId: reg.user_id,
          registrationId: reg.id,
          name: reg.users?.name || 'Participant',
          email: reg.users?.email || '',
          checkedIn: !!reg.checked_in_at,
          room: seatInfo.roomName || null,
          seat: seatInfo.seatLabel || null,
        };
      })
    );

    return roster;
  }

  public async listByEvent(
    eventId: string,
    limit = 50,
    offset = 0
  ): Promise<{ checkins: CheckIn[]; total: number }> {
    const { data, error, count } = await supabase.client
      .from(this.tableName)
      .select(
        `
          *,
          ticket:ticket_id (*),
          user:user_id (id, name, email, role)
        `,
        { count: 'exact' }
      )
      .eq('event_id', eventId)
      .range(offset, offset + limit - 1)
      .order('checked_in_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing event checkins: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return {
      checkins: (data as CheckIn[]) || [],
      total: count || 0,
    };
  }

  public async listByUser(userId: string): Promise<CheckIn[]> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select(
        `
          *,
          ticket:ticket_id (*),
          user:user_id (id, name, email, role)
        `
      )
      .eq('user_id', userId)
      .order('checked_in_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing user checkins: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data as CheckIn[]) || [];
  }

  public async countByEvent(eventId: string): Promise<number> {
    const { count, error } = await supabase.client
      .from(this.registrationsTable)
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .not('checked_in_at', 'is', null);

    if (error) {
      throw new AppError(`Database error counting checkins: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return count || 0;
  }
}

export const checkinRepository = new CheckinRepository();
