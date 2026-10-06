import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'event_os_jwt_default_secret_key_change_in_production_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://mock-event-os.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'mock-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'mock-service-role-key',
  DATABASE_URL: process.env.DATABASE_URL || '',

  // SMTP Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '2525', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  EMAIL_FROM: process.env.EMAIL_FROM || '"Event OS" <noreply@eventos.com>',

  // Service Ports
  PORT_GATEWAY: parseInt(process.env.PORT_GATEWAY || '8000', 10),
  PORT_AUTH: parseInt(process.env.PORT_AUTH || '8001', 10),
  PORT_EVENT: parseInt(process.env.PORT_EVENT || '8002', 10),
  PORT_TEAM: parseInt(process.env.PORT_TEAM || '8003', 10),
  PORT_TICKET: parseInt(process.env.PORT_TICKET || '8004', 10),
  PORT_CHECKIN: parseInt(process.env.PORT_CHECKIN || '8005', 10),
  PORT_ANNOUNCEMENT: parseInt(process.env.PORT_ANNOUNCEMENT || '8006', 10),
  PORT_NOTIFICATION: parseInt(process.env.PORT_NOTIFICATION || '8007', 10),

  // Service URLs
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:8000',
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
  EVENT_SERVICE_URL: process.env.EVENT_SERVICE_URL || 'http://localhost:8002',
  TEAM_SERVICE_URL: process.env.TEAM_SERVICE_URL || 'http://localhost:8003',
  TICKET_SERVICE_URL: process.env.TICKET_SERVICE_URL || 'http://localhost:8004',
  CHECKIN_SERVICE_URL: process.env.CHECKIN_SERVICE_URL || 'http://localhost:8005',
  ANNOUNCEMENT_SERVICE_URL: process.env.ANNOUNCEMENT_SERVICE_URL || 'http://localhost:8006',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8007',
};
