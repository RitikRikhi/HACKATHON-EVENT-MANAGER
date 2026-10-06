import { BadRequestError } from '@event-os/config';
import { ProcessCheckInDTO } from '@event-os/types';

export const validateCheckInInput = (data: Partial<ProcessCheckInDTO>): ProcessCheckInDTO => {
  const { ticketCode, ticketId, eventId, notes } = data;

  if (!ticketCode && !ticketId) {
    throw new BadRequestError('Either ticketCode or ticketId must be provided.');
  }

  if (!eventId || typeof eventId !== 'string') {
    throw new BadRequestError('A valid eventId (UUID) is required.');
  }

  return {
    ticketCode: ticketCode ? ticketCode.trim() : undefined,
    ticketId: ticketId ? ticketId.trim() : undefined,
    eventId: eventId.trim(),
    notes: notes ? notes.trim() : undefined,
  };
};
