import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger, errorHandler, notFoundHandler, sendSuccess } from '@event-os/config';
import { config } from './config';
import eventRoutes from './routes/event.routes';
import submissionRoutes from './routes/submission.routes';
import resultRoutes from './routes/result.routes';
import remarkRoutes from './routes/remark.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(requestLogger('EVENT-SERVICE'));

app.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'Operational',
    service: 'event-service',
    timestamp: new Date().toISOString(),
  });
});

// Mounted feature routers
app.use('/submissions', submissionRoutes);
app.use('/results', resultRoutes);
app.use('/remarks', remarkRoutes);
app.use('/uploads', uploadRoutes);
app.use('/events', eventRoutes);
app.use('/', eventRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`📅 [Event Service] listening on port ${config.port}`);
});

process.on('SIGTERM', () => {
  console.log('[Event Service] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Event Service] HTTP server closed');
  });
});

export default app;
