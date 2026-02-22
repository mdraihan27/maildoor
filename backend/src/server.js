import app from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './database/index.js';
import initJobs from './jobs/index.js';
import { stopAllJobs } from './jobs/scheduler.js';
import AuditService from './modules/audit/audit.service.js';

const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDatabase();

  // 2. Register cron jobs
  initJobs();

  // 3. Start HTTP server
  const server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on port ${config.port}`);
  });

  // ─── Graceful shutdown ──────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received – shutting down gracefully`);
    stopAllJobs();

    server.close(async () => {
      await AuditService.shutdown(); // flush buffered audit entries
      await disconnectDatabase();
      logger.info('Server closed');
      process.exit(0);
    });

    // Force exit after 10 s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled errors globally
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
};

startServer();
