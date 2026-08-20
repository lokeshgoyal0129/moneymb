import { Request, Response, NextFunction } from 'express';
import { idempotencyManager } from '../core/idempotency';

export async function checkIdempotency(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Only apply to state mutating methods (POST, PUT, PATCH, DELETE)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const key = req.headers['x-idempotency-key'] as string;
    if (key) {
      try {
        const { isNew, response } = await idempotencyManager.acquire(key);
        if (!isNew && response) {
          // Return cached response directly
          res.status(response.statusCode || 200).json(response);
          return;
        }
        req.idempotencyKey = key;
      } catch (err: any) {
        res.status(409).json({
          success: false,
          statusCode: 409,
          errorCode: 'IDEMPOTENCY_CONFLICT',
          message: err.message,
          timestamp: new Date().toISOString()
        });
        return;
      }
    }
  }
  next();
}
