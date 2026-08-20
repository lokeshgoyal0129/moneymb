import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserJwtPayload } from '@fintech/shared';
import { config } from '../config';
import { store } from '../core/store';

declare global {
  namespace Express {
    interface Request {
      user?: UserJwtPayload;
      idempotencyKey?: string;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
      message: 'Access token is required in Authorization header (Bearer <token>)',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as UserJwtPayload;
    const user = store.users.get(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        errorCode: 'USER_NOT_FOUND',
        message: 'The user associated with this token no longer exists.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      errorCode: 'INVALID_TOKEN',
      message: 'Access token is invalid or has expired.',
      timestamp: new Date().toISOString()
    });
  }
}
