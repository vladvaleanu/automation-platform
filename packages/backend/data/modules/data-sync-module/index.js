/**
 * Data Sync Module - Entry Point
 * Example module demonstrating job scheduling capabilities
 */

module.exports = {
  /**
   * Module initialization
   */
  async initialize(context) {
    const { logger, events } = context.services;

    logger.info('Data Sync Module initializing...');

    // Subscribe to user events
    events.on('user.created', async (event) => {
      logger.info('New user detected, triggering sync', {
        userId: event.payload.userId
      });

      // Emit sync request
      await events.emit('data.sync.requested', {
        trigger: 'user.created',
        userId: event.payload.userId
      }, 'data-sync-module');
    });

    events.on('user.updated', async (event) => {
      logger.info('User updated, scheduling incremental sync', {
        userId: event.payload.userId
      });
    });

    logger.info('Data Sync Module initialized successfully');
  },

  /**
   * Module cleanup
   */
  async cleanup(context) {
    const { logger } = context.services;
    logger.info('Data Sync Module shutting down...');
  },

  /**
   * Module health check
   */
  async healthCheck(context) {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      lastSync: await getLastSyncTime(context)
    };
  }
};

/**
 * Helper function to get last sync time
 */
async function getLastSyncTime(context) {
  const { database } = context.services;

  try {
    const result = await database.query(
      'SELECT MAX(synced_at) as last_sync FROM sync_history WHERE module_id = $1',
      ['data-sync-module']
    );

    return result.rows[0]?.last_sync || null;
  } catch (error) {
    return null;
  }
}
