import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`🚀 Fintech Core API Engine started on http://localhost:${config.port}${config.apiPrefix}`);
  logger.info(`💳 Architecture: Double-Entry Immutable Ledger | RBAC | Provider Switch | Idempotency Engine`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});
