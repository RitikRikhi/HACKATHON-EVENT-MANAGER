import { BadRequestError } from '@event-os/config';
import { CreateEventDTO, UpdateEventDTO, EventStatus, EventType } from '@event-os/types';

export const validateCreateEventInput = (data: Partial<CreateEventDTO>): CreateEventDTO => {
  const { name, description, eventType, venue, startDate, endDate, registrationDeadline, capacity, status } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new BadRequestError('Event name is required and must be at least 2 characters long.');
  }

  if (!venue || typeof venue !== 'string' || venue.trim().length < 2) {
    throw new BadRequestError('Event venue is required.');
  }

  if (!startDate || isNaN(Date.parse(startDate))) {
    throw new BadRequestError('A valid start date is required (ISO 8601 string).');
  }

  if (!endDate || isNaN(Date.parse(endDate))) {
    throw new BadRequestError('A valid end date is required (ISO 8601 string).');
  }

  if (new Date(endDate) <= new Date(startDate)) {
    throw new BadRequestError('End date must be after the start date.');
  }

  if (registrationDeadline !== undefined && registrationDeadline !== null) {
    if (isNaN(Date.parse(registrationDeadline))) {
      throw new BadRequestError('Registration deadline must be a valid date.');
    }
    if (new Date(registrationDeadline) > new Date(startDate)) {
      throw new BadRequestError('Registration deadline must be before or on the event start date.');
    }
  }

  if (capacity === undefined || typeof capacity !== 'number' || capacity < 1) {
    throw new BadRequestError('Capacity must be a positive integer of at least 1.');
  }

  if (eventType && !Object.values(EventType).includes(eventType)) {
    throw new BadRequestError(
      `Invalid event type. Allowed: ${Object.values(EventType).join(', ')}`
    );
  }

  if (status && !Object.values(EventStatus).includes(status)) {
    throw new BadRequestError(
      `Invalid event status. Allowed: ${Object.values(EventStatus).join(', ')}`
    );
  }

  return {
    name: name.trim(),
    description: description ? description.trim() : undefined,
    eventType: eventType || EventType.OTHER,
    venue: venue.trim(),
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    registrationDeadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : undefined,
    capacity: Math.floor(capacity),
    status: status || EventStatus.DRAFT,
  };
};

export const validateUpdateEventInput = (data: Record<string, unknown>): UpdateEventDTO => {
  const { name, description, eventType, venue, startDate, endDate, registrationDeadline, capacity, status, id, created_by, createdBy, created_at, createdAt } = data;

  // Reject protected fields
  if (id !== undefined || created_by !== undefined || createdBy !== undefined || created_at !== undefined || createdAt !== undefined) {
    throw new BadRequestError('Cannot modify protected system fields (id, createdBy, createdAt).');
  }

  const updateData: UpdateEventDTO = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      throw new BadRequestError('Event name must be at least 2 characters long.');
    }
    updateData.name = name.trim();
  }

  if (description !== undefined) {
    updateData.description = typeof description === 'string' ? description.trim() : '';
  }

  if (eventType !== undefined) {
    if (!Object.values(EventType).includes(eventType as EventType)) {
      throw new BadRequestError(`Invalid event type. Allowed: ${Object.values(EventType).join(', ')}`);
    }
    updateData.eventType = eventType as EventType;
  }

  if (venue !== undefined) {
    if (typeof venue !== 'string' || venue.trim().length < 2) {
      throw new BadRequestError('Event venue cannot be empty.');
    }
    updateData.venue = venue.trim();
  }

  if (startDate !== undefined) {
    if (isNaN(Date.parse(startDate as string))) {
      throw new BadRequestError('Start date must be a valid date.');
    }
    updateData.startDate = new Date(startDate as string).toISOString();
  }

  if (endDate !== undefined) {
    if (isNaN(Date.parse(endDate as string))) {
      throw new BadRequestError('End date must be a valid date.');
    }
    updateData.endDate = new Date(endDate as string).toISOString();
  }

  if (updateData.startDate && updateData.endDate) {
    if (new Date(updateData.endDate) <= new Date(updateData.startDate)) {
      throw new BadRequestError('End date must be after the start date.');
    }
  }

  if (registrationDeadline !== undefined) {
    if (registrationDeadline !== null) {
      if (isNaN(Date.parse(registrationDeadline as string))) {
        throw new BadRequestError('Registration deadline must be a valid date.');
      }
      updateData.registrationDeadline = new Date(registrationDeadline as string).toISOString();
    } else {
      updateData.registrationDeadline = undefined;
    }
  }

  if (capacity !== undefined) {
    if (typeof capacity !== 'number' || capacity < 1) {
      throw new BadRequestError('Capacity must be a positive integer.');
    }
    updateData.capacity = Math.floor(capacity);
  }

  if (status !== undefined) {
    if (!Object.values(EventStatus).includes(status as EventStatus)) {
      throw new BadRequestError(`Invalid status. Allowed: ${Object.values(EventStatus).join(', ')}`);
    }
    updateData.status = status as EventStatus;
  }

  return updateData;
};

export const validateStatusTransition = (
  currentStatus: EventStatus,
  nextStatus: EventStatus
): void => {
  if (currentStatus === nextStatus) return;

  const validTransitions: Record<EventStatus, EventStatus[]> = {
    [EventStatus.DRAFT]: [EventStatus.PUBLISHED, EventStatus.UPCOMING, EventStatus.CANCELLED],
    [EventStatus.PUBLISHED]: [EventStatus.UPCOMING, EventStatus.ONGOING, EventStatus.CANCELLED],
    [EventStatus.UPCOMING]: [EventStatus.ONGOING, EventStatus.CANCELLED],
    [EventStatus.ONGOING]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
    [EventStatus.COMPLETED]: [],
    [EventStatus.CANCELLED]: [],
  };

  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new BadRequestError(
      `Invalid event status transition from "${currentStatus}" to "${nextStatus}".`
    );
  }
};
