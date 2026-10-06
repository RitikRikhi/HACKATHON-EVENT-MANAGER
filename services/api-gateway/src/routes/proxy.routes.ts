import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { sendError, HttpStatusCodes } from '@event-os/config';

const router = Router();

const createServiceProxy = (target: string, pathRewrite?: Record<string, string>) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      proxyReq: (proxyReq, req) => {
        const castReq = req as Request;

        // 1. Forward user & auth headers
        if (castReq.headers['x-user-id']) {
          proxyReq.setHeader('x-user-id', castReq.headers['x-user-id'] as string);
        }
        if (castReq.headers['x-user-email']) {
          proxyReq.setHeader('x-user-email', castReq.headers['x-user-email'] as string);
        }
        if (castReq.headers['x-user-role']) {
          proxyReq.setHeader('x-user-role', castReq.headers['x-user-role'] as string);
        }
        if (castReq.headers['authorization']) {
          proxyReq.setHeader('authorization', castReq.headers['authorization'] as string);
        }

        // 2. Forward body for mutation methods if parsed by express.json()
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(castReq.method.toUpperCase())) {
          if (castReq.body !== undefined && castReq.body !== null) {
            const bodyData = JSON.stringify(castReq.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
        }
      },
      error: (err, req, res) => {
        console.error(`[Gateway Proxy Error] Target: ${target}, Path: ${req.url}, Error:`, err.message);
        if (res && 'writeHead' in res) {
          sendError(
            res as unknown as Response,
            `Service at ${target} is currently unavailable or unreachable.`,
            HttpStatusCodes.SERVICE_UNAVAILABLE,
            'SERVICE_UNAVAILABLE',
            { target, error: err.message }
          );
        }
      },
    },
  });
};

// Route definitions to microservices
router.use('/api/auth', createServiceProxy(config.services.auth));
router.use('/api/events', createServiceProxy(config.services.event));
router.use('/api/teams', createServiceProxy(config.services.team));
router.use('/api/tickets', createServiceProxy(config.services.ticket));
router.use('/api/helpdesk', createServiceProxy(config.services.ticket, { '^/': '/helpdesk/' }));
router.use('/api/checkin', createServiceProxy(config.services.checkin));
router.use('/api/announcements', createServiceProxy(config.services.announcement));
router.use('/api/chat', createServiceProxy(config.services.announcement, { '^/': '/chat/' }));
router.use('/api/questions', createServiceProxy(config.services.announcement, { '^/': '/questions/' }));
router.use('/api/polls', createServiceProxy(config.services.announcement, { '^/': '/polls/' }));
router.use('/api/submissions', createServiceProxy(config.services.event, { '^/': '/submissions/' }));
router.use('/api/results', createServiceProxy(config.services.event, { '^/': '/results/' }));
router.use('/api/remarks', createServiceProxy(config.services.event, { '^/': '/remarks/' }));
router.use('/api/uploads', createServiceProxy(config.services.event, { '^/': '/uploads/' }));
router.use('/api/notifications', createServiceProxy(config.services.notification));

export default router;
