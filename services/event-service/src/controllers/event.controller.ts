import { Request, Response, NextFunction } from 'express';
import { sendSuccess, HttpStatusCodes, UnauthorizedError, BadRequestError } from '@event-os/config';
import { EventFilterQuery, EventType, EventStatus, UserRole, EventMemberRole } from '@event-os/types';
import { eventService } from '../services/event.service';
import { validateCreateEventInput, validateUpdateEventInput } from '../validations/event.validation';

export class EventController {
  public async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: EventFilterQuery = {
        eventType: req.query.eventType as EventType,
        status: req.query.status as EventStatus,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await eventService.listEvents(query, req.user?.userId);
      sendSuccess(res, result, 'Events retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await eventService.getEventById(id, req.user?.userId);
      sendSuccess(res, event, 'Event retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getEventByJoinCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.params.code as string;
      const event = await eventService.getEventByJoinCode(code);
      sendSuccess(res, event, 'Event found by join code');
    } catch (error) {
      next(error);
    }
  }

  public async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const validatedData = validateCreateEventInput(req.body);
      const newEvent = await eventService.createEvent(validatedData, req.user.userId);
      sendSuccess(res, newEvent, 'Event created successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = validateUpdateEventInput(req.body);
      const updatedEvent = await eventService.updateEvent(id, validatedData, req.user.userId, req.user.role);
      sendSuccess(res, updatedEvent, 'Event updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public async publishEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const publishedEvent = await eventService.publishEvent(id, req.user.userId, req.user.role);
      sendSuccess(res, publishedEvent, 'Event published successfully');
    } catch (error) {
      next(error);
    }
  }

  public async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await eventService.deleteEvent(id, req.user.userId, req.user.role);
      sendSuccess(res, { deleted: true }, 'Event deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // REGISTRATION & PARTICIPANT HANDLERS
  // ---------------------------------------------------------------------------

  public async registerForEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const registration = await eventService.registerForEvent(id, req.user.userId, req.body);
      sendSuccess(res, registration, 'Successfully registered for event', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async updateParticipantProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const registration = await eventService.updateParticipantProfile(id, req.user.userId, req.body);
      sendSuccess(res, registration, 'Participant profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public async cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const cancelled = await eventService.cancelRegistration(id, req.user.userId);
      sendSuccess(res, cancelled, 'Event registration cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getUserRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const registration = await eventService.getUserRegistration(id, req.user.userId);
      sendSuccess(res, registration, 'Registration details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getEventParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await eventService.getEventParticipants(id, page, limit);
      sendSuccess(res, result, 'Event participants retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getLookingForTeamPool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const pool = await eventService.getLookingForTeamPool(id);
      sendSuccess(res, pool, 'Looking for team pool retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async toggleLookingForTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const lookingForTeam = req.body.lookingForTeam ?? true;
      const updated = await eventService.toggleLookingForTeam(id, req.user.userId, lookingForTeam);
      sendSuccess(res, updated, 'Looking for team status updated');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // EVENT MEMBERS & ROLES
  // ---------------------------------------------------------------------------

  public async listEventMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const members = await eventService.listEventMembers(id);
      sendSuccess(res, members, 'Event members retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async addEventMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { userId, role } = req.body;
      if (!userId || !role) {
        throw new BadRequestError('userId and role are required.');
      }

      const member = await eventService.addEventMember(id, userId, role as EventMemberRole, req.user.userId, req.user.role);
      sendSuccess(res, member, 'Event member added successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async removeEventMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const targetUserId = req.params.userId as string;

      await eventService.removeEventMember(id, targetUserId, req.user.userId, req.user.role);
      sendSuccess(res, { removed: true }, 'Event member removed successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // TRACKS, ROOMS & SEATS
  // ---------------------------------------------------------------------------

  public async createTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, description } = req.body;
      if (!name) throw new BadRequestError('Track name is required.');

      const track = await eventService.createTrack(id, name, description);
      sendSuccess(res, track, 'Track created successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listTracks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const tracks = await eventService.listTracks(id);
      sendSuccess(res, tracks, 'Tracks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, capacity } = req.body;
      if (!name || capacity === undefined) throw new BadRequestError('Room name and capacity are required.');

      const room = await eventService.createRoom(id, name, Number(capacity));
      sendSuccess(res, room, 'Room created successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const rooms = await eventService.listRooms(id);
      sendSuccess(res, rooms, 'Rooms retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async listSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const seats = await eventService.listSeats(id);
      sendSuccess(res, seats, 'Seats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async allocateSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await eventService.allocateSeats(id, req.user.userId, req.user.role);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  public async manualSeatAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { teamId, roomId, seatLabel } = req.body;
      if (!teamId || !roomId || !seatLabel) {
        throw new BadRequestError('teamId, roomId, and seatLabel are required.');
      }

      const result = await eventService.manualSeatAssignment(id, teamId, roomId, seatLabel, req.user.userId, req.user.role);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  public async swapSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { teamAId, teamBId } = req.body;
      if (!teamAId || !teamBId) {
        throw new BadRequestError('teamAId and teamBId are required.');
      }

      const result = await eventService.swapSeats(id, teamAId, teamBId, req.user.userId, req.user.role);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // PROJECTOR / SCREEN VIEW
  // ---------------------------------------------------------------------------

  public async getScreenDisplay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const screenData = await eventService.getScreenDisplayData(id);
      sendSuccess(res, screenData, 'Display screen data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // SPONSORS & ANALYTICS
  // ---------------------------------------------------------------------------

  public async createSponsor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, bannerUrl, link } = req.body;
      if (!name) throw new BadRequestError('Sponsor name is required.');

      const sponsor = await eventService.createSponsor(id, name, bannerUrl, link);
      sendSuccess(res, sponsor, 'Sponsor added successfully', HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public async listSponsors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const sponsors = await eventService.listSponsors(id);
      sendSuccess(res, sponsors, 'Sponsors retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const analytics = await eventService.getAggregateAnalytics(id);
      sendSuccess(res, analytics, 'Aggregate analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // EXPORT, CLOSE & RETENTION CLEANUP
  // ---------------------------------------------------------------------------

  public async generateExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const exportData = await eventService.generateEventExport(id, req.user.userId, req.user.role);
      sendSuccess(res, exportData, 'Event export generated successfully');
    } catch (error) {
      next(error);
    }
  }

  public async closeEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const closedEvent = await eventService.closeEvent(id, req.user.userId, req.user.role);
      sendSuccess(res, closedEvent, 'Event closed successfully');
    } catch (error) {
      next(error);
    }
  }

  public async runRetentionCleanup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('User authentication required.');
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const receipt = await eventService.runRetentionCleanup(id, req.user.userId, req.user.role);
      sendSuccess(res, receipt, 'Retention cleanup executed. Deletion receipt generated.');
    } catch (error) {
      next(error);
    }
  }

  public async getDeletionReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const receipt = await eventService.getDeletionReceipt(id);
      sendSuccess(res, receipt, 'Deletion receipt retrieved');
    } catch (error) {
      next(error);
    }
  }

  public async getHealth(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, { status: 'Operational', service: 'event-service', timestamp: new Date().toISOString() });
  }
}

export const eventController = new EventController();
