/**
 * Shared Constants
 * Single source of truth for magic numbers, timeouts, limits, and configuration values
 */

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  // HTTP/Request timeouts
  HTTP_REQUEST: 30 * 1000, // 30 seconds
  CONNECTION: 30 * 1000, // 30 seconds
  KEEP_ALIVE: 5 * 1000, // 5 seconds

  // Job execution timeouts
  JOB_DEFAULT: 5 * 60 * 1000, // 5 minutes (300000ms)
  JOB_SHORT: 1 * 60 * 1000, // 1 minute
  JOB_LONG: 30 * 60 * 1000, // 30 minutes

  // Browser/Scraping timeouts
  BROWSER_NAVIGATION: 30 * 1000, // 30 seconds
  BROWSER_WAIT: 10 * 1000, // 10 seconds

  // Database timeouts
  DB_QUERY: 30 * 1000, // 30 seconds

  // Cache/Queue retention
  QUEUE_COMPLETED: 24 * 60 * 60 * 1000, // 24 hours (86400000ms)
  QUEUE_FAILED: 7 * 24 * 60 * 60 * 1000, // 7 days (604800000ms)
} as const;

/**
 * Request size limits (in bytes)
 */
export const SIZE_LIMITS = {
  // Request body limits
  REQUEST_BODY: 5 * 1024 * 1024, // 5MB
  REQUEST_BODY_LARGE: 50 * 1024 * 1024, // 50MB (for file uploads)

  // File upload limits
  FILE_UPLOAD_MAX: 10 * 1024 * 1024, // 10MB

  // Response limits
  LOG_MAX_LENGTH: 100 * 1024, // 100KB for logs
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  // Global limits
  GLOBAL_MAX: 100, // requests per time window
  GLOBAL_MAX_DEV: 1000, // Higher limit for development
  GLOBAL_TIME_WINDOW: 60 * 1000, // 1 minute

  // Auth endpoints
  LOGIN_MAX: 5, // attempts per time window
  LOGIN_TIME_WINDOW: 60 * 1000, // 1 minute
  REGISTER_MAX: 3, // registrations per time window
  REGISTER_TIME_WINDOW: 60 * 60 * 1000, // 1 hour

  // API endpoints
  API_MAX: 60, // requests per minute
  API_TIME_WINDOW: 60 * 1000, // 1 minute
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000, // Maximum records per query
  MIN_LIMIT: 1,
} as const;

/**
 * Job system configuration
 */
export const JOB_CONFIG = {
  // Worker configuration
  DEFAULT_CONCURRENCY: 5, // Number of parallel job workers
  MAX_CONCURRENCY: 20,

  // Retry configuration
  DEFAULT_RETRIES: 3,
  MAX_RETRIES: 10,

  // Queue configuration
  QUEUE_NAME: 'automation-jobs',
  CACHE_SIZE: 10000, // Number of jobs to cache

  // Schedule polling
  SCHEDULE_CHECK_INTERVAL: 60 * 1000, // Check for due schedules every minute
} as const;

/**
 * Security configuration
 */
export const SECURITY = {
  // JWT
  JWT_MIN_SECRET_LENGTH: 32,

  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  // bcrypt
  BCRYPT_ROUNDS: 12,

  // Session
  SESSION_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Module system configuration
 */
export const MODULE_CONFIG = {
  // Module directory
  MODULES_DIR: 'modules',

  // Module loading
  MAX_LOAD_RETRIES: 3,
  LOAD_TIMEOUT: 30 * 1000, // 30 seconds

  // Route prefix
  MODULE_ROUTE_PREFIX: '/m',
} as const;

/**
 * Database configuration
 */
export const DATABASE = {
  // Connection pool
  CONNECTION_POOL_MIN: 2,
  CONNECTION_POOL_MAX: 10,

  // Query timeouts
  QUERY_TIMEOUT: 30 * 1000, // 30 seconds

  // Batch sizes
  BATCH_SIZE: 100,
  MAX_BATCH_SIZE: 1000,
} as const;

/**
 * Logging configuration
 */
export const LOGGING = {
  // Log retention
  LOG_RETENTION_DAYS: 30,

  // Log levels
  LEVELS: {
    FATAL: 60,
    ERROR: 50,
    WARN: 40,
    INFO: 30,
    DEBUG: 20,
    TRACE: 10,
  } as const,
} as const;

/**
 * Browser configuration
 */
export const BROWSER = {
  // Default viewport
  DEFAULT_VIEWPORT: { width: 1280, height: 720 },

  // User agent
  DEFAULT_USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
} as const;

/**
 * HTTP retry configuration
 */
export const HTTP_RETRY = {
  DEFAULT_RETRIES: 3,
  MAX_BACKOFF: 10000, // 10 seconds
  INITIAL_BACKOFF: 1000, // 1 second
  DOWNLOAD_TIMEOUT: 60000, // 60 seconds
  URL_CHECK_TIMEOUT: 5000, // 5 seconds
} as const;

/**
 * Cache configuration
 */
export const CACHE = {
  // TTL values (in seconds)
  SHORT: 60, // 1 minute
  MEDIUM: 5 * 60, // 5 minutes
  LONG: 30 * 60, // 30 minutes
  VERY_LONG: 24 * 60 * 60, // 24 hours

  // Cache key prefixes
  PREFIXES: {
    MODULE: 'module:',
    JOB: 'job:',
    USER: 'user:',
    SESSION: 'session:',
  } as const,
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Unauthorized - Authentication required',
  FORBIDDEN: 'Forbidden - Insufficient permissions',
  TOKEN_EXPIRED: 'Authentication token has expired',

  // Resource errors
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  CONFLICT: 'Request conflicts with current state',

  // Validation errors
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED: 'Required field(s) missing',

  // Server errors
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',

  // Module errors
  MODULE_NOT_FOUND: 'Module not found',
  MODULE_ALREADY_ENABLED: 'Module is already enabled',
  MODULE_ALREADY_DISABLED: 'Module is already disabled',
  MODULE_LOAD_FAILED: 'Failed to load module',

  // Job errors
  JOB_NOT_FOUND: 'Job not found',
  JOB_ALREADY_RUNNING: 'Job is already running',
  JOB_EXECUTION_FAILED: 'Job execution failed',
} as const;

/**
 * Environment names
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TEST: 'test',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

/**
 * Queue job statuses
 */
export const JOB_STATUSES = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
} as const;

/**
 * Module statuses
 */
export const MODULE_STATUSES = {
  REGISTERED: 'REGISTERED',
  INSTALLED: 'INSTALLED',
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED',
  ERROR: 'ERROR',
} as const;

/**
 * Event types
 */
export const EVENT_TYPES = {
  MODULE_LOADED: 'module.loaded',
  MODULE_UNLOADED: 'module.unloaded',
  MODULE_ENABLED: 'module.enabled',
  MODULE_DISABLED: 'module.disabled',
  JOB_STARTED: 'job.started',
  JOB_COMPLETED: 'job.completed',
  JOB_FAILED: 'job.failed',
  SYSTEM_ERROR: 'system.error',
} as const;
