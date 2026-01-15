/**
 * Migration Runner Service
 * Handles execution of SQL migrations for modules
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { logger } from '../config/logger.js';

// ============================================================================
// Types
// ============================================================================

interface Migration {
  filename: string;
  path: string;
  checksum: string;
  content: string;
}

interface MigrationResult {
  filename: string;
  success: boolean;
  executionTime: number;
  error?: string;
}

// ============================================================================
// Migration Runner Service
// ============================================================================

export class MigrationRunnerService {
  /**
   * Run all pending migrations for a module
   */
  static async runModuleMigrations(
    moduleName: string,
    moduleVersion: string,
    migrationsDir: string
  ): Promise<MigrationResult[]> {
    logger.info(`Running migrations for module: ${moduleName}`);

    try {
      // Get all migration files
      const migrations = await this.loadMigrations(migrationsDir);

      if (migrations.length === 0) {
        logger.info(`No migrations found for module: ${moduleName}`);
        return [];
      }

      // Get already applied migrations
      const appliedMigrations = await this.getAppliedMigrations(moduleName);
      const appliedFilenames = new Set(appliedMigrations.map(m => m.filename));

      // Filter to pending migrations only
      const pendingMigrations = migrations.filter(
        m => !appliedFilenames.has(m.filename)
      );

      if (pendingMigrations.length === 0) {
        logger.info(`All migrations already applied for module: ${moduleName}`);
        return [];
      }

      logger.info(
        `Found ${pendingMigrations.length} pending migration(s) for ${moduleName}`
      );

      // Run each pending migration
      const results: MigrationResult[] = [];
      for (const migration of pendingMigrations) {
        const result = await this.runMigration(
          moduleName,
          moduleVersion,
          migration
        );
        results.push(result);

        // Stop on first failure
        if (!result.success) {
          logger.error(
            `Migration ${migration.filename} failed, stopping execution`
          );
          break;
        }
      }

      return results;
    } catch (error: any) {
      logger.error(`Failed to run migrations for ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Load migration files from a directory
   */
  private static async loadMigrations(migrationsDir: string): Promise<Migration[]> {
    try {
      // Check if directory exists
      try {
        await fs.access(migrationsDir);
      } catch {
        // Directory doesn't exist
        return [];
      }

      // Read all .sql files
      const files = await fs.readdir(migrationsDir);
      const sqlFiles = files
        .filter(f => f.endsWith('.sql'))
        .sort(); // Sort alphabetically for consistent ordering

      const migrations: Migration[] = [];

      for (const filename of sqlFiles) {
        const filePath = path.join(migrationsDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const checksum = this.calculateChecksum(content);

        migrations.push({
          filename,
          path: filePath,
          checksum,
          content,
        });
      }

      return migrations;
    } catch (error: any) {
      throw new Error(`Failed to load migrations from ${migrationsDir}: ${error.message}`);
    }
  }

  /**
   * Get list of already applied migrations for a module
   */
  private static async getAppliedMigrations(moduleName: string) {
    return await prisma.moduleMigration.findMany({
      where: {
        moduleName,
        success: true,
      },
      orderBy: {
        appliedAt: 'asc',
      },
    });
  }

  /**
   * Run a single migration
   */
  private static async runMigration(
    moduleName: string,
    moduleVersion: string,
    migration: Migration
  ): Promise<MigrationResult> {
    const startTime = Date.now();

    try {
      logger.info(`Applying migration: ${moduleName}/${migration.filename}`);

      // Execute migration SQL
      await this.executeMigrationSQL(migration.content);

      const executionTime = Date.now() - startTime;

      // Record successful migration
      await prisma.moduleMigration.create({
        data: {
          moduleName,
          version: moduleVersion,
          filename: migration.filename,
          checksum: migration.checksum,
          success: true,
          executionTime,
        },
      });

      logger.info(
        `Migration ${migration.filename} applied successfully (${executionTime}ms)`
      );

      return {
        filename: migration.filename,
        success: true,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      logger.error(
        `Migration ${migration.filename} failed: ${errorMessage}`
      );

      // Record failed migration
      await prisma.moduleMigration.create({
        data: {
          moduleName,
          version: moduleVersion,
          filename: migration.filename,
          checksum: migration.checksum,
          success: false,
          error: errorMessage,
          executionTime,
        },
      });

      return {
        filename: migration.filename,
        success: false,
        executionTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Execute migration SQL
   * Splits multiple SQL statements and executes them sequentially
   */
  private static async executeMigrationSQL(sql: string): Promise<void> {
    // Split SQL into individual statements
    // This is a simple implementation - doesn't handle all edge cases
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement) {
        await prisma.$executeRawUnsafe(statement);
      }
    }
  }

  /**
   * Calculate SHA-256 checksum of migration content
   */
  private static calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify migration integrity (check if checksums match)
   */
  static async verifyMigrationIntegrity(
    moduleName: string,
    migrationsDir: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const currentMigrations = await this.loadMigrations(migrationsDir);
      const appliedMigrations = await this.getAppliedMigrations(moduleName);

      for (const applied of appliedMigrations) {
        const current = currentMigrations.find(m => m.filename === applied.filename);

        if (!current) {
          errors.push(
            `Applied migration ${applied.filename} no longer exists in migrations directory`
          );
        } else if (current.checksum !== applied.checksum) {
          errors.push(
            `Migration ${applied.filename} has been modified (checksum mismatch)`
          );
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      errors.push(`Failed to verify migrations: ${error.message}`);
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * Get migration status for a module
   */
  static async getMigrationStatus(moduleName: string, migrationsDir: string) {
    try {
      const allMigrations = await this.loadMigrations(migrationsDir);
      const appliedMigrations = await this.getAppliedMigrations(moduleName);
      const appliedFilenames = new Set(appliedMigrations.map(m => m.filename));

      const pending = allMigrations.filter(m => !appliedFilenames.has(m.filename));

      return {
        total: allMigrations.length,
        applied: appliedMigrations.length,
        pending: pending.length,
        pendingFiles: pending.map(m => m.filename),
      };
    } catch (error: any) {
      throw new Error(`Failed to get migration status: ${error.message}`);
    }
  }
}
