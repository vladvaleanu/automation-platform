/**
 * AI Copilot Module - Type Definitions
 * Following consumption-monitor pattern
 */

// Re-export shared types for convenience
export type { ModuleContext } from '@nxforge/shared';


/**
 * AI Configuration stored in database
 * Matches frontend ForgeSettings but snake_case for DB
 */
export interface AiConfig {
    id: string;
    provider: 'ollama' | 'localai' | 'openai-compatible';
    baseUrl: string;
    model: string;
    strictness: number;
    contextWindow: number;
    embeddingModel: string | null;
    batchWindowSeconds: number;
    personaName: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Chat message role
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Chat message for Ollama API
 */
export interface ChatMessage {
    role: ChatRole;
    content: string;
}

/**
 * Chat request body
 */
export interface ChatRequest {
    message: string;
    context?: string;
    stream?: boolean;
}

/**
 * Chat response (non-streaming)
 */
export interface ChatResponse {
    message: string;
    model: string;
    done: boolean;
    totalDuration?: number;
}

/**
 * Ollama model info
 */
export interface OllamaModel {
    name: string;
    modifiedAt: string;
    size: number;
    digest: string;
    details: {
        family: string;
        parameterSize: string;
        quantizationLevel: string;
    };
}

/**
 * Health check response
 */
export interface HealthResponse {
    module: string;
    status: 'ok' | 'degraded' | 'error';
    ollama: boolean;
    model: string | null;
    availableModels: string[];
}
