/**
 * Consumption API client for monitoring power usage
 * NOTE: Updated to use module routes (/m/consumption-monitor/*)
 */

import { apiClient } from './client';

export interface ConsumptionReading {
  id: string;
  endpointId: string;
  timestamp: string;
  totalKwh: number;
  voltage?: number;
  current?: number;
  power?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface MonthlyConsumption {
  endpointId: string;
  endpointName: string;
  clientName?: string;
  location?: string;
  currentKwh: number;
  previousKwh: number;
  consumedKwh: number;
  lastReadingAt?: string;
  readingsCount: number;
}

export interface LiveDashboardData {
  endpoints: Array<{
    id: string;
    name: string;
    clientName?: string;
    location?: string;
    enabled: boolean;
    lastReading?: {
      timestamp: string;
      totalKwh: number;
      voltage?: number;
      current?: number;
      power?: number;
    };
    status: 'online' | 'offline' | 'error';
  }>;
  summary: {
    totalEndpoints: number;
    activeEndpoints: number;
    totalKwh: number;
    monthlyConsumption: number;
  };
}

export interface ReadingsQueryParams {
  endpointId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export const consumptionApi = {
  /**
   * Get consumption readings with optional filters
   */
  getReadings: async (params?: ReadingsQueryParams): Promise<ConsumptionReading[]> => {
    const searchParams = new URLSearchParams();
    if (params?.endpointId) searchParams.append('endpointId', params.endpointId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    const url = `/m/consumption-monitor/readings${query ? `?${query}` : ''}`;

    const response = await apiClient.get<ConsumptionReading[]>(url);
    return response.data;
  },

  /**
   * Get monthly consumption for a specific endpoint
   */
  getMonthlyConsumption: async (endpointId: string): Promise<MonthlyConsumption> => {
    const response = await apiClient.get<MonthlyConsumption>(`/m/consumption-monitor/monthly/${endpointId}`);
    return response.data;
  },

  /**
   * Get monthly consumption summary for all endpoints
   */
  getMonthlySummary: async (): Promise<MonthlyConsumption[]> => {
    const response = await apiClient.get<MonthlyConsumption[]>('/m/consumption-monitor/monthly-summary');
    return response.data;
  },

  /**
   * Get live dashboard data
   */
  getLiveDashboard: async (): Promise<LiveDashboardData> => {
    const response = await apiClient.get<LiveDashboardData>('/m/consumption-monitor/live');
    return response.data;
  },
};
