import { env } from '@event-os/config';

export const config = {
  port: env.PORT_CHECKIN,
  jwtSecret: env.JWT_SECRET,
  ticketServiceUrl: env.TICKET_SERVICE_URL,
  notificationServiceUrl: env.NOTIFICATION_SERVICE_URL,
};
