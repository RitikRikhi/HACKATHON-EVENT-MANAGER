import { env } from '@event-os/config';

export const config = {
  port: env.PORT_GATEWAY,
  jwtSecret: env.JWT_SECRET,
  services: {
    auth: env.AUTH_SERVICE_URL,
    event: env.EVENT_SERVICE_URL,
    team: env.TEAM_SERVICE_URL,
    ticket: env.TICKET_SERVICE_URL,
    checkin: env.CHECKIN_SERVICE_URL,
    announcement: env.ANNOUNCEMENT_SERVICE_URL,
    notification: env.NOTIFICATION_SERVICE_URL,
  },
};
