import { supabase, AppError } from '@event-os/config';
import {
  Ticket,
  TicketStatus,
  HelpdeskTicket,
  HelpdeskCategory,
  HelpdeskStatus,
} from '@event-os/types';

export class TicketRepository {
  private tableName = 'tickets';
  private helpdeskTable = 'helpdesk_tickets';

  // ---------------------------------------------------------------------------
  // EVENT TICKETS
  // ---------------------------------------------------------------------------

  public async createTicket(data: {
    event_id: string;
    user_id: string;
    ticket_code: string;
    status: TicketStatus;
    price: number;
    qr_data: string;
  }): Promise<Ticket> {
    const { data: result, error } = await supabase.client
      .from(this.tableName)
      .insert(data)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error creating ticket: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return result as Ticket;
  }

  public async findById(id: string): Promise<Ticket | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select(`
        *,
        event:event_id (*),
        user:user_id (id, name, email, role)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding ticket by ID: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Ticket | null;
  }

  public async findByCode(ticketCode: string): Promise<Ticket | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select(`
        *,
        event:event_id (*),
        user:user_id (id, name, email, role)
      `)
      .eq('ticket_code', ticketCode)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding ticket by code: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Ticket | null;
  }

  public async findByEventAndUser(eventId: string, userId: string): Promise<Ticket | null> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .in('status', [TicketStatus.ACTIVE, TicketStatus.USED])
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error checking ticket: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Ticket | null;
  }

  public async listTickets(params: {
    userId?: string;
    eventId?: string;
    status?: TicketStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const { userId, eventId, status, limit = 20, offset = 0 } = params;

    let query = supabase.client.from(this.tableName).select(
      `
        *,
        event:event_id (*),
        user:user_id (id, name, email, role)
      `,
      { count: 'exact' }
    );

    if (userId) query = query.eq('user_id', userId);
    if (eventId) query = query.eq('event_id', eventId);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Database error listing tickets: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return {
      tickets: (data as Ticket[]) || [],
      total: count || 0,
    };
  }

  public async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const { data, error } = await supabase.client
      .from(this.tableName)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Database error updating ticket status: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data as Ticket;
  }

  public async countActiveByEvent(eventId: string): Promise<number> {
    const { count, error } = await supabase.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', [TicketStatus.ACTIVE, TicketStatus.USED]);

    if (error) {
      throw new AppError(`Database error counting tickets: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return count || 0;
  }

  // ---------------------------------------------------------------------------
  // HELPDESK / SUPPORT TICKETS
  // ---------------------------------------------------------------------------

  public async createHelpdeskTicket(data: {
    event_id: string;
    user_id: string;
    category: HelpdeskCategory;
    description: string;
  }): Promise<HelpdeskTicket> {
    // Automatically derive team_id from trusted database data
    const { data: member } = await supabase.client
      .from('team_members')
      .select(`
        team_id,
        teams:team_id (
          id,
          event_id
        )
      `)
      .eq('user_id', data.user_id);

    let resolvedTeamId: string | null = null;
    if (member && member.length > 0) {
      for (const m of member) {
        if ((m as any).teams?.event_id === data.event_id) {
          resolvedTeamId = m.team_id;
          break;
        }
      }
    }

    const { data: result, error } = await supabase.client
      .from(this.helpdeskTable)
      .insert({
        event_id: data.event_id,
        user_id: data.user_id,
        team_id: resolvedTeamId,
        category: data.category,
        description: data.description,
        status: HelpdeskStatus.OPEN,
      })
      .select(`
        *,
        user:user_id (id, name, email, role),
        team:team_id (id, name, seat_label, rooms:room_id (name))
      `)
      .single();

    if (error) {
      throw new AppError(`Database error creating helpdesk ticket: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return this.mapHelpdeskRow(result);
  }

  public async listHelpdeskTickets(params: {
    eventId: string;
    category?: HelpdeskCategory;
    status?: HelpdeskStatus;
    userId?: string;
    isSeniorOrganizer: boolean;
  }): Promise<HelpdeskTicket[]> {
    let query = supabase.client
      .from(this.helpdeskTable)
      .select(`
        *,
        user:user_id (id, name, email, role),
        team:team_id (id, name, seat_label, rooms:room_id (name))
      `)
      .eq('event_id', params.eventId)
      .order('created_at', { ascending: false });

    if (params.category) query = query.eq('category', params.category);
    if (params.status) query = query.eq('status', params.status);
    if (params.userId) query = query.eq('user_id', params.userId);

    // CRITICAL: Safety tickets (SAFETY, HARASSMENT) must only be visible to senior organizers
    if (!params.isSeniorOrganizer && !params.userId) {
      query = query.not('category', 'in', '("SAFETY","HARASSMENT")');
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError(`Database error listing helpdesk tickets: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return (data || []).map((row: any) => this.mapHelpdeskRow(row));
  }

  public async findHelpdeskTicketById(id: string): Promise<HelpdeskTicket | null> {
    const { data, error } = await supabase.client
      .from(this.helpdeskTable)
      .select(`
        *,
        user:user_id (id, name, email, role),
        team:team_id (id, name, seat_label, rooms:room_id (name))
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(`Database error finding helpdesk ticket: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return data ? this.mapHelpdeskRow(data) : null;
  }

  public async updateHelpdeskTicket(
    id: string,
    updates: {
      status?: HelpdeskStatus;
      assigned_to?: string | null;
      resolved_notes?: string;
    }
  ): Promise<HelpdeskTicket> {
    const payload: Record<string, unknown> = {};
    if (updates.status) payload.status = updates.status;
    if (updates.assigned_to !== undefined) {
      payload.assigned_to = updates.assigned_to;
      payload.assigned_at = new Date().toISOString();
    }
    if (updates.status === HelpdeskStatus.RESOLVED) {
      payload.resolved_at = new Date().toISOString();
    }
    if (updates.resolved_notes !== undefined) {
      payload.resolved_notes = updates.resolved_notes;
    }

    const { data, error } = await supabase.client
      .from(this.helpdeskTable)
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        user:user_id (id, name, email, role),
        team:team_id (id, name, seat_label, rooms:room_id (name))
      `)
      .single();

    if (error) {
      throw new AppError(`Database error updating helpdesk ticket: ${error.message}`, 500, 'DB_ERROR', error);
    }

    return this.mapHelpdeskRow(data);
  }

  private mapHelpdeskRow(row: any): HelpdeskTicket {
    const createdTime = new Date(row.created_at).getTime();
    const endTime = row.resolved_at ? new Date(row.resolved_at).getTime() : Date.now();
    const elapsedMinutes = Math.floor((endTime - createdTime) / 60000);

    return {
      id: row.id,
      event_id: row.event_id,
      user_id: row.user_id,
      team_id: row.team_id,
      category: row.category,
      description: row.description,
      status: row.status,
      assigned_to: row.assigned_to,
      created_at: row.created_at,
      assigned_at: row.assigned_at,
      resolved_at: row.resolved_at,
      resolved_notes: row.resolved_notes,
      user: row.user,
      team: row.team,
      seatInfo: {
        roomName: row.team?.rooms?.name || undefined,
        seatLabel: row.team?.seat_label || undefined,
      },
      elapsedMinutes,
    };
  }
}

export const ticketRepository = new TicketRepository();
