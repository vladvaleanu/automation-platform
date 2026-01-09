/**
 * Hourly Data Sync Job
 * Syncs data from external API every hour
 */

const axios = require('axios');

module.exports = async function hourlySyncJob(context) {
  const { logger, http, database, events, config } = context.services;
  const { jobId, executionId } = context;

  logger.info('Starting hourly data sync', { jobId, executionId });

  try {
    // Configuration from job config
    const apiUrl = config.apiUrl || 'https://api.example.com/data';
    const batchSize = config.batchSize || 100;

    // Step 1: Fetch data from external API
    logger.info('Fetching data from external API', { apiUrl });

    const response = await http.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${config.apiKey || 'demo-key'}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const externalData = response.data;
    logger.info('Data fetched successfully', {
      recordCount: externalData.length
    });

    // Step 2: Process data in batches
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < externalData.length; i += batchSize) {
      const batch = externalData.slice(i, i + batchSize);

      try {
        // Insert/update records in database
        await database.query(
          `INSERT INTO synced_data (external_id, data, synced_at, module_id)
           VALUES ${batch.map((_, idx) => `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`).join(', ')}
           ON CONFLICT (external_id) DO UPDATE
           SET data = EXCLUDED.data, synced_at = EXCLUDED.synced_at`,
          batch.flatMap(item => [
            item.id,
            JSON.stringify(item),
            new Date().toISOString(),
            'data-sync-module'
          ])
        );

        processed += batch.length;
        logger.info('Batch processed', {
          batch: Math.floor(i / batchSize) + 1,
          processed
        });
      } catch (error) {
        failed += batch.length;
        logger.error('Batch processing failed', {
          batch: Math.floor(i / batchSize) + 1,
          error: error.message
        });
      }
    }

    // Step 3: Update sync history
    await database.query(
      `INSERT INTO sync_history (module_id, job_id, execution_id, synced_at, records_processed, records_failed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['data-sync-module', jobId, executionId, new Date().toISOString(), processed, failed]
    );

    // Step 4: Emit completion event
    await events.emit('data.synced', {
      jobId,
      executionId,
      processed,
      failed,
      timestamp: new Date().toISOString()
    }, 'data-sync-module');

    logger.info('Hourly data sync completed', {
      processed,
      failed,
      success: failed === 0
    });

    return {
      success: true,
      processed,
      failed,
      duration: Date.now() - context.startTime
    };

  } catch (error) {
    logger.error('Hourly data sync failed', {
      error: error.message,
      stack: error.stack
    });

    // Emit failure event
    await events.emit('data.sync.failed', {
      jobId,
      executionId,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 'data-sync-module');

    throw error;
  }
};
