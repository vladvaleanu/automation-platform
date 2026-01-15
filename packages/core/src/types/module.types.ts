/**
 * Module System Types
 * Defines the structure for NxForge modules and their manifests
 */

// ============================================================================
// Module Manifest Types
// ============================================================================

export interface ModuleManifest {
  // Identity
  name: string;                    // kebab-case unique identifier (e.g., "consumption-monitor")
  version: string;                 // semver (e.g., "1.0.0")
  displayName: string;             // Human-readable name
  description: string;             // Short description
  author: string;                  // Author name or organization
  license?: string;                // License type (e.g., "MIT")

  // Module structure
  entry: string;                   // Backend entry point (e.g., "./dist/index.js")

  // Backend configuration
  routes: RouteDefinition[];       // API routes to register
  jobs: Record<string, JobDefinition>;  // Job handlers
  migrations?: string;             // Path to migrations directory

  // Frontend configuration
  ui?: UIConfiguration;            // Frontend UI configuration

  // Dependencies
  dependencies: {
    [packageName: string]: string; // Package name -> semver range
  };

  // Permissions
  permissions: string[];           // Required permissions (e.g., ["database:read", "network:outbound"])

  // Settings schema
  settings?: Record<string, SettingDefinition>;  // Module-specific settings
}

// ============================================================================
// Backend Route Configuration
// ============================================================================

export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;                    // Relative path (will be prefixed with /api/v1/m/{module-name})
  handler: string;                 // Path to handler file (relative to module root)
  middleware?: string[];           // Optional middleware names
  description?: string;            // Route description for documentation
}

// ============================================================================
// Job Configuration
// ============================================================================

export interface JobDefinition {
  name: string;                    // Display name
  description: string;             // Job description
  handler: string;                 // Path to job handler file
  schedule: string | null;         // Cron expression or null for manual execution
  timeout?: number;                // Timeout in milliseconds (default: 300000)
  retries?: number;                // Number of retry attempts (default: 3)
  config?: Record<string, JobConfigField>;  // Job-specific configuration schema
}

export interface JobConfigField {
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  description?: string;
  default?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;  // For 'select' type
  min?: number;                    // For 'number' type
  max?: number;                    // For 'number' type
  pattern?: string;                // For 'string' type validation
}

// ============================================================================
// Frontend UI Configuration
// ============================================================================

export interface UIConfiguration {
  entry: string;                   // UI entry point (e.g., "./ui/index.js")
  sidebar: SidebarConfig;          // Sidebar menu configuration
  routes: UIRouteDefinition[];     // Frontend routes
}

export interface SidebarConfig {
  label: string;                   // Menu item label
  icon: string;                    // Icon (emoji or icon name)
  order?: number;                  // Display order (lower = higher in menu)
  children: SidebarItem[];         // Child menu items
}

export interface SidebarItem {
  label: string;                   // Menu item label
  path: string;                    // Full path (e.g., "/consumption/live")
  icon?: string;                   // Optional icon
  badge?: string;                  // Optional badge text
}

export interface UIRouteDefinition {
  path: string;                    // React Router path pattern (e.g., "/consumption/*")
  component: string;               // Path to component file
  exact?: boolean;                 // Exact path matching
}

// ============================================================================
// Module Settings
// ============================================================================

export interface SettingDefinition {
  type: 'string' | 'number' | 'boolean' | 'select' | 'json';
  label: string;
  description?: string;
  default?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;  // For 'select' type
  min?: number;                    // For 'number' type
  max?: number;                    // For 'number' type
  pattern?: string;                // For 'string' type validation
  placeholder?: string;            // UI placeholder text
}

// ============================================================================
// Module Metadata (Database representation)
// ============================================================================

export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  status: ModuleStatus;
  manifest: ModuleManifest;
  config?: Record<string, any>;    // User-provided configuration values
  path?: string;                   // File system path to module
  installedAt?: Date;
  enabledAt?: Date;
  disabledAt?: Date;
  updatedAt: Date;
  createdAt: Date;
}

export enum ModuleStatus {
  REGISTERED = 'REGISTERED',       // Manifest registered but not installed
  INSTALLING = 'INSTALLING',       // Installation in progress
  INSTALLED = 'INSTALLED',         // Installed but not enabled
  ENABLING = 'ENABLING',           // Being enabled
  ENABLED = 'ENABLED',             // Active and running
  DISABLING = 'DISABLING',         // Being disabled
  DISABLED = 'DISABLED',           // Installed but inactive
  UPDATING = 'UPDATING',           // Update in progress
  REMOVING = 'REMOVING',           // Uninstall in progress
  ERROR = 'ERROR',                 // Error state
}

// ============================================================================
// Module Lifecycle Events
// ============================================================================

export interface ModuleLifecycleEvent {
  moduleId: string;
  moduleName: string;
  event: ModuleLifecycleEventType;
  timestamp: Date;
  details?: any;
  error?: string;
}

export enum ModuleLifecycleEventType {
  INSTALL_START = 'INSTALL_START',
  INSTALL_SUCCESS = 'INSTALL_SUCCESS',
  INSTALL_ERROR = 'INSTALL_ERROR',
  ENABLE_START = 'ENABLE_START',
  ENABLE_SUCCESS = 'ENABLE_SUCCESS',
  ENABLE_ERROR = 'ENABLE_ERROR',
  DISABLE_START = 'DISABLE_START',
  DISABLE_SUCCESS = 'DISABLE_SUCCESS',
  DISABLE_ERROR = 'DISABLE_ERROR',
  UNINSTALL_START = 'UNINSTALL_START',
  UNINSTALL_SUCCESS = 'UNINSTALL_SUCCESS',
  UNINSTALL_ERROR = 'UNINSTALL_ERROR',
  UPDATE_START = 'UPDATE_START',
  UPDATE_SUCCESS = 'UPDATE_SUCCESS',
  UPDATE_ERROR = 'UPDATE_ERROR',
}

// ============================================================================
// Module Runtime Context
// ============================================================================

/**
 * Context provided to modules at runtime
 * Contains access to services, configuration, and utilities
 */
export interface ModuleContext {
  moduleName: string;
  moduleVersion: string;
  services: ModuleServices;
  config?: Record<string, any>;
}

/**
 * Context provided to job handlers
 */
export interface JobContext {
  moduleName: string;
  moduleVersion: string;
  jobName: string;
  services: ModuleServices;
  config?: Record<string, any>;
}

/**
 * Services available to modules
 */
export interface ModuleServices {
  logger: Logger;
  prisma: any; // PrismaClient
  scraping?: any; // ScrapingService
  http?: any; // HttpService
  storage?: any; // StorageService
  notification?: any; // NotificationService
}

/**
 * Logger interface
 */
export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// ============================================================================
// Module Validation
// ============================================================================

export interface ModuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ModuleValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ============================================================================
// Module Installation
// ============================================================================

export interface ModuleInstallOptions {
  skipMigrations?: boolean;        // Skip running database migrations
  skipDependencies?: boolean;      // Skip dependency installation
  force?: boolean;                 // Force installation even if validation fails
}

export interface ModuleInstallResult {
  success: boolean;
  moduleId?: string;
  errors?: string[];
  warnings?: string[];
  migrationsApplied?: number;
  dependenciesInstalled?: string[];
}

// ============================================================================
// Permission System
// ============================================================================

export type ModulePermission =
  | 'database:read'
  | 'database:write'
  | 'network:outbound'
  | 'network:inbound'
  | 'storage:read'
  | 'storage:write'
  | 'system:execute'
  | string;  // Allow custom permissions

// ============================================================================
// Module Query Filters
// ============================================================================

export interface ModuleQueryFilter {
  status?: ModuleStatus | ModuleStatus[];
  name?: string;
  search?: string;              // Search in name, displayName, description
  author?: string;
  hasUI?: boolean;
  hasJobs?: boolean;
}
