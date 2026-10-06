import { Request, Response, NextFunction } from 'express';
import { sendError, HttpStatusCodes } from '../response';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface RateRecord {
  count: number;
  resetTime: number;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => {
      const userId = req.user?.userId || (req.headers['x-user-id'] as string);
      if (userId) return `user_${userId}`;
      return `ip_${req.ip || req.socket.remoteAddress || 'unknown'}`;
    },
  } = options;

  const hits = new Map<string, RateRecord>();

  // Cleanup old entries every 60s
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 60000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = hits.get(key);

    if (!record || now > record.resetTime) {
      hits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      sendError(
        res,
        message,
        HttpStatusCodes.TOO_MANY_REQUESTS,
        'TOO_MANY_REQUESTS',
        { retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000) }
      );
      return;
    }

    record.count += 1;
    return next();
  };
};

// Common rate limiters:
export const chatRateLimiter = createRateLimiter({
  windowMs: 2000,
  max: 1,
  message: 'Chat rate limit exceeded. Please wait 2 seconds between messages.',
});

export const questionRateLimiter = createRateLimiter({
  windowMs: 5000,
  max: 2,
  message: 'Question rate limit exceeded. Please wait before asking another question.',
});

export const ticketRateLimiter = createRateLimiter({
  windowMs: 10000,
  max: 3,
  message: 'Ticket creation rate limit exceeded.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60000,
  max: 15,
  message: 'Too many authentication attempts. Please try again later.',
});
