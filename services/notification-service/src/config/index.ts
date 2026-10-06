import { env } from '@event-os/config';

export const config = {
  port: env.PORT_NOTIFICATION,
  jwtSecret: env.JWT_SECRET,
};
