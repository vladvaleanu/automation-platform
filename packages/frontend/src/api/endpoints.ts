/**
 * Endpoints API client for consumption monitoring
 */

import { apiClient } from './client';

export interface Endpoint {
  id: string;
  name: string;
  ipAddress: string;
  type: string;
  vendor?: string;
  location?: string;
  clientName?: string;
  authType: 'none' | 'basic' | 'form';
  authConfig?: AuthConfig;
  scrapingConfig: ScrapingConfig;
  enabled: boolean;
  pollInterval: number;
  createdAt: string;
  updatedAt: string;
  lastReadAt?: string;
}

export interface AuthConfig {
  username?: string;
  password?: string;
  loginUrl?: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
}

export interface ScrapingStep {
  action: 'navigate' | 'click' | 'wait' | 'type' | 'select';
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
}

export interface ScrapingConfig {
  steps: ScrapingStep[];
  valueSelector: string;
  valuePattern?: string;
  timeout?: number;
}

export interface CreateEndpointData {
  name: string;
  ipAddress: string;
  type: string;
  vendor?: string;
  location?: string;
  clientName?: string;
  authType: 'none' | 'basic' | 'form';
  authConfig?: AuthConfig;
  scrapingConfig: ScrapingConfig;
  enabled?: boolean;
  pollInterval?: number;
}

export interface UpdateEndpointData extends Partial<CreateEndpointData> {}

export interface TestEndpointResponse {
  success: boolean;
  value?: number;
  unit?: string;
  screenshot?: string;
  error?: string;
}

export const endpointsApi = {
  /**
   * List all endpoints
   */
  list: async (): Promise<Endpoint[]> => {
    const response = await apiClient.get<Endpoint[]>('/m/consumption-monitor/endpoints');
    return response.data;
  },

  /**
   * Get endpoint by ID
   */
  get: async (id: string): Promise<Endpoint> => {
    const response = await apiClient.get<Endpoint>(`/m/consumption-monitor/endpoints/${id}`);
    return response.data;
  },

  /**
   * Create a new endpoint
   */
  create: async (data: CreateEndpointData): Promise<Endpoint> => {
    const response = await apiClient.post<Endpoint>('/m/consumption-monitor/endpoints', data);
    return response.data;
  },

  /**
   * Update an endpoint
   */
  update: async (id: string, data: UpdateEndpointData): Promise<Endpoint> => {
    const response = await apiClient.put<Endpoint>(`/m/consumption-monitor/endpoints/${id}`, data);
    return response.data;
  },

  /**
   * Delete an endpoint
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/m/consumption-monitor/endpoints/${id}`);
  },

  /**
   * Test scraping configuration (dry run)
   */
  test: async (id: string): Promise<TestEndpointResponse> => {
    const response = await apiClient.post<TestEndpointResponse>(`/m/consumption-monitor/endpoints/${id}/test`);
    return response.data;
  },
};
