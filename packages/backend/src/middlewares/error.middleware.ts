import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled API Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected internal error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    statusCode,
    errorCode,
    message,
    details: err.details,
    timestamp: new Date().toISOString()
  });
}
