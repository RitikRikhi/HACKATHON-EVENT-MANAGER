import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { TicketStatus, HelpdeskCategory, HelpdeskStatus } from '@event-os/types';
import { ticketService } from '../services/ticket.service';
import { validateCreateTicketInput } from '../validations/ticket.validation';

export class TicketController {
  // ---------------------------------------------------------------------------
  // EVENT TICKETING
  // ---------------------------------------------------------------------------

  public async createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const validatedData = validateCreateTicketInput(req.body);
      const ticket = await ticketService.createTicket(validatedData, req.user.userId);
      sendSuccess(res, ticket, 'Ticket created successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const ticket = await ticketService.getTicketById(id);
      sendSuccess(res, ticket, 'Ticket retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getTicketByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const ticket = await ticketService.getTicketByCode(code);
      sendSuccess(res, ticket, 'Ticket retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async listTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.userId as string | undefined;
      const eventId = req.query.eventId as string | undefined;
      const status = req.query.status as TicketStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await ticketService.listTickets({ userId, eventId, status, page, limit });
      sendSuccess(res, result, 'Tickets retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async validateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrCode = (req.params.id || req.body.ticketCode) as string;
      const result = await ticketService.validateTicket(idOrCode);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  public async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const status = req.body.status as TicketStatus;
      if (!status) throw new BadRequestError('Status is required.');

      const updated = await ticketService.updateStatus(id, status);
      sendSuccess(res, updated, 'Ticket status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // HELPDESK / SUPPORT TICKETS
  // ---------------------------------------------------------------------------

  public async createHelpdeskTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const eventId = (req.body.eventId || req.params.eventId) as string;
      if (!eventId) throw new BadRequestError('eventId is required.');

      const ticket = await ticketService.createHelpdeskTicket(eventId, req.body, req.user.userId);
      sendSuccess(res, ticket, 'Helpdesk ticket submitted successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listHelpdeskTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const eventId = (req.query.eventId || req.params.eventId) as string;
      if (!eventId) throw new BadRequestError('eventId is required.');

      const category = req.query.category as HelpdeskCategory | undefined;
      const status = req.query.status as HelpdeskStatus | undefined;

      const tickets = await ticketService.listHelpdeskTickets(
        eventId,
        req.user.userId,
        req.user.role,
        category,
        status
      );
      sendSuccess(res, tickets, 'Helpdesk tickets retrieved');
    } catch (error) {
      next(error);
    }
  }

  public async getHelpdeskTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const ticket = await ticketService.getHelpdeskTicketById(id, req.user.userId, req.user.role);
      sendSuccess(res, ticket, 'Helpdesk ticket details retrieved');
    } catch (error) {
      next(error);
    }
  }

  public async updateHelpdeskTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) throw new UnauthorizedError('User authentication required.');
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await ticketService.updateHelpdeskTicket(id, req.body, req.user.userId, req.user.role);
      sendSuccess(res, updated, 'Helpdesk ticket updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getHealth(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, { status: 'Operational', service: 'ticket-service', timestamp: new Date().toISOString() });
  }
}

export const ticketController = new TicketController();
