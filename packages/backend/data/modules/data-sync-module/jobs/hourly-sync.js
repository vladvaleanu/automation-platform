/**
 * Hourly Data Sync Job
 * Syncs data from external API every hour
 */

export default async function hourlySyncJob(context) {
  const { logger } = context.services;
  const { jobId, executionId } = context;

  logger.info('Starting hourly data sync', { jobId, executionId });

  try {
    // Simulate data sync work
    const startTime = Date.now();

    // Simulate fetching data
    await new Promise(resolve => setTimeout(resolve, 1000));

    const recordsProcessed = Math.floor(Math.random() * 100) + 50;
    const duration = Date.now() - startTime;

    logger.info('Hourly sync completed', {
      recordsProcessed,
      duration
    });

    return {
      success: true,
      recordsProcessed,
      duration,
      syncedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Hourly sync failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}
