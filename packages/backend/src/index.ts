/**
 * Main entry point for the NxForge Backend
 */

import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { jobService } from './services/job.service.js';
import { browserService } from './services/browser.service.js';
import { databaseService } from './services/database.service.js';
import { eventBusService } from './services/event-bus.service.js';

async function start() {
  try {
    const app = await buildApp();

    // Initialize event bus
    logger.info('Initializing event bus...');
    await eventBusService.initialize();
    logger.info('Event bus initialized');

    // Initialize job service (includes workers, scheduling, and cleanup)
    logger.info('Initializing job service...');
    await jobService.initializeJobs();
    logger.info('Job service initialized');

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`Server listening on ${env.HOST}:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Health check: http://${env.HOST}:${env.PORT}/health`);
    logger.info(`API base: http://${env.HOST}:${env.PORT}/api/v1`);

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);

        // Shutdown job service
        await jobService.shutdown();

        // Disconnect event bus
        await eventBusService.disconnect();

        // Close all browser sessions
        await browserService.closeAllSessions();

        // Disconnect database
        await databaseService.disconnect();

        // Close Fastify
        await app.close();

        process.exit(0);
      });
    });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();
