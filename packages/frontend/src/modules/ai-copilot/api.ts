/**
 * AI Copilot API Client
 * Frontend API for Forge AI assistant
 */

import { apiClient } from '@/api/client';
import type { ForgeSettings } from './types';

const BASE_URL = '/m/ai-copilot'; // apiClient already has /api/v1 prefix

export interface HealthResponse {
    module: string;
    status: 'ok' | 'degraded' | 'error';
    ollama: boolean;
    model: string | null;
    availableModels: string[];
}

export interface ModelInfo {
    name: string;
    size: number;
    parameterSize: string;
    family: string;
}

export interface ModelsResponse {
    success: boolean;
    models: ModelInfo[];
    error?: string;
}

export interface SettingsResponse {
    success: boolean;
    settings: Partial<ForgeSettings>;
    error?: string;
}

export interface ChatResponse {
    success: boolean;
    response?: string;
    model?: string;
    done?: boolean;
    error?: string;
}

export interface KnowledgeDocument {
    id: string;
    title: string;
    excerpt: string | null;
    status: string;
    categoryName: string;
    aiAccessible: boolean;
    hasEmbedding: boolean;
    updatedAt: string;
}

export interface KnowledgeStats {
    totalAiAccessible: number;
    totalEmbedded: number;
    pendingEmbedding: number;
}

export interface KnowledgeSearchResult {
    id: string;
    title: string;
    excerpt: string | null;
    categoryName: string;
    similarity: number;
}

/**
 * AI Copilot API client
 */
export const forgeApi = {
    /**
     * Get health status including Ollama connection
     */
    getHealth: async (): Promise<HealthResponse> => {
        // apiClient.get returns ApiSuccessResponse which has .data containing our response
        // But backend returns HealthResponse directly, not wrapped
        const response = await apiClient.get<HealthResponse>(`${BASE_URL}/health`);
        // response is ApiSuccessResponse<HealthResponse> with .data being HealthResponse
        // However our module endpoints return data directly, so response IS the data
        return response as unknown as HealthResponse;
    },

    /**
     * List available Ollama models
     */
    getModels: async (): Promise<ModelsResponse> => {
        const response = await apiClient.get<ModelsResponse>(`${BASE_URL}/models`);
        return response as unknown as ModelsResponse;
    },

    /**
     * Get current settings
     */
    getSettings: async (): Promise<SettingsResponse> => {
        const response = await apiClient.get<SettingsResponse>(`${BASE_URL}/settings`);
        return response as unknown as SettingsResponse;
    },

    /**
     * Update settings
     */
    updateSettings: async (settings: Partial<ForgeSettings>): Promise<SettingsResponse> => {
        const response = await apiClient.put<SettingsResponse>(`${BASE_URL}/settings`, settings);
        return response as unknown as SettingsResponse;
    },

    /**
     * Send a chat message (non-streaming)
     */
    chat: async (message: string, context?: string): Promise<ChatResponse> => {
        const response = await apiClient.post<ChatResponse>(`${BASE_URL}/chat`, {
            message,
            context,
            stream: false,
        });
        return response as unknown as ChatResponse;
    },

    /**
     * Send a chat message with streaming response
     * Returns an async generator that yields content chunks
     */
    chatStream: async function* (
        message: string,
        context?: string
    ): AsyncGenerator<string, void, unknown> {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Auth token will be handled by the fetch interceptor if configured
            },
            body: JSON.stringify({ message, context, stream: true }),
        });

        if (!response.ok) {
            throw new Error(`Chat failed: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.content) {
                            yield data.content;
                        }
                        if (data.done) {
                            return;
                        }
                        if (data.error) {
                            throw new Error(data.error);
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    },

    /**
     * Get all documents for knowledge management
     */
    getKnowledgeDocuments: async (): Promise<{ success: boolean; documents: KnowledgeDocument[]; error?: string }> => {
        const response = await apiClient.get<{ success: boolean; documents: KnowledgeDocument[] }>(`${BASE_URL}/knowledge`);
        return response as unknown as { success: boolean; documents: KnowledgeDocument[] };
    },

    /**
     * Get knowledge base statistics
     */
    getKnowledgeStats: async (): Promise<{ success: boolean; stats: KnowledgeStats; error?: string }> => {
        const response = await apiClient.get<{ success: boolean; stats: KnowledgeStats }>(`${BASE_URL}/knowledge/stats`);
        return response as unknown as { success: boolean; stats: KnowledgeStats };
    },

    /**
     * Search knowledge base
     */
    searchKnowledge: async (query: string, limit?: number): Promise<{ success: boolean; results: KnowledgeSearchResult[]; error?: string }> => {
        const response = await apiClient.post<{ success: boolean; results: KnowledgeSearchResult[] }>(`${BASE_URL}/knowledge/search`, { query, limit });
        return response as unknown as { success: boolean; results: KnowledgeSearchResult[] };
    },
};
