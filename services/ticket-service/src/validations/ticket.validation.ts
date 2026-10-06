import { BadRequestError } from '@event-os/config';
import { CreateTicketDTO } from '@event-os/types';

export const validateCreateTicketInput = (data: Partial<CreateTicketDTO>): CreateTicketDTO => {
  const { eventId, userId, price } = data;

  if (!eventId || typeof eventId !== 'string') {
    throw new BadRequestError('A valid eventId (UUID) is required.');
  }

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    throw new BadRequestError('Price must be a non-negative number.');
  }

  return {
    eventId: eventId.trim(),
    userId: userId ? userId.trim() : undefined,
    price: price !== undefined ? price : 0,
  };
};
