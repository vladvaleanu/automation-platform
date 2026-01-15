/**
 * Collect Consumption Job
 * Scrapes all enabled power meter endpoints and stores consumption readings
 */

import type { JobContext } from '@nxforge/core';
import { ScrapingService } from '@nxforge/core';

interface JobConfig {
  batchSize?: number;
  screenshotOnError?: boolean;
}

interface JobResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ endpoint: string; error: string }>;
  message?: string;
}

interface ProcessingResults {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ endpoint: string; error: string }>;
}

/**
 * Main job handler for collecting consumption data
 */
export default async function collectConsumption(context: JobContext): Promise<JobResult> {
  const { logger, prisma } = context.services;
  const { batchSize = 5, screenshotOnError = true } = (context.config || {}) as JobConfig;

  logger.info('[CollectConsumption] Starting consumption collection job');

  try {
    // Fetch all enabled endpoints
    const endpoints = await prisma.endpoint.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });

    if (endpoints.length === 0) {
      logger.info('[CollectConsumption] No enabled endpoints found');
      return {
        success: true,
        message: 'No enabled endpoints to process',
        total: 0,
        successful: 0,
        failed: 0,
        errors: [],
      };
    }

    logger.info(`[CollectConsumption] Found ${endpoints.length} enabled endpoints to process`);

    // Process endpoints in batches to avoid overwhelming the system
    const results: ProcessingResults = {
      total: endpoints.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process endpoints in batches
    for (let i = 0; i < endpoints.length; i += batchSize) {
      const batch = endpoints.slice(i, i + batchSize);
      logger.info(
        `[CollectConsumption] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} endpoints)`
      );

      // Process batch concurrently
      await Promise.all(
        batch.map((endpoint: any) =>
          processEndpoint(endpoint, logger, prisma, screenshotOnError, results)
        )
      );
    }

    // Clean up scraping service (close browsers)
    await ScrapingService.closeAllBrowsers();

    logger.info(
      `[CollectConsumption] Job completed. Success: ${results.successful}, Failed: ${results.failed}`
    );

    return {
      success: true,
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
    };
  } catch (error: any) {
    logger.error(`[CollectConsumption] Job failed: ${error.message}`, { error });

    // Make sure to close scraping service even on error
    try {
      await ScrapingService.closeAllBrowsers();
    } catch (closeError) {
      // Ignore cleanup errors
    }

    throw error;
  }
}

/**
 * Process a single endpoint
 */
async function processEndpoint(
  endpoint: { id: string; name: string; ipAddress: string; authType: string; authConfig: any; scrapingConfig: any },
  logger: { info: (msg: string) => void; error: (msg: string, meta?: any) => void },
  prisma: any,
  screenshotOnError: boolean,
  results: ProcessingResults
): Promise<void> {
  const startTime = Date.now();

  try {
    logger.info(`[CollectConsumption] Scraping endpoint: ${endpoint.name} (${endpoint.ipAddress})`);

    // Perform scraping
    const result = await ScrapingService.scrape(
      `http://${endpoint.ipAddress}`,
      endpoint.authConfig,
      endpoint.scrapingConfig,
      { screenshotOnError }
    );

    if (!result.success) {
      throw new Error(result.error || 'Scraping failed');
    }

    if (result.value === null) {
      throw new Error('Failed to extract consumption value from page');
    }

    // Get last reading to calculate current month usage
    const lastReading = await prisma.consumptionReading.findFirst({
      where: { endpointId: endpoint.id },
      orderBy: { timestamp: 'desc' },
    });

    // Calculate current month usage
    // For the first day of a new month, we want the delta from last month's last reading
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let currentKwh = 0;
    if (lastReading) {
      const lastMonth = lastReading.timestamp.getMonth();
      const lastYear = lastReading.timestamp.getFullYear();

      if (lastMonth === currentMonth && lastYear === currentYear) {
        // Same month - calculate delta from first reading of this month
        const firstReadingThisMonth = await prisma.consumptionReading.findFirst({
          where: {
            endpointId: endpoint.id,
            timestamp: {
              gte: new Date(currentYear, currentMonth, 1),
            },
          },
          orderBy: { timestamp: 'asc' },
        });

        if (firstReadingThisMonth && firstReadingThisMonth.totalKwh !== null) {
          currentKwh = result.value - firstReadingThisMonth.totalKwh;
        }
      } else {
        // New month - this is first reading, delta is 0
        // (will calculate properly once we have more readings)
        currentKwh = 0;
      }
    }

    // Store reading in database
    await prisma.consumptionReading.create({
      data: {
        endpointId: endpoint.id,
        timestamp: new Date(),
        totalKwh: result.value,
        currentKwh,
        voltage: result.additionalData?.voltage,
        current: result.additionalData?.current,
        power: result.additionalData?.power,
        powerFactor: result.additionalData?.powerFactor,
        success: true,
        rawData: {
          scrapedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          rawHtml: result.rawHtml,
        },
      },
    });

    // Update endpoint's lastReadAt
    await prisma.endpoint.update({
      where: { id: endpoint.id },
      data: { lastReadAt: new Date() },
    });

    logger.info(
      `[CollectConsumption] Successfully scraped ${endpoint.name}: ${result.value} kWh (current month: ${currentKwh.toFixed(2)} kWh)`
    );

    results.successful++;
  } catch (error: any) {
    logger.error(`[CollectConsumption] Failed to scrape ${endpoint.name}: ${error.message}`, {
      endpointId: endpoint.id,
      error,
    });

    // Store failed reading
    try {
      await prisma.consumptionReading.create({
        data: {
          endpointId: endpoint.id,
          timestamp: new Date(),
          success: false,
          errorMessage: error.message,
          rawData: {
            scrapedAt: new Date().toISOString(),
            durationMs: Date.now() - startTime,
          },
        },
      });
    } catch (dbError: any) {
      logger.error(`[CollectConsumption] Failed to store error reading: ${dbError.message}`);
    }

    results.failed++;
    results.errors.push({
      endpoint: endpoint.name,
      error: error.message,
    });
  }
}
