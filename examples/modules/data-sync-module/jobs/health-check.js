/**
 * Health Check Job
 * Monitors system health every 5 minutes
 */

module.exports = async function healthCheckJob(context) {
  const { logger, database, http, events, config } = context.services;
  const { jobId, executionId } = context;

  logger.info('Starting health check', { jobId, executionId });

  const results = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // Check 1: Database connectivity
    try {
      const dbStart = Date.now();
      await database.query('SELECT 1');
      results.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart
      };
      logger.info('Database check passed');
    } catch (error) {
      results.checks.database = {
        status: 'unhealthy',
        error: error.message
      };
      logger.error('Database check failed', { error: error.message });
    }

    // Check 2: External API availability
    if (config.apiUrl) {
      try {
        const apiStart = Date.now();
        await http.get(`${config.apiUrl}/health`, {
          timeout: 5000
        });
        results.checks.externalApi = {
          status: 'healthy',
          responseTime: Date.now() - apiStart
        };
        logger.info('External API check passed');
      } catch (error) {
        results.checks.externalApi = {
          status: 'unhealthy',
          error: error.message
        };
        logger.warn('External API check failed', { error: error.message });
      }
    }

    // Check 3: Recent sync status
    try {
      const syncResult = await database.query(
        `SELECT synced_at, records_processed, records_failed
         FROM sync_history
         WHERE module_id = 'data-sync-module'
         ORDER BY synced_at DESC
         LIMIT 1`
      );

      if (syncResult.rows.length > 0) {
        const lastSync = syncResult.rows[0];
        const timeSinceLastSync = Date.now() - new Date(lastSync.synced_at).getTime();
        const hoursSinceSync = timeSinceLastSync / (1000 * 60 * 60);

        results.checks.lastSync = {
          status: hoursSinceSync < 2 ? 'healthy' : 'warning',
          lastSyncTime: lastSync.synced_at,
          hoursSinceSync: hoursSinceSync.toFixed(2),
          recordsProcessed: lastSync.records_processed,
          recordsFailed: lastSync.records_failed
        };

        if (hoursSinceSync >= 2) {
          logger.warn('Last sync was over 2 hours ago', {
            hoursSinceSync: hoursSinceSync.toFixed(2)
          });
        }
      } else {
        results.checks.lastSync = {
          status: 'warning',
          message: 'No sync history found'
        };
      }
    } catch (error) {
      results.checks.lastSync = {
        status: 'error',
        error: error.message
      };
    }

    // Check 4: Data freshness
    try {
      const freshnessResult = await database.query(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN synced_at > NOW() - INTERVAL '1 day' THEN 1 END) as fresh,
           COUNT(CASE WHEN synced_at <= NOW() - INTERVAL '7 days' THEN 1 END) as stale
         FROM synced_data`
      );

      const data = freshnessResult.rows[0];
      const freshPercentage = data.total > 0
        ? (parseInt(data.fresh) / parseInt(data.total) * 100).toFixed(2)
        : 0;

      results.checks.dataFreshness = {
        status: freshPercentage >= 80 ? 'healthy' : freshPercentage >= 50 ? 'warning' : 'unhealthy',
        totalRecords: parseInt(data.total),
        freshRecords: parseInt(data.fresh),
        staleRecords: parseInt(data.stale),
        freshPercentage: parseFloat(freshPercentage)
      };

      logger.info('Data freshness check completed', {
        freshPercentage
      });
    } catch (error) {
      results.checks.dataFreshness = {
        status: 'error',
        error: error.message
      };
    }

    // Check 5: System resources
    results.checks.systemResources = {
      status: 'healthy',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      uptime: {
        value: Math.round(process.uptime()),
        unit: 'seconds'
      }
    };

    // Determine overall health status
    const statuses = Object.values(results.checks).map(check => check.status);
    const hasUnhealthy = statuses.includes('unhealthy');
    const hasWarning = statuses.includes('warning');
    const hasError = statuses.includes('error');

    results.overallStatus = hasUnhealthy || hasError ? 'unhealthy'
      : hasWarning ? 'warning'
      : 'healthy';

    // Store health check result
    await database.query(
      `INSERT INTO health_checks (module_id, job_id, execution_id, checked_at, status, results)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'data-sync-module',
        jobId,
        executionId,
        new Date().toISOString(),
        results.overallStatus,
        JSON.stringify(results)
      ]
    );

    // Emit health status event
    await events.emit('health.checked', {
      module: 'data-sync-module',
      status: results.overallStatus,
      timestamp: results.timestamp,
      checks: Object.keys(results.checks).reduce((acc, key) => {
        acc[key] = results.checks[key].status;
        return acc;
      }, {})
    }, 'data-sync-module');

    // If unhealthy, send alert
    if (results.overallStatus === 'unhealthy') {
      logger.error('Health check failed - system unhealthy', { results });

      await events.emit('health.alert', {
        module: 'data-sync-module',
        severity: 'high',
        message: 'System health check failed',
        details: results.checks
      }, 'data-sync-module');
    }

    logger.info('Health check completed', {
      status: results.overallStatus
    });

    return {
      success: true,
      status: results.overallStatus,
      results
    };

  } catch (error) {
    logger.error('Health check job failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
};
