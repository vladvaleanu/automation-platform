/**
 * Cleanup Readings Job
 * Deletes consumption readings older than the configured retention period
 */

import type { JobContext } from '../types/index.js';

interface JobConfig {
    retentionDays?: number;
}

interface JobResult {
    success: boolean;
    deletedCount: number;
    message: string;
}

/**
 * Main job handler for cleaning up old readings
 */
export default async function cleanupReadings(context: JobContext): Promise<JobResult> {
    const { prisma, logger } = context.services;
    const { retentionDays = 365 } = (context.config || {}) as JobConfig;

    logger.info(`[CleanupReadings] Starting cleanup job (retention: ${retentionDays} days)`);

    try {
        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        logger.info(`[CleanupReadings] Deleting readings older than ${cutoffDate.toISOString()}`);

        // Delete old readings
        const result = await prisma.consumptionReading.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });

        logger.info(`[CleanupReadings] Deleted ${result.count} old readings`);

        return {
            success: true,
            deletedCount: result.count,
            message: `Successfully deleted ${result.count} readings older than ${retentionDays} days`,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error }, `[CleanupReadings] Job failed: ${errorMessage}`);
        throw error;
    }
}
