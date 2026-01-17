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

    // apiClient.get<Module[]> returns ApiSuccessResponse<Module[]> = { success, data: Module[], meta }
    // So response.data is the Module[] array directly
    const response = await apiClient.get<Module[]>(url);
    console.log("[modulesApi] Raw response:", response);
    console.log("[modulesApi] response.data:", response.data);

    return response.data || [];
  },

  /**
   * Get module details by name
   */
  get: async (name: string): Promise<Module> => {
    const response = await apiClient.get<Module>(`/modules/${name}`);
    return response.data;
  },

  /**
   * Register a new module
   */
  register: async (manifest: ModuleManifest): Promise<Module> => {
    const response = await apiClient.post<Module>('/modules', {
      manifest,
    });
    return response.data;
  },

  /**
   * Update module status
   */
  updateStatus: async (name: string, status: ModuleStatus): Promise<Module> => {
    const response = await apiClient.put<Module>(
      `/modules/${name}/status`,
      { status }
    );
    return response.data;
  },

  /**
   * Enable a module
   */
  enable: async (name: string): Promise<Module> => {
    const response = await apiClient.post<Module>(
      `/modules/${name}/enable`
    );
    console.log('[modulesApi] Enable response:', response);
    return response.data;
  },

  /**
   * Disable a module
   */
  disable: async (name: string): Promise<Module> => {
    const response = await apiClient.post<Module>(
      `/modules/${name}/disable`
    );
    console.log('[modulesApi] Disable response:', response);
    return response.data;
  },

  /**
   * Update module configuration
   */
  updateConfig: async (name: string, config: Record<string, any>): Promise<Module> => {
    const response = await apiClient.put<Module>(
      `/modules/${name}/config`,
      { config }
    );
    return response.data;
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
    const response = await apiClient.post<{ valid: boolean; errors?: string[] }>(
      '/modules/validate',
      { manifest }
    );
    return response.data;
  },
};
