import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger, errorHandler, notFoundHandler, sendSuccess } from '@event-os/config';
import { config } from './config';
import authRoutes from './routes/auth.routes';

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger('AUTH-SERVICE'));

// Health Check
app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Routes - Mount both at /auth and / for flexibility
app.use('/auth', authRoutes);
app.use('/', authRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, () => {
  console.log(`🚀 [Auth Service] listening on port ${config.port}`);
});

process.on('SIGTERM', () => {
  console.log('[Auth Service] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Auth Service] HTTP server closed');
  });
});

export default app;
