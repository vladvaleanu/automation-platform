/**
 * Module API client
 */

import { apiClient } from './client';
import { Module, ModuleManifest, ModuleStatus } from '../types/module.types';

export interface ListModulesParams {
  status?: ModuleStatus;
  search?: string;
}

export interface ModuleResponse {
  success: boolean;
  data: Module;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface ModulesResponse {
  success: boolean;
  data: Module[];
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export const modulesApi = {
  /**
   * List all modules
   */
  list: async (params?: ListModulesParams): Promise<Module[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    const url = `/modules${query ? `?${query}` : ''}`;
    console.log("[modulesApi] Calling:", url, "with params:", params);

    const response = await apiClient.get<ModulesResponse>(url);
    console.log("[modulesApi] Raw response:", response);
    console.log("[modulesApi] response.data:", response.data);

    // Defensive check for response structure
    if (!response || !response.data) {
      console.error('[modulesApi] Invalid response structure:', response);
      return [];
    }

    // The apiClient already unwraps to response.data, so modules are in response.data not response.data.data
    return Array.isArray(response.data) ? response.data : (response.data.data || []);
  },

  /**
   * Get module details by name
   */
  get: async (name: string): Promise<Module> => {
    const response = await apiClient.get<ModuleResponse>(`/modules/${name}`);
    return response.data.data;
  },

  /**
   * Register a new module
   */
  register: async (manifest: ModuleManifest): Promise<Module> => {
    const response = await apiClient.post<ModuleResponse>('/modules', {
      manifest,
    });
    return response.data.data;
  },

  /**
   * Update module status
   */
  updateStatus: async (name: string, status: ModuleStatus): Promise<Module> => {
    const response = await apiClient.put<ModuleResponse>(
      `/modules/${name}/status`,
      { status }
    );
    return response.data.data;
  },

  /**
   * Enable a module
   */
  enable: async (name: string): Promise<Module> => {
    const response = await apiClient.post<ModuleResponse>(
      `/modules/${name}/enable`
    );
    console.log('[modulesApi] Enable response:', response);
    // apiClient returns the unwrapped response, so response.data is the module
    return response.data as any as Module;
  },

  /**
   * Disable a module
   */
  disable: async (name: string): Promise<Module> => {
    const response = await apiClient.post<ModuleResponse>(
      `/modules/${name}/disable`
    );
    console.log('[modulesApi] Disable response:', response);
    // apiClient returns the unwrapped response, so response.data is the module
    return response.data as any as Module;
  },

  /**
   * Update module configuration
   */
  updateConfig: async (name: string, config: Record<string, any>): Promise<Module> => {
    const response = await apiClient.put<ModuleResponse>(
      `/modules/${name}/config`,
      { config }
    );
    return response.data.data;
  },

  /**
   * Remove a module
   */
  remove: async (name: string): Promise<void> => {
    await apiClient.delete(`/modules/${name}`);
  },

  /**
   * Validate a module manifest
   */
  validate: async (manifest: ModuleManifest): Promise<{ valid: boolean; errors?: string[] }> => {
    const response = await apiClient.post<{ success: boolean; data: { valid: boolean; errors?: string[] } }>(
      '/modules/validate',
      { manifest }
    );
    return response.data.data;
  },
};
