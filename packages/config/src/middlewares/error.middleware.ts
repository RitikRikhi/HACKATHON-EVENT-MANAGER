import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { sendError, HttpStatusCodes } from '../response';
import { env } from '../env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response => {
  if (err instanceof AppError) {
    return sendError(
      res,
      err.message,
      err.statusCode,
      err.errorCode,
      err.details
    );
  }

  // Log unhandled server errors in non-test mode
  if (env.NODE_ENV !== 'test') {
    console.error(`[Unhandled Error] [${req.method}] ${req.originalUrl}:`, err);
  }

  return sendError(
    res,
    env.isProduction ? 'An unexpected internal error occurred' : err.message,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
    'INTERNAL_SERVER_ERROR',
    env.isDevelopment ? { stack: err.stack } : undefined
  );
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    HttpStatusCodes.NOT_FOUND,
    'ROUTE_NOT_FOUND'
  );
};
