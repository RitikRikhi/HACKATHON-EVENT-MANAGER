import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger, errorHandler, notFoundHandler, sendSuccess } from '@event-os/config';
import { config } from './config';
import checkinRoutes from './routes/checkin.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger('CHECKIN-SERVICE'));

app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'healthy', service: 'checkin-service', timestamp: new Date().toISOString() });
});

app.use('/checkin', checkinRoutes);
app.use('/', checkinRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`✅ [Check-in Service] listening on port ${config.port}`);
});

process.on('SIGTERM', () => {
  console.log('[Check-in Service] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Check-in Service] HTTP server closed');
  });
});

export default app;
