import { env } from '@event-os/config';

export const config = {
  port: env.PORT_TICKET,
  jwtSecret: env.JWT_SECRET,
  eventServiceUrl: env.EVENT_SERVICE_URL,
  notificationServiceUrl: env.NOTIFICATION_SERVICE_URL,
};
