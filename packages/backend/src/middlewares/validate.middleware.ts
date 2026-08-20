import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));

        res.status(400).json({
          success: false,
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
          message: 'Invalid request payload',
          details,
          timestamp: new Date().toISOString()
        });
        return;
      }
      next(err);
    }
  };
}
