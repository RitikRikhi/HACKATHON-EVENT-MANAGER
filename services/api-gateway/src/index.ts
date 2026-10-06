import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { sendSuccess, errorHandler, notFoundHandler, supabase } from '@event-os/config';
import { config } from './config';
import { forwardAuthHeader } from './middlewares/auth-forward.middleware';
import proxyRoutes from './routes/proxy.routes';

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Forward Auth context to headers
app.use(forwardAuthHeader);

// Health check
app.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'Operational',
    gateway: 'event-os-api-gateway',
    timestamp: new Date().toISOString(),
    services: config.services,
  });
});

app.get('/api/health', (_req, res) => {
  sendSuccess(res, {
    status: 'Operational',
    gateway: 'event-os-api-gateway',
    timestamp: new Date().toISOString(),
    services: config.services,
  });
});

// Comprehensive System Status Endpoint (Section 31 of prompt)
app.get('/api/system/status', async (_req, res) => {
  let dbStatus = 'Operational';
  try {
    const { error } = await supabase.client.from('events').select('id').limit(1);
    if (error) dbStatus = 'Degraded';
  } catch {
    dbStatus = 'Unavailable';
  }

  sendSuccess(res, {
    systemStatus: {
      API: 'Operational',
      Database: dbStatus,
      Storage: 'Operational',
      Realtime: 'Operational',
    },
    services: {
      gateway: 'Operational',
      auth: config.services.auth,
      event: config.services.event,
      team: config.services.team,
      ticket: config.services.ticket,
      checkin: config.services.checkin,
      announcement: config.services.announcement,
      notification: config.services.notification,
    },
    timestamp: new Date().toISOString(),
  }, 'System status summary');
});

// Root API Discovery
app.get('/', (_req, res) => {
  sendSuccess(res, {
    message: 'Welcome to Event OS Microservices API Gateway',
    version: '1.0.0',
    documentation: 'See README.md for complete endpoint documentation',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      teams: '/api/teams',
      tickets: '/api/tickets',
      helpdesk: '/api/helpdesk',
      checkin: '/api/checkin',
      announcements: '/api/announcements',
      chat: '/api/chat',
      questions: '/api/questions',
      polls: '/api/polls',
      submissions: '/api/submissions',
      results: '/api/results',
      remarks: '/api/remarks',
      uploads: '/api/uploads',
      notifications: '/api/notifications',
      systemStatus: '/api/system/status',
    },
  });
});

// Proxy routes to microservices
app.use('/', proxyRoutes);

// Fallthrough Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🌐 [API Gateway] running on port ${config.port}`);
  console.log(`   Routing map:`);
  console.log(`   /api/auth          -> ${config.services.auth}`);
  console.log(`   /api/events        -> ${config.services.event}`);
  console.log(`   /api/teams         -> ${config.services.team}`);
  console.log(`   /api/tickets       -> ${config.services.ticket}`);
  console.log(`   /api/helpdesk      -> ${config.services.ticket}/helpdesk`);
  console.log(`   /api/checkin       -> ${config.services.checkin}`);
  console.log(`   /api/announcements -> ${config.services.announcement}`);
  console.log(`   /api/chat          -> ${config.services.announcement}/chat`);
  console.log(`   /api/questions     -> ${config.services.announcement}/questions`);
  console.log(`   /api/polls         -> ${config.services.announcement}/polls`);
  console.log(`   /api/submissions   -> ${config.services.event}/submissions`);
  console.log(`   /api/results       -> ${config.services.event}/results`);
  console.log(`   /api/remarks       -> ${config.services.event}/remarks`);
  console.log(`   /api/uploads       -> ${config.services.event}/uploads`);
  console.log(`   /api/notifications -> ${config.services.notification}`);
});

process.on('SIGTERM', () => {
  console.log('[API Gateway] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[API Gateway] HTTP server closed');
  });
});

export default app;
