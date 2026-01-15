/**
 * Environment configuration
 * Loads and validates environment variables
 */

import { config } from 'dotenv';

// Load .env file
config();

// Insecure default secrets (only for development)
const INSECURE_DEFAULTS = {
  JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
  REFRESH_TOKEN_SECRET: 'your-super-secret-refresh-key-change-in-production',
};

// Validate that secrets are not using insecure defaults in production
function validateSecrets() {
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  if (!isDev) {
    const jwtSecret = process.env.JWT_SECRET || INSECURE_DEFAULTS.JWT_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || INSECURE_DEFAULTS.REFRESH_TOKEN_SECRET;

    if (jwtSecret === INSECURE_DEFAULTS.JWT_SECRET) {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET is using the default value! ' +
        'Set a secure random JWT_SECRET environment variable before running in production.'
      );
    }

    if (refreshSecret === INSECURE_DEFAULTS.REFRESH_TOKEN_SECRET) {
      throw new Error(
        'CRITICAL SECURITY ERROR: REFRESH_TOKEN_SECRET is using the default value! ' +
        'Set a secure random REFRESH_TOKEN_SECRET environment variable before running in production.'
      );
    }

    // Validate minimum secret length
    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    if (refreshSecret.length < 32) {
      throw new Error('REFRESH_TOKEN_SECRET must be at least 32 characters long');
    }
  }
}

// Run validation
validateSecrets();

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  HOST: process.env.HOST || '0.0.0.0',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nxforge',

  // JWT - Use insecure defaults only in development
  JWT_SECRET: process.env.JWT_SECRET || INSECURE_DEFAULTS.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || INSECURE_DEFAULTS.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  PRETTY_LOGS: process.env.PRETTY_LOGS === 'true' || process.env.NODE_ENV === 'development',
} as const;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
