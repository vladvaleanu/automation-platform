/**
 * Logger Service
 * Provides structured logging wrapper for job execution contexts
 */

import { logger as pinoLogger } from '../config/logger.js';
import type { Logger } from '../types/job.types.js';

export class LoggerService {
  /**
   * Create a logger instance for a job execution
   * This logger can optionally buffer logs for storage
   */
  static createJobLogger(
    context: {
      jobId: string;
      executionId: string;
      moduleName: string;
    },
    logBuffer?: string[]
  ): Logger {
    const { jobId, executionId, moduleName } = context;

    const createLogEntry = (level: string, message: string, meta?: any): string => {
      const timestamp = new Date().toISOString();
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      return `[${level}] ${timestamp} [${moduleName}] ${message}${metaStr}`;
    };

    return {
      debug: (message: string, meta?: Record<string, any>) => {
        const logEntry = createLogEntry('DEBUG', message, meta);

        if (logBuffer) {
          logBuffer.push(logEntry);
        }

        pinoLogger.debug(
          {
            jobId,
            executionId,
            moduleName,
            ...meta,
          },
          message
        );
      },

      info: (message: string, meta?: Record<string, any>) => {
        const logEntry = createLogEntry('INFO', message, meta);

        if (logBuffer) {
          logBuffer.push(logEntry);
        }

        pinoLogger.info(
          {
            jobId,
            executionId,
            moduleName,
            ...meta,
          },
          message
        );
      },

      warn: (message: string, meta?: Record<string, any>) => {
        const logEntry = createLogEntry('WARN', message, meta);

        if (logBuffer) {
          logBuffer.push(logEntry);
        }

        pinoLogger.warn(
          {
            jobId,
            executionId,
            moduleName,
            ...meta,
          },
          message
        );
      },

      error: (message: string, error?: Error | Record<string, any>) => {
        const errorMeta =
          error instanceof Error
            ? { errorMessage: error.message, errorStack: error.stack }
            : error;

        const logEntry = createLogEntry('ERROR', message, errorMeta);

        if (logBuffer) {
          logBuffer.push(logEntry);
        }

        pinoLogger.error(
          {
            jobId,
            executionId,
            moduleName,
            ...errorMeta,
          },
          message
        );
      },
    };
  }

  /**
   * Create a simple logger without buffering
   */
  static createSimpleLogger(moduleName: string): Logger {
    return {
      debug: (message: string, meta?: Record<string, any>) => {
        pinoLogger.debug({ moduleName, ...meta }, message);
      },

      info: (message: string, meta?: Record<string, any>) => {
        pinoLogger.info({ moduleName, ...meta }, message);
      },

      warn: (message: string, meta?: Record<string, any>) => {
        pinoLogger.warn({ moduleName, ...meta }, message);
      },

      error: (message: string, error?: Error | Record<string, any>) => {
        const errorMeta =
          error instanceof Error
            ? { errorMessage: error.message, errorStack: error.stack }
            : error;

        pinoLogger.error({ moduleName, ...errorMeta }, message);
      },
    };
  }
}
