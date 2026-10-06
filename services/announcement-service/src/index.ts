import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger, errorHandler, notFoundHandler, sendSuccess } from '@event-os/config';
import { config } from './config';
import announcementRoutes from './routes/announcement.routes';
import chatRoutes from './routes/chat.routes';
import questionRoutes from './routes/question.routes';
import pollRoutes from './routes/poll.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger('ANNOUNCEMENT-SERVICE'));

app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'healthy', service: 'announcement-service', timestamp: new Date().toISOString() });
});

// Mounted feature routers
app.use('/chat', chatRoutes);
app.use('/questions', questionRoutes);
app.use('/polls', pollRoutes);
app.use('/announcements', announcementRoutes);
app.use('/', announcementRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`📢 [Announcement Service] listening on port ${config.port}`);
});

process.on('SIGTERM', () => {
  console.log('[Announcement Service] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[Announcement Service] HTTP server closed');
  });
});

export default app;
