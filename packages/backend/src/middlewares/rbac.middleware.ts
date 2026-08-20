import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@fintech/shared';

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        errorCode: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        statusCode: 403,
        errorCode: 'FORBIDDEN',
        message: `Role ${req.user.role} does not have permission to access this resource.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
}
