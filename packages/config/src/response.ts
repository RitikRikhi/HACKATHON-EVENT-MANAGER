import { Response } from 'express';
import { ApiResponse, ApiErrorResponse } from '@event-os/types';

export const HttpStatusCodes = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Operation successful',
  statusCode: number = HttpStatusCodes.OK
): Response => {
  const responsePayload: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(responsePayload);
};

export const sendError = (
  res: Response,
  message = 'An unexpected error occurred',
  statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR,
  errorCode = 'INTERNAL_ERROR',
  details?: unknown
): Response => {
  const responsePayload: ApiErrorResponse = {
    success: false,
    message,
    error: errorCode,
    ...(details ? { details } : {}),
  };
  return res.status(statusCode).json(responsePayload);
};
