import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/error.middleware';
import { checkIdempotency } from './middlewares/idempotency.middleware';

// Routes
import { authRoutes } from './modules/auth/auth.routes';
import { walletRoutes } from './modules/wallet/wallet.routes';
import { dmtRoutes } from './modules/dmt/dmt.routes';
import { rechargeRoutes } from './modules/recharge/recharge.routes';
import { bbpsRoutes } from './modules/bbps/bbps.routes';
import { fastagRoutes } from './modules/fastag/fastag.routes';
import { aepsRoutes } from './modules/aeps/aeps.routes';
import { settlementRoutes } from './modules/settlement/settlement.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { disputesRoutes } from './modules/disputes/disputes.routes';
import { adminRoutes } from './modules/admin/admin.routes';

export function createApp(): Express {
  const app = express();

  // Security & standard middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global Idempotency check on mutating methods
  app.use(checkIdempotency);

  // Health endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Indian Fintech & B2B Financial Platform Core API',
      version: '1.0.0'
    });
  });

  // Mount API modules on /api/v1, /v1, and /api for seamless frontend compatibility
  const mountRoutes = (prefix: string) => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/wallet`, walletRoutes);
    app.use(`${prefix}/dmt`, dmtRoutes);
    app.use(`${prefix}/recharge`, rechargeRoutes);
    app.use(`${prefix}/bbps`, bbpsRoutes);
    app.use(`${prefix}/fastag`, fastagRoutes);
    app.use(`${prefix}/aeps`, aepsRoutes);
    app.use(`${prefix}/settlement`, settlementRoutes);
    app.use(`${prefix}/reports`, reportsRoutes);
    app.use(`${prefix}/disputes`, disputesRoutes);
    app.use(`${prefix}/admin`, adminRoutes);
  };

  mountRoutes('/api/v1');
  mountRoutes('/v1');
  mountRoutes('/api');

  // 404 Handler
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      statusCode: 404,
      errorCode: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
