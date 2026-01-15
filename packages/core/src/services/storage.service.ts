/**
 * Storage Service - Core
 * Provides file system operations for NxForge modules
 *
 * Features:
 * - File operations (read, write, delete, exists)
 * - Directory management
 * - Screenshot storage for debugging
 * - Module asset storage with isolation
 * - Safe file path handling
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface StorageConfig {
  baseDir?: string;
  screenshotsDir?: string;
  modulesDir?: string;
  tempDir?: string;
}

export interface FileInfo {
  path: string;
  size: number;
  created: Date;
  modified: Date;
  exists: boolean;
}

// ============================================================================
// Storage Service
// ============================================================================

export class StorageService {
  private static config: StorageConfig = {
    baseDir: process.cwd(),
    screenshotsDir: 'data/screenshots',
    modulesDir: 'modules',
    tempDir: 'data/temp',
  };

  /**
   * Configure storage paths
   */
  static configure(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  static getConfig(): StorageConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Basic File Operations
  // ============================================================================

  /**
   * Save file to disk
   */
  static async saveFile(
    filePath: string,
    content: Buffer | string,
    options?: { encoding?: BufferEncoding; mode?: number }
  ): Promise<string> {
    const absolutePath = this.resolveAbsolutePath(filePath);

    // Ensure directory exists
    await this.ensureDir(path.dirname(absolutePath));

    // Write file
    if (Buffer.isBuffer(content)) {
      await fs.writeFile(absolutePath, content, { mode: options?.mode });
    } else {
      await fs.writeFile(absolutePath, content, {
        encoding: options?.encoding || 'utf-8',
        mode: options?.mode,
      });
    }

    return absolutePath;
  }

  /**
   * Read file from disk
   */
  static async readFile(filePath: string, encoding?: BufferEncoding): Promise<Buffer | string> {
    const absolutePath = this.resolveAbsolutePath(filePath);

    if (encoding) {
      return fs.readFile(absolutePath, { encoding });
    } else {
      return fs.readFile(absolutePath);
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath: string): Promise<void> {
    const absolutePath = this.resolveAbsolutePath(filePath);
    await fs.unlink(absolutePath);
  }

  /**
   * Check if file exists
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = this.resolveAbsolutePath(filePath);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if file exists (synchronous)
   */
  static existsSync(filePath: string): boolean {
    try {
      const absolutePath = this.resolveAbsolutePath(filePath);
      fsSync.accessSync(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file information
   */
  static async getFileInfo(filePath: string): Promise<FileInfo> {
    const absolutePath = this.resolveAbsolutePath(filePath);
    const exists = await this.exists(absolutePath);

    if (!exists) {
      return {
        path: absolutePath,
        size: 0,
        created: new Date(0),
        modified: new Date(0),
        exists: false,
      };
    }

    const stats = await fs.stat(absolutePath);

    return {
      path: absolutePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true,
    };
  }

  /**
   * Copy file
   */
  static async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const absoluteSource = this.resolveAbsolutePath(sourcePath);
    const absoluteDest = this.resolveAbsolutePath(destPath);

    // Ensure destination directory exists
    await this.ensureDir(path.dirname(absoluteDest));

    await fs.copyFile(absoluteSource, absoluteDest);
  }

  /**
   * Move/rename file
   */
  static async moveFile(sourcePath: string, destPath: string): Promise<void> {
    const absoluteSource = this.resolveAbsolutePath(sourcePath);
    const absoluteDest = this.resolveAbsolutePath(destPath);

    // Ensure destination directory exists
    await this.ensureDir(path.dirname(absoluteDest));

    await fs.rename(absoluteSource, absoluteDest);
  }

  // ============================================================================
  // Directory Operations
  // ============================================================================

  /**
   * Ensure directory exists (create if not)
   */
  static async ensureDir(dirPath: string): Promise<void> {
    const absolutePath = this.resolveAbsolutePath(dirPath);
    await fs.mkdir(absolutePath, { recursive: true });
  }

  /**
   * Delete directory and contents
   */
  static async deleteDir(dirPath: string, recursive: boolean = true): Promise<void> {
    const absolutePath = this.resolveAbsolutePath(dirPath);
    await fs.rm(absolutePath, { recursive, force: true });
  }

  /**
   * List files in directory
   */
  static async listFiles(
    dirPath: string,
    options?: { recursive?: boolean; filter?: (file: string) => boolean }
  ): Promise<string[]> {
    const absolutePath = this.resolveAbsolutePath(dirPath);
    const files: string[] = [];

    const entries = await fs.readdir(absolutePath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(absolutePath, entry.name);
      const relativePath = path.relative(this.config.baseDir!, fullPath);

      if (entry.isDirectory() && options?.recursive) {
        const subFiles = await this.listFiles(fullPath, options);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        if (!options?.filter || options.filter(relativePath)) {
          files.push(relativePath);
        }
      }
    }

    return files;
  }

  /**
   * Get directory size (total bytes)
   */
  static async getDirectorySize(dirPath: string): Promise<number> {
    const absolutePath = this.resolveAbsolutePath(dirPath);
    let totalSize = 0;

    const entries = await fs.readdir(absolutePath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(absolutePath, entry.name);

      if (entry.isDirectory()) {
        totalSize += await this.getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  // ============================================================================
  // Screenshot Storage
  // ============================================================================

  /**
   * Save screenshot with auto-generated filename
   */
  static async saveScreenshot(
    screenshot: Buffer,
    options?: { prefix?: string; metadata?: Record<string, any> }
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = crypto.createHash('md5').update(screenshot).digest('hex').substring(0, 8);
    const prefix = options?.prefix || 'screenshot';
    const filename = `${prefix}_${timestamp}_${hash}.png`;

    const screenshotPath = path.join(this.config.screenshotsDir!, filename);
    await this.saveFile(screenshotPath, screenshot);

    // Save metadata if provided
    if (options?.metadata) {
      const metadataPath = screenshotPath.replace('.png', '.json');
      await this.saveFile(metadataPath, JSON.stringify(options.metadata, null, 2));
    }

    return screenshotPath;
  }

  /**
   * Get screenshot file path
   */
  static getScreenshotPath(filename: string): string {
    return path.join(this.config.screenshotsDir!, filename);
  }

  /**
   * List all screenshots
   */
  static async listScreenshots(prefix?: string): Promise<string[]> {
    const screenshotDir = this.resolveAbsolutePath(this.config.screenshotsDir!);

    if (!(await this.exists(screenshotDir))) {
      return [];
    }

    return this.listFiles(screenshotDir, {
      filter: (file) => {
        const isPng = file.endsWith('.png');
        const matchesPrefix = prefix ? path.basename(file).startsWith(prefix) : true;
        return isPng && matchesPrefix;
      },
    });
  }

  /**
   * Clean old screenshots (older than specified days)
   */
  static async cleanOldScreenshots(daysOld: number = 7): Promise<number> {
    const screenshots = await this.listScreenshots();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    for (const screenshot of screenshots) {
      const info = await this.getFileInfo(screenshot);
      if (info.created < cutoffDate) {
        await this.deleteFile(screenshot);
        // Delete metadata file if exists
        const metadataPath = screenshot.replace('.png', '.json');
        if (await this.exists(metadataPath)) {
          await this.deleteFile(metadataPath);
        }
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // ============================================================================
  // Module Asset Storage
  // ============================================================================

  /**
   * Get module asset path (isolated by module name)
   */
  static getModuleAssetPath(moduleName: string, assetPath: string): string {
    // Sanitize module name to prevent directory traversal
    const sanitizedModuleName = moduleName.replace(/[^a-z0-9-_]/gi, '_');
    return path.join(this.config.modulesDir!, sanitizedModuleName, assetPath);
  }

  /**
   * Save module asset
   */
  static async saveModuleAsset(
    moduleName: string,
    assetPath: string,
    content: Buffer | string
  ): Promise<string> {
    const fullPath = this.getModuleAssetPath(moduleName, assetPath);
    return this.saveFile(fullPath, content);
  }

  /**
   * Read module asset
   */
  static async readModuleAsset(
    moduleName: string,
    assetPath: string,
    encoding?: BufferEncoding
  ): Promise<Buffer | string> {
    const fullPath = this.getModuleAssetPath(moduleName, assetPath);
    return this.readFile(fullPath, encoding);
  }

  /**
   * Delete module asset
   */
  static async deleteModuleAsset(moduleName: string, assetPath: string): Promise<void> {
    const fullPath = this.getModuleAssetPath(moduleName, assetPath);
    await this.deleteFile(fullPath);
  }

  /**
   * List module assets
   */
  static async listModuleAssets(moduleName: string, subPath?: string): Promise<string[]> {
    const basePath = subPath
      ? this.getModuleAssetPath(moduleName, subPath)
      : this.getModuleAssetPath(moduleName, '');

    if (!(await this.exists(basePath))) {
      return [];
    }

    return this.listFiles(basePath, { recursive: true });
  }

  /**
   * Clean module directory (delete all assets)
   */
  static async cleanModuleAssets(moduleName: string): Promise<void> {
    const modulePath = this.getModuleAssetPath(moduleName, '');
    if (await this.exists(modulePath)) {
      await this.deleteDir(modulePath);
    }
  }

  // ============================================================================
  // Temporary File Operations
  // ============================================================================

  /**
   * Create temporary file
   */
  static async createTempFile(
    content: Buffer | string,
    extension?: string
  ): Promise<string> {
    const filename = `temp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${extension || ''}`;
    const tempPath = path.join(this.config.tempDir!, filename);
    return this.saveFile(tempPath, content);
  }

  /**
   * Clean temporary files (older than specified hours)
   */
  static async cleanTempFiles(hoursOld: number = 24): Promise<number> {
    const tempDir = this.resolveAbsolutePath(this.config.tempDir!);

    if (!(await this.exists(tempDir))) {
      return 0;
    }

    const files = await this.listFiles(tempDir);
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

    let deletedCount = 0;

    for (const file of files) {
      const info = await this.getFileInfo(file);
      if (info.created < cutoffDate) {
        await this.deleteFile(file);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Resolve path to absolute path
   */
  private static resolveAbsolutePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.config.baseDir!, filePath);
  }

  /**
   * Get file extension
   */
  static getExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * Get filename without extension
   */
  static getBasename(filePath: string, includeExtension: boolean = true): string {
    return includeExtension ? path.basename(filePath) : path.basename(filePath, path.extname(filePath));
  }

  /**
   * Format bytes to human-readable size
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
}
