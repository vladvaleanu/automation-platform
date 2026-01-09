/**
 * Database Service
 * Provides database helpers and utilities for job contexts
 */

import { prisma } from '../lib/prisma.js';
import { logger } from '../config/logger.js';
import type { DatabaseService as IDatabaseService } from '../types/job.types.js';

export class DatabaseService implements IDatabaseService {
  /**
   * Execute operations within a transaction
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await prisma.$transaction(async () => {
        return await callback();
      });
    } catch (error: any) {
      logger.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Execute raw SQL query (use with caution)
   */
  async executeRaw(query: string, params: any[] = []): Promise<any> {
    try {
      return await prisma.$queryRawUnsafe(query, ...params);
    } catch (error: any) {
      logger.error('Raw query failed:', error);
      throw new Error(`Raw query failed: ${error.message}`);
    }
  }

  /**
   * Check database connection health
   */
  async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database connection check failed:', error);
      return false;
    }
  }

  /**
   * Get the Prisma client instance
   * Allows jobs to use Prisma models directly
   */
  getPrisma() {
    return prisma;
  }

  /**
   * Batch operations helper
   */
  async batch<T>(operations: Array<Promise<T>>): Promise<T[]> {
    try {
      return await Promise.all(operations);
    } catch (error: any) {
      logger.error('Batch operation failed:', error);
      throw new Error(`Batch operation failed: ${error.message}`);
    }
  }

  /**
   * Retry a database operation with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<T> {
    let lastError: any;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors (e.g., unique constraint violations)
        if (error.code === 'P2002' || error.code === 'P2025') {
          throw error;
        }

        if (attempt < maxRetries) {
          logger.warn(`Database operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await this.sleep(delay);
          delay *= 2; // Exponential backoff
        }
      }
    }

    logger.error('Database operation failed after retries:', lastError);
    throw new Error(`Database operation failed after ${maxRetries} retries: ${lastError.message}`);
  }

  /**
   * Paginate query results
   */
  async paginate<T>(
    model: any,
    options: {
      where?: any;
      orderBy?: any;
      page?: number;
      limit?: number;
      include?: any;
    }
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      model.findMany({
        where: options.where,
        orderBy: options.orderBy,
        skip,
        take: limit,
        include: options.include,
      }),
      model.count({ where: options.where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Disconnect from database (for cleanup)
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
