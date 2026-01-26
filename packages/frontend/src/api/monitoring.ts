import apiClient from './client';
import { IncidentStatus, IncidentDto } from '../types/monitoring.types';

// Core monitoring endpoints
const BASE_URL = '/monitoring';

export const monitoringApi = {
    /**
     * Get all incidents
     */
    getIncidents: async (status?: IncidentStatus) => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        const url = params.toString() ? `${BASE_URL}/incidents?${params}` : `${BASE_URL}/incidents`;
        const response = await apiClient.get<IncidentDto[]>(url);
        return response; // Returns ApiSuccessResponse<IncidentDto[]>
    },

    /**
     * Get incident by ID
     */
    getIncident: async (id: string) => {
        const response = await apiClient.get<IncidentDto>(`${BASE_URL}/incidents/${id}`);
        return response;
    },

    /**
     * Update incident status
     */
    updateIncident: async (id: string, updates: { status?: IncidentStatus; hasForgeAnalysis?: boolean }) => {
        const response = await apiClient.patch<IncidentDto>(`${BASE_URL}/incidents/${id}`, updates);
        return response;
    },
};



