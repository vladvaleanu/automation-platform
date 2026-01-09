/**
 * Daily Report Generator Job
 * Generates analytics report at midnight
 */

const { format, subDays } = require('date-fns');

module.exports = async function dailyReportJob(context) {
  const { logger, database, notifications, events, config } = context.services;
  const { jobId, executionId } = context;

  logger.info('Starting daily report generation', { jobId, executionId });

  try {
    const reportDate = new Date();
    const previousDay = subDays(reportDate, 1);

    // Step 1: Gather statistics
    logger.info('Gathering daily statistics');

    const stats = await gatherStatistics(database, previousDay);

    logger.info('Statistics gathered', {
      totalRecords: stats.totalRecords,
      newRecords: stats.newRecords,
      updatedRecords: stats.updatedRecords
    });

    // Step 2: Generate report
    const report = generateReport(stats, previousDay);

    // Step 3: Store report
    await database.query(
      `INSERT INTO daily_reports (report_date, report_data, generated_at, module_id)
       VALUES ($1, $2, $3, $4)`,
      [
        format(previousDay, 'yyyy-MM-dd'),
        JSON.stringify(report),
        new Date().toISOString(),
        'data-sync-module'
      ]
    );

    logger.info('Report stored in database');

    // Step 4: Send notifications
    if (config.notificationEmail) {
      await notifications.send({
        channel: 'email',
        to: config.notificationEmail,
        subject: `Daily Report - ${format(previousDay, 'MMM dd, yyyy')}`,
        body: formatReportEmail(report, previousDay),
        attachments: []
      });

      logger.info('Report email sent', {
        recipient: config.notificationEmail
      });
    }

    // Step 5: Emit event
    await events.emit('report.generated', {
      jobId,
      executionId,
      reportDate: format(previousDay, 'yyyy-MM-dd'),
      stats: {
        totalRecords: stats.totalRecords,
        newRecords: stats.newRecords,
        updatedRecords: stats.updatedRecords
      }
    }, 'data-sync-module');

    logger.info('Daily report generation completed');

    return {
      success: true,
      reportDate: format(previousDay, 'yyyy-MM-dd'),
      stats
    };

  } catch (error) {
    logger.error('Daily report generation failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
};

/**
 * Gather daily statistics
 */
async function gatherStatistics(database, date) {
  const dateStr = format(date, 'yyyy-MM-dd');

  // Total records synced on date
  const totalResult = await database.query(
    `SELECT COUNT(*) as count FROM synced_data
     WHERE DATE(synced_at) = $1`,
    [dateStr]
  );

  // New records created on date
  const newResult = await database.query(
    `SELECT COUNT(*) as count FROM synced_data
     WHERE DATE(synced_at) = $1
     AND NOT EXISTS (
       SELECT 1 FROM synced_data sd2
       WHERE sd2.external_id = synced_data.external_id
       AND DATE(sd2.synced_at) < $1
     )`,
    [dateStr]
  );

  // Records updated on date
  const updatedResult = await database.query(
    `SELECT COUNT(*) as count FROM synced_data
     WHERE DATE(synced_at) = $1
     AND EXISTS (
       SELECT 1 FROM synced_data sd2
       WHERE sd2.external_id = synced_data.external_id
       AND DATE(sd2.synced_at) < $1
     )`,
    [dateStr]
  );

  // Sync execution stats
  const executionsResult = await database.query(
    `SELECT
       COUNT(*) as total_executions,
       SUM(records_processed) as total_processed,
       SUM(records_failed) as total_failed
     FROM sync_history
     WHERE DATE(synced_at) = $1
     AND module_id = 'data-sync-module'`,
    [dateStr]
  );

  return {
    totalRecords: parseInt(totalResult.rows[0].count),
    newRecords: parseInt(newResult.rows[0].count),
    updatedRecords: parseInt(updatedResult.rows[0].count),
    executions: parseInt(executionsResult.rows[0].total_executions || 0),
    processed: parseInt(executionsResult.rows[0].total_processed || 0),
    failed: parseInt(executionsResult.rows[0].total_failed || 0)
  };
}

/**
 * Generate report object
 */
function generateReport(stats, date) {
  return {
    date: format(date, 'yyyy-MM-dd'),
    summary: {
      totalRecords: stats.totalRecords,
      newRecords: stats.newRecords,
      updatedRecords: stats.updatedRecords,
      successRate: stats.processed > 0
        ? ((stats.processed - stats.failed) / stats.processed * 100).toFixed(2)
        : 0
    },
    executions: {
      total: stats.executions,
      successful: stats.executions - (stats.failed > 0 ? 1 : 0),
      failed: stats.failed > 0 ? 1 : 0
    },
    performance: {
      recordsProcessed: stats.processed,
      recordsFailed: stats.failed,
      averagePerExecution: stats.executions > 0
        ? Math.round(stats.processed / stats.executions)
        : 0
    },
    generatedAt: new Date().toISOString()
  };
}

/**
 * Format report for email
 */
function formatReportEmail(report, date) {
  return `
    <h2>Daily Sync Report - ${format(date, 'MMMM dd, yyyy')}</h2>

    <h3>Summary</h3>
    <ul>
      <li><strong>Total Records:</strong> ${report.summary.totalRecords}</li>
      <li><strong>New Records:</strong> ${report.summary.newRecords}</li>
      <li><strong>Updated Records:</strong> ${report.summary.updatedRecords}</li>
      <li><strong>Success Rate:</strong> ${report.summary.successRate}%</li>
    </ul>

    <h3>Execution Statistics</h3>
    <ul>
      <li><strong>Total Executions:</strong> ${report.executions.total}</li>
      <li><strong>Successful:</strong> ${report.executions.successful}</li>
      <li><strong>Failed:</strong> ${report.executions.failed}</li>
    </ul>

    <h3>Performance Metrics</h3>
    <ul>
      <li><strong>Records Processed:</strong> ${report.performance.recordsProcessed}</li>
      <li><strong>Records Failed:</strong> ${report.performance.recordsFailed}</li>
      <li><strong>Average per Execution:</strong> ${report.performance.averagePerExecution}</li>
    </ul>

    <p><em>Generated at: ${format(new Date(report.generatedAt), 'PPpp')}</em></p>
  `;
}
