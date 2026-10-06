import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  logAudit,
} from '@event-os/config';
import {
  Ticket,
  CreateTicketDTO,
  TicketStatus,
  ValidateTicketResponse,
  PaginatedResponse,
  HelpdeskTicket,
  CreateHelpdeskTicketDTO,
  UpdateHelpdeskTicketDTO,
  HelpdeskCategory,
  HelpdeskStatus,
  UserRole,
} from '@event-os/types';
import { ticketRepository } from '../repositories/ticket.repository';
import crypto from 'crypto';

export class TicketService {
  // ---------------------------------------------------------------------------
  // EVENT TICKETS
  // ---------------------------------------------------------------------------

  public async createTicket(dto: CreateTicketDTO, userId: string): Promise<Ticket> {
    const targetUserId = dto.userId || userId;

    const existing = await ticketRepository.findByEventAndUser(dto.eventId, targetUserId);
    if (existing) {
      throw new ConflictError('User already has an active ticket for this event.');
    }

    const ticketCode = 'TKT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const qrData = JSON.stringify({
      code: ticketCode,
      eventId: dto.eventId,
      userId: targetUserId,
    });

    const ticket = await ticketRepository.createTicket({
      event_id: dto.eventId,
      user_id: targetUserId,
      ticket_code: ticketCode,
      status: TicketStatus.ACTIVE,
      price: dto.price || 0.0,
      qr_data: qrData,
    });

    return ticket;
  }

  public async getTicketById(id: string): Promise<Ticket> {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${id} not found.`);
    }
    return ticket;
  }

  public async getTicketByCode(code: string): Promise<Ticket> {
    const ticket = await ticketRepository.findByCode(code);
    if (!ticket) {
      throw new NotFoundError(`Ticket with code "${code}" not found.`);
    }
    return ticket;
  }

  public async listTickets(params: {
    userId?: string;
    eventId?: string;
    status?: TicketStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Ticket>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const { tickets, total } = await ticketRepository.listTickets({
      userId: params.userId,
      eventId: params.eventId,
      status: params.status,
      limit,
      offset,
    });

    return {
      items: tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async validateTicket(idOrCode: string): Promise<ValidateTicketResponse> {
    let ticket = idOrCode.startsWith('TKT-')
      ? await ticketRepository.findByCode(idOrCode)
      : await ticketRepository.findById(idOrCode);

    if (!ticket) {
      return { valid: false, message: 'Ticket does not exist.' };
    }

    if (ticket.status === TicketStatus.USED) {
      return { valid: false, message: 'Ticket has already been used.', ticket };
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      return { valid: false, message: 'Ticket has been cancelled.', ticket };
    }

    if (ticket.status === TicketStatus.EXPIRED) {
      return { valid: false, message: 'Ticket has expired.', ticket };
    }

    return { valid: true, message: 'Ticket is valid.', ticket };
  }

  public async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${id} not found.`);
    }
    return await ticketRepository.updateStatus(id, status);
  }

  // ---------------------------------------------------------------------------
  // HELPDESK / SUPPORT TICKETS
  // ---------------------------------------------------------------------------

  public async createHelpdeskTicket(
    eventId: string,
    dto: CreateHelpdeskTicketDTO,
    userId: string
  ): Promise<HelpdeskTicket> {
    if (!dto.category || !dto.description) {
      throw new BadRequestError('category and description are required.');
    }

    const ticket = await ticketRepository.createHelpdeskTicket({
      event_id: eventId,
      user_id: userId,
      category: dto.category,
      description: dto.description.trim(),
    });

    await logAudit(eventId, userId, 'HELPDESK_TICKET_CREATED', {
      ticketId: ticket.id,
      category: ticket.category,
      room: ticket.seatInfo?.roomName,
      seat: ticket.seatInfo?.seatLabel,
    });

    return ticket;
  }

  public async listHelpdeskTickets(
    eventId: string,
    userId: string,
    userRole: UserRole,
    category?: HelpdeskCategory,
    status?: HelpdeskStatus
  ): Promise<HelpdeskTicket[]> {
    const isSeniorOrganizer = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const isVolunteerOrStaff = userRole === UserRole.TEAM_LEAD;

    // Normal participants only see their own tickets
    const queryUserId = (!isSeniorOrganizer && !isVolunteerOrStaff) ? userId : undefined;

    return await ticketRepository.listHelpdeskTickets({
      eventId,
      category,
      status,
      userId: queryUserId,
      isSeniorOrganizer,
    });
  }

  public async getHelpdeskTicketById(id: string, userId: string, userRole: UserRole): Promise<HelpdeskTicket> {
    const ticket = await ticketRepository.findHelpdeskTicketById(id);
    if (!ticket) {
      throw new NotFoundError(`Helpdesk ticket with ID ${id} not found.`);
    }

    const isSeniorOrganizer = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if ((ticket.category === HelpdeskCategory.SAFETY || ticket.category === HelpdeskCategory.HARASSMENT) && !isSeniorOrganizer && ticket.user_id !== userId) {
      throw new ForbiddenError('Access to safety tickets is restricted to senior organizers.');
    }

    return ticket;
  }

  public async updateHelpdeskTicket(
    id: string,
    dto: UpdateHelpdeskTicketDTO,
    userId: string,
    userRole: UserRole
  ): Promise<HelpdeskTicket> {
    const ticket = await ticketRepository.findHelpdeskTicketById(id);
    if (!ticket) {
      throw new NotFoundError(`Helpdesk ticket with ID ${id} not found.`);
    }

    const isAuthorized = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN || userRole === UserRole.TEAM_LEAD;
    if (!isAuthorized) {
      throw new ForbiddenError('Only organizers and staff can update helpdesk tickets.');
    }

    const updated = await ticketRepository.updateHelpdeskTicket(id, {
      status: dto.status,
      assigned_to: dto.assignedTo,
      resolved_notes: dto.resolvedNotes,
    });

    await logAudit(ticket.event_id, userId, 'HELPDESK_TICKET_UPDATED', {
      ticketId: id,
      newStatus: dto.status,
      assignedTo: dto.assignedTo,
    });

    return updated;
  }
}

export const ticketService = new TicketService();
