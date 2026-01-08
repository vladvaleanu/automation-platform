/**
 * Module manifest validation service
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import semver from 'semver';
import {
  ModuleManifest,
  ModuleValidationResult,
  ModuleValidationError,
} from '../types/module.types';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * JSON Schema for module manifest validation
 * Using a simpler schema without strict typing to avoid AJV nullable issues
 */
const manifestSchema = {
  type: 'object',
  required: ['name', 'version', 'displayName', 'description', 'author', 'capabilities'],
  additionalProperties: true,
  properties: {
    name: {
      type: 'string',
      pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
      minLength: 3,
      maxLength: 50,
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?$',
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
    },
    license: {
      type: 'string',
    },
    capabilities: {
      type: 'object',
      properties: {
        api: {
          type: 'object',
          properties: {
            routes: {
              type: 'array',
              items: {
                type: 'object',
                required: ['method', 'path', 'handler'],
                properties: {
                  method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
                  path: { type: 'string', pattern: '^/' },
                  handler: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  schema: { type: 'object' },
                },
              },
            },
            middleware: { type: 'array', items: { type: 'string' } },
          },
        },
        jobs: {
          type: 'object',
          properties: {
            handlers: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'handler'],
                properties: {
                  name: { type: 'string' },
                  handler: { type: 'string' },
                  schedule: { type: 'string' },
                  timeout: { type: 'number' },
                  retries: { type: 'number' },
                },
              },
            },
          },
        },
        events: {
          type: 'object',
          properties: {
            listeners: {
              type: 'array',
              items: {
                type: 'object',
                required: ['event', 'handler'],
                properties: {
                  event: { type: 'string' },
                  handler: { type: 'string' },
                  priority: { type: 'number' },
                },
              },
            },
            emitters: { type: 'array', items: { type: 'string' } },
          },
        },
        ui: {
          type: 'object',
          properties: {
            pages: {
              type: 'array',
              items: {
                type: 'object',
                required: ['path', 'component', 'title'],
                properties: {
                  path: { type: 'string' },
                  component: { type: 'string' },
                  title: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  icon: { type: 'string' },
                },
              },
            },
            components: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'component'],
                properties: {
                  name: { type: 'string' },
                  component: { type: 'string' },
                  slot: { type: 'string' },
                },
              },
            },
            navigation: {
              type: 'array',
              items: {
                type: 'object',
                required: ['label', 'path'],
                properties: {
                  label: { type: 'string' },
                  path: { type: 'string' },
                  icon: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  order: { type: 'number' },
                  children: { type: 'array' },
                },
              },
            },
          },
        },
      },
    },
    dependencies: {
      type: 'object',
      properties: {
        modules: { type: 'object' },
        npm: { type: 'object' },
        system: {
          type: 'object',
          properties: {
            node: { type: 'string' },
            database: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    config: {
      type: 'object',
      properties: {
        schema: { type: 'object' },
        defaults: { type: 'object' },
      },
    },
    permissions: {
      type: 'array',
      items: { type: 'string' },
    },
    metadata: {
      type: 'object',
      properties: {
        homepage: { type: 'string' },
        repository: { type: 'string' },
        bugs: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        category: { type: 'string' },
      },
    },
  },
};

const validateManifestSchema = ajv.compile(manifestSchema);

/**
 * Module manifest validator
 */
export class ModuleValidator {
  /**
   * Validate a module manifest
   */
  static validate(manifest: any): ModuleValidationResult {
    const errors: ModuleValidationError[] = [];
    const warnings: string[] = [];

    // Schema validation
    const valid = validateManifestSchema(manifest);
    if (!valid && validateManifestSchema.errors) {
      for (const error of validateManifestSchema.errors) {
        errors.push({
          field: error.instancePath || 'root',
          message: error.message || 'Validation failed',
          code: error.keyword,
        });
      }
    }

    // Additional semantic validations
    if (manifest) {
      // Validate version is valid semver
      if (manifest.version && !semver.valid(manifest.version)) {
        errors.push({
          field: 'version',
          message: 'Version must be valid semantic version (e.g., 1.0.0)',
          code: 'invalid_semver',
        });
      }

      // Validate dependencies versions are semver ranges
      if (manifest.dependencies?.modules) {
        for (const [moduleName, versionRange] of Object.entries(
          manifest.dependencies.modules
        )) {
          if (!semver.validRange(versionRange as string)) {
            errors.push({
              field: `dependencies.modules.${moduleName}`,
              message: `Invalid semver range: ${versionRange}`,
              code: 'invalid_version_range',
            });
          }
        }
      }

      // Validate at least one capability is defined
      if (
        !manifest.capabilities?.api &&
        !manifest.capabilities?.jobs &&
        !manifest.capabilities?.events &&
        !manifest.capabilities?.ui
      ) {
        warnings.push('Module has no capabilities defined (api, jobs, events, or ui)');
      }

      // Validate cron expressions in job schedules
      if (manifest.capabilities?.jobs?.handlers) {
        for (const handler of manifest.capabilities.jobs.handlers) {
          if (handler.schedule) {
            // Basic cron validation (would use a library in production)
            const cronParts = handler.schedule.split(' ');
            if (cronParts.length < 5 || cronParts.length > 6) {
              errors.push({
                field: `capabilities.jobs.handlers[${handler.name}].schedule`,
                message: 'Invalid cron expression',
                code: 'invalid_cron',
              });
            }
          }
        }
      }

      // Validate route paths don't conflict
      if (manifest.capabilities?.api?.routes) {
        const routePaths = new Set<string>();
        for (const route of manifest.capabilities.api.routes) {
          const routeKey = `${route.method}:${route.path}`;
          if (routePaths.has(routeKey)) {
            errors.push({
              field: `capabilities.api.routes`,
              message: `Duplicate route: ${routeKey}`,
              code: 'duplicate_route',
            });
          }
          routePaths.add(routeKey);
        }
      }

      // Validate config schema defaults match field types
      if (manifest.config?.schema && manifest.config?.defaults) {
        for (const [key, value] of Object.entries(manifest.config.defaults)) {
          const fieldDef = manifest.config.schema[key];
          if (fieldDef) {
            const valueType = Array.isArray(value) ? 'array' : typeof value;
            if (fieldDef.type !== valueType && fieldDef.type !== 'password') {
              errors.push({
                field: `config.defaults.${key}`,
                message: `Default value type (${valueType}) doesn't match schema type (${fieldDef.type})`,
                code: 'type_mismatch',
              });
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Parse and validate manifest from JSON string
   */
  static parseAndValidate(manifestJson: string): {
    manifest?: ModuleManifest;
    validation: ModuleValidationResult;
  } {
    try {
      const manifest = JSON.parse(manifestJson) as ModuleManifest;
      const validation = this.validate(manifest);
      return { manifest: validation.valid ? manifest : undefined, validation };
    } catch (error) {
      return {
        validation: {
          valid: false,
          errors: [
            {
              field: 'root',
              message: error instanceof Error ? error.message : 'Invalid JSON',
              code: 'parse_error',
            },
          ],
        },
      };
    }
  }
}
