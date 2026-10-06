import { env } from './env';

export const serviceUrls = {
  gateway: env.API_GATEWAY_URL,
  auth: env.AUTH_SERVICE_URL,
  event: env.EVENT_SERVICE_URL,
  team: env.TEAM_SERVICE_URL,
  ticket: env.TICKET_SERVICE_URL,
  checkin: env.CHECKIN_SERVICE_URL,
  announcement: env.ANNOUNCEMENT_SERVICE_URL,
  notification: env.NOTIFICATION_SERVICE_URL,
};
