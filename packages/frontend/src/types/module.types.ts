/**
 * Frontend module type definitions
 * Matches @nxforge/core module types (v2 schema)
 */

// ============================================================================
// Module Manifest Types (matches @nxforge/core)
// ============================================================================

export interface ModuleManifest {
  // Identity
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  license?: string;

  // Module structure
  entry: string;

  // Backend configuration
  routes: RouteDefinition[];
  jobs: Record<string, JobDefinition>;
  migrations?: string;

  // Frontend configuration
  ui?: UIConfiguration;

  // Dependencies
  dependencies: {
    [packageName: string]: string;
  };

  // Permissions
  permissions: string[];

  // Settings schema
  settings?: Record<string, SettingDefinition>;
}

// ============================================================================
// Backend Configuration
// ============================================================================

export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
  middleware?: string[];
  description?: string;
}

export interface JobDefinition {
  name: string;
  description: string;
  handler: string;
  schedule: string | null;
  timeout?: number;
  retries?: number;
  config?: Record<string, JobConfigField>;
}

export interface JobConfigField {
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  description?: string;
  default?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  pattern?: string;
}

// ============================================================================
// Frontend Configuration
// ============================================================================

export interface UIConfiguration {
  entry: string;
  sidebar: SidebarConfig;
  routes: UIRouteDefinition[];
}

export interface SidebarConfig {
  label: string;
  icon: string;
  order?: number;
  children: SidebarItem[];
}

export interface SidebarItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string;
}

export interface UIRouteDefinition {
  path: string;
  component: string;
  exact?: boolean;
}

// ============================================================================
// Settings Configuration
// ============================================================================

export interface SettingDefinition {
  type: 'string' | 'number' | 'boolean' | 'select' | 'json';
  label: string;
  description?: string;
  default?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  pattern?: string;
  placeholder?: string;
}

// ============================================================================
// Module Status & Database Types
// ============================================================================

export enum ModuleStatus {
  REGISTERED = 'REGISTERED',
  INSTALLING = 'INSTALLING',
  INSTALLED = 'INSTALLED',
  ENABLING = 'ENABLING',
  ENABLED = 'ENABLED',
  DISABLING = 'DISABLING',
  DISABLED = 'DISABLED',
  UPDATING = 'UPDATING',
  REMOVING = 'REMOVING',
  ERROR = 'ERROR',
}

export interface Module {
  id: string;
  name: string;
  version: string;
  displayName: string;
  description: string;
  author?: string;
  status: ModuleStatus;
  manifest: ModuleManifest;
  config?: Record<string, any>;
  path?: string;
  installedAt?: string;
  enabledAt?: string;
  disabledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Frontend-Specific Types
// ============================================================================

export interface LoadedModule {
  manifest: ModuleManifest;
  component?: React.ComponentType<any>;
  error?: Error;
  isLoading: boolean;
}

export interface ModuleComponentProps {
  moduleId: string;
  moduleName: string;
  config?: Record<string, any>;
}
