/**
 * Ollama Service
 * Handles communication with Ollama API
 * 
 * Features:
 * - Health check with connection status
 * - List available models
 * - Chat with streaming support
 * - Retry logic with exponential backoff
 */

import type { Logger } from 'pino';
import type { ChatMessage, OllamaModel, ChatResponse } from '../types/index.js';

export interface OllamaConfig {
    baseUrl: string;
    model: string;
    contextWindow?: number;
}

export interface OllamaStreamChunk {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
}

export class OllamaService {
    private baseUrl: string;
    private model: string;
    private logger: Logger;
    private maxRetries: number = 3;
    private retryDelayMs: number = 1000;

    constructor(config: OllamaConfig, logger: Logger) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.model = config.model;
        this.logger = logger;
    }

    /**
     * Update configuration (e.g., when settings change)
     */
    updateConfig(config: Partial<OllamaConfig>): void {
        if (config.baseUrl) {
            this.baseUrl = config.baseUrl.replace(/\/$/, '');
        }
        if (config.model) {
            this.model = config.model;
        }
    }

    /**
     * Check if Ollama is reachable and responding
     */
    async healthCheck(): Promise<{ connected: boolean; models: OllamaModel[] }> {
        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}/api/tags`, {
                method: 'GET',
            });

            if (!response.ok) {
                return { connected: false, models: [] };
            }

            const data = await response.json();
            return {
                connected: true,
                models: (data.models || []).map(this.mapOllamaModel),
            };
        } catch (error) {
            this.logger.warn({ error }, 'Ollama health check failed');
            return { connected: false, models: [] };
        }
    }

    /**
     * List available models
     */
    async listModels(): Promise<OllamaModel[]> {
        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}/api/tags`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Failed to list models: ${response.statusText}`);
            }

            const data = await response.json();
            return (data.models || []).map(this.mapOllamaModel);
        } catch (error) {
            this.logger.error({ error }, 'Failed to list Ollama models');
            throw error;
        }
    }

    /**
     * Send a chat message and get a non-streaming response
     */
    async chat(
        messages: ChatMessage[],
        systemPrompt?: string
    ): Promise<ChatResponse> {
        const payload = {
            model: this.model,
            messages: systemPrompt
                ? [{ role: 'system', content: systemPrompt }, ...messages]
                : messages,
            stream: false,
        };

        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama chat failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return {
                message: data.message?.content || '',
                model: data.model,
                done: data.done,
                totalDuration: data.total_duration,
            };
        } catch (error) {
            this.logger.error({ error, model: this.model }, 'Chat request failed');
            throw error;
        }
    }

    /**
     * Stream a chat response
     * Returns an async generator that yields content chunks
     */
    async *chatStream(
        messages: ChatMessage[],
        systemPrompt?: string
    ): AsyncGenerator<string, void, unknown> {
        const payload = {
            model: this.model,
            messages: systemPrompt
                ? [{ role: 'system', content: systemPrompt }, ...messages]
                : messages,
            stream: true,
        };

        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama stream failed: ${response.status} - ${errorText}`);
        }

        if (!response.body) {
            throw new Error('No response body for streaming');
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
                    if (!line.trim()) continue;
                    try {
                        const chunk: OllamaStreamChunk = JSON.parse(line);
                        if (chunk.message?.content) {
                            yield chunk.message.content;
                        }
                        if (chunk.done) {
                            return;
                        }
                    } catch {
                        // Skip malformed JSON lines
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Fetch with exponential backoff retry
     */
    private async fetchWithRetry(
        url: string,
        options: RequestInit,
        attempt: number = 1
    ): Promise<Response> {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(120000), // 120 second timeout
            });
            return response;
        } catch (error) {
            if (attempt >= this.maxRetries) {
                throw error;
            }

            const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
            this.logger.warn(
                { attempt, maxRetries: this.maxRetries, delay },
                'Retrying Ollama request'
            );
            await this.sleep(delay);
            return this.fetchWithRetry(url, options, attempt + 1);
        }
    }

    /**
     * Map Ollama API response to our model type
     */
    private mapOllamaModel = (model: any): OllamaModel => ({
        name: model.name,
        modifiedAt: model.modified_at,
        size: model.size,
        digest: model.digest,
        details: {
            family: model.details?.family || 'unknown',
            parameterSize: model.details?.parameter_size || 'unknown',
            quantizationLevel: model.details?.quantization_level || 'unknown',
        },
    });

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
