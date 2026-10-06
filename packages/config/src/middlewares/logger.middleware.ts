import { Request, Response, NextFunction } from 'express';

export const requestLogger = (serviceName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const logLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
      const timestamp = new Date().toISOString();

      console.log(
        `[${timestamp}] [${serviceName}] [${logLevel}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`
      );
    });

    next();
  };
};
