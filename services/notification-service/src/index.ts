import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger, errorHandler, notFoundHandler, sendSuccess } from '@event-os/config';
import { config } from './config';
import notificationRoutes from './routes/notification.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger('NOTIFICATION-SERVICE'));

app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'healthy', service: 'notification-service', timestamp: new Date().toISOString() });
});

app.use('/notifications', notificationRoutes);
app.use('/', notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🔔 [Notification Service] listening on port ${config.port}`);
});

process.on('SIGTERM', () => {
  console.log('[Notification Service] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Notification Service] HTTP server closed');
  });
});

export default app;
