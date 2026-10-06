import { env } from '@event-os/config';

export const config = {
  port: env.PORT_EVENT,
  jwtSecret: env.JWT_SECRET,
  notificationServiceUrl: env.NOTIFICATION_SERVICE_URL,
};
