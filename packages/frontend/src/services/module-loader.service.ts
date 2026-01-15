/**
 * Frontend Module Loader Service
 * Manages dynamic loading of module UI components
 */

import { Module, ModuleStatus, SidebarConfig } from '../types/module.types';
import { modulesApi } from '../api/modules';

// ============================================================================
// Module Loader Service
// ============================================================================

class ModuleLoaderService {
  private enabledModules: Module[] = [];
  private isInitialized = false;
  private isLoading = false;
  private error: Error | null = null;

  /**
   * Initialize and load all enabled modules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[ModuleLoader] Already initialized');
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      console.log('[ModuleLoader] Fetching enabled modules from API...');
      // Fetch all enabled modules from API
      const modules = await modulesApi.list({ status: ModuleStatus.ENABLED });

      console.log('[ModuleLoader] API response:', modules);

      // Handle case where modules is undefined or null
      if (!modules) {
        console.warn('[ModuleLoader] No modules returned from API, initializing with empty array');
        this.enabledModules = [];
      } else {
        this.enabledModules = modules;
        console.log('[ModuleLoader] Enabled modules:', this.enabledModules);
      }

      this.isInitialized = true;
      console.log(`[ModuleLoader] Loaded ${this.enabledModules.length} enabled module(s)`);
    } catch (err) {
      this.error = err as Error;
      console.error('[ModuleLoader] Failed to load modules:', err);
      // Don't throw - initialize with empty array so app can continue
      this.enabledModules = [];
      this.isInitialized = true;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Reload modules (refetch from API)
   */
  async reload(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Get all enabled modules
   */
  getEnabledModules(): Module[] {
    return this.enabledModules || [];
  }

  /**
   * Get module by name
   */
  getModule(name: string): Module | undefined {
    return this.enabledModules.find(m => m.name === name);
  }

  /**
   * Get sidebar configuration from all enabled modules
   * Sorted by order (ascending)
   */
  getSidebarConfig(): Array<SidebarConfig & { moduleName: string }> {
    // Safety check: ensure enabledModules is initialized
    if (!this.enabledModules || !Array.isArray(this.enabledModules)) {
      console.warn('[ModuleLoader] getSidebarConfig called before initialization');
      return [];
    }

    return this.enabledModules
      .filter(m => m?.manifest?.ui?.sidebar)
      .map(m => ({
        ...m.manifest.ui!.sidebar,
        moduleName: m.name,
      }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  /**
   * Get all module routes
   */
  getModuleRoutes(): Array<{ moduleName: string; path: string; component: string }> {
    const routes: Array<{ moduleName: string; path: string; component: string }> = [];

    // Safety check: ensure enabledModules is initialized
    if (!this.enabledModules || !Array.isArray(this.enabledModules)) {
      console.warn('[ModuleLoader] getModuleRoutes called before initialization');
      return [];
    }

    for (const module of this.enabledModules) {
      if (module?.manifest?.ui?.routes) {
        for (const route of module.manifest.ui.routes) {
          routes.push({
            moduleName: module.name,
            path: route.path,
            component: route.component,
          });
        }
      }
    }

    return routes;
  }

  /**
   * Check if modules are loaded
   */
  isReady(): boolean {
    return this.isInitialized && !this.isLoading;
  }

  /**
   * Get loading state
   */
  getLoadingState(): boolean {
    return this.isLoading;
  }

  /**
   * Get error state
   */
  getError(): Error | null {
    return this.error;
  }

  /**
   * Reset the service
   */
  reset(): void {
    this.enabledModules = [];
    this.isInitialized = false;
    this.isLoading = false;
    this.error = null;
  }
}

// Export singleton instance
export const moduleLoaderService = new ModuleLoaderService();
