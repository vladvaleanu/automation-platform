import apiClient, { ApiResponse } from './client';

export interface NavigationItem {
    label: string;
    path: string;
    icon?: string;
    moduleName: string;
    order?: number;
}

export interface NavigationStructure {
    categories: Record<string, NavigationItem[]>;
    uncategorized: NavigationItem[];
}

export const navigationApi = {
    async getStructure(): Promise<ApiResponse<NavigationStructure>> {
        return apiClient.get<NavigationStructure>('/navigation/structure');
    },
};
