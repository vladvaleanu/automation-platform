/**
 * Module Validator Service
 * Validates module manifests against the JSON schema
 */

import Ajv from 'ajv';
import { ModuleManifest, ModuleValidationResult } from '../types/module.types';

// ============================================================================
// JSON Schema for Module Manifest
// ============================================================================

const moduleManifestSchema: any = {
  type: 'object',
  properties: {
    // Identity
    name: {
      type: 'string',
      pattern: '^[a-z0-9-]+$',
      minLength: 1,
      maxLength: 50,
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?$',  // Semver
    },
    displayName: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    description: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
    },
    author: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    license: {
      type: 'string',
      },

    // Module structure
    entry: {
      type: 'string',
      minLength: 1,
    },

    // Backend
    routes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          },
          path: {
            type: 'string',
            minLength: 1,
          },
          handler: {
            type: 'string',
            minLength: 1,
          },
          middleware: {
            type: 'array',
            items: { type: 'string' },
            },
          description: {
            type: 'string',
            },
        },
        required: ['method', 'path', 'handler'],
        additionalProperties: false,
      },
    },
    jobs: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          handler: { type: 'string' },
          schedule: { type: ['string', 'null'], },
          timeout: { type: 'number', },
          retries: { type: 'number', },
          config: {
            type: 'object',
            additionalProperties: true,
          },
        },
        required: ['name', 'description', 'handler'],
        additionalProperties: false,
      },
    },
    migrations: {
      type: 'string',
      },

    // Frontend
    ui: {
      type: 'object',
      properties: {
        entry: { type: 'string' },
        sidebar: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            icon: { type: 'string' },
            order: { type: 'number', },
            children: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  path: { type: 'string' },
                  icon: { type: 'string', },
                  badge: { type: 'string', },
                },
                required: ['label', 'path'],
                additionalProperties: false,
              },
            },
          },
          required: ['label', 'icon', 'children'],
          additionalProperties: false,
        },
        routes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              component: { type: 'string' },
              exact: { type: 'boolean', },
            },
            required: ['path', 'component'],
            additionalProperties: false,
          },
        },
      },
      required: ['entry', 'sidebar', 'routes'],
      additionalProperties: false,
    },

    // Dependencies
    dependencies: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },

    // Permissions
    permissions: {
      type: 'array',
      items: { type: 'string' },
    },

    // Settings
    settings: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['string', 'number', 'boolean', 'select', 'json'],
          },
          label: { type: 'string' },
          description: { type: 'string', },
          default: { },
          required: { type: 'boolean', },
          options: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          min: { type: 'number', },
          max: { type: 'number', },
          pattern: { type: 'string', },
          placeholder: { type: 'string', },
        },
        required: ['type', 'label'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'name',
    'version',
    'displayName',
    'description',
    'author',
    'entry',
    'routes',
    'jobs',
    'dependencies',
    'permissions',
  ],
  additionalProperties: false,
};

// ============================================================================
// Module Validator Service
// ============================================================================

export class ModuleValidatorService {
  private static ajv = new Ajv({ allErrors: true, strict: false });
  private static validator = this.ajv.compile(moduleManifestSchema);

  /**
   * Validate a module manifest
   */
  static validate(manifest: any): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Schema validation
    const valid = this.validator(manifest);

    if (!valid && this.validator.errors) {
      for (const error of this.validator.errors) {
        const field = error.instancePath || error.params?.missingProperty || 'unknown';
        const message = `${field}: ${error.message}`;
        errors.push(message);
      }
    }

    // Additional custom validations
    if (manifest) {
      // Check name format
      if (manifest.name && !/^[a-z0-9-]+$/.test(manifest.name)) {
        errors.push('name: must be lowercase kebab-case (only a-z, 0-9, and -)');
      }

      // Check version format (semver)
      if (manifest.version && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(manifest.version)) {
        errors.push('version: must be valid semver (e.g., 1.0.0, 1.0.0-beta.1)');
      }

      // Check for duplicate route paths
      if (manifest.routes && Array.isArray(manifest.routes)) {
        const paths = manifest.routes.map((r: any) => `${r.method} ${r.path}`);
        const duplicates = paths.filter((p: string, i: number) => paths.indexOf(p) !== i);
        if (duplicates.length > 0) {
          errors.push(`routes: duplicate routes found: ${duplicates.join(', ')}`);
        }
      }

      // Check for valid cron expressions in jobs
      if (manifest.jobs) {
        for (const [jobName, job] of Object.entries(manifest.jobs)) {
          const jobDef = job as any;
          if (jobDef.schedule && jobDef.schedule !== null) {
            if (!this.isValidCron(jobDef.schedule)) {
              warnings.push(`jobs.${jobName}.schedule: "${jobDef.schedule}" may not be a valid cron expression`);
            }
          }
        }
      }

      // Check UI routes path patterns
      if (manifest.ui?.routes) {
        for (const route of manifest.ui.routes) {
          if (!route.path.startsWith('/')) {
            errors.push(`ui.routes: path "${route.path}" must start with /`);
          }
        }
      }

      // Check permissions format
      if (manifest.permissions && Array.isArray(manifest.permissions)) {
        for (const perm of manifest.permissions) {
          if (typeof perm === 'string' && !perm.includes(':')) {
            warnings.push(`permissions: "${perm}" should follow format "resource:action" (e.g., "database:read")`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Basic cron expression validation
   */
  private static isValidCron(expression: string): boolean {
    // Basic check: should have 5 or 6 parts
    const parts = expression.trim().split(/\s+/);
    return parts.length === 5 || parts.length === 6;
  }

  /**
   * Get JSON schema (for documentation or external use)
   */
  static getSchema(): any {
    return moduleManifestSchema;
  }
}
