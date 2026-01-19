/**
 * Embedding Service
 * Generates vector embeddings using Ollama nomic-embed-text model
 */

import type { Logger } from 'pino';

const DEFAULT_MODEL = 'nomic-embed-text';
const EMBEDDING_DIMENSIONS = 768;

export interface EmbeddingConfig {
    baseUrl: string;
    model?: string;
}

export class EmbeddingService {
    private baseUrl: string;
    private model: string;
    private logger: Logger;

    constructor(config: EmbeddingConfig, logger: Logger) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.model = config.model || DEFAULT_MODEL;
        this.logger = logger;
    }

    /**
     * Generate embedding for a single text
     */
    async embed(text: string): Promise<number[]> {
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: text,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Embedding failed: ${response.status} - ${error}`);
        }

        const data = await response.json();

        if (!data.embedding || !Array.isArray(data.embedding)) {
            throw new Error('Invalid embedding response');
        }

        return data.embedding;
    }

    /**
     * Generate embeddings for multiple texts (batch)
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];

        for (const text of texts) {
            try {
                const embedding = await this.embed(text);
                embeddings.push(embedding);
            } catch (error) {
                this.logger.error({ error, text: text.substring(0, 100) }, 'Failed to embed text');
                // Push zero vector on failure to maintain array alignment
                embeddings.push(new Array(EMBEDDING_DIMENSIONS).fill(0));
            }
        }

        return embeddings;
    }

    /**
     * Check if embedding model is available
     */
    async healthCheck(): Promise<{ available: boolean; model: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                return { available: false, model: this.model };
            }

            const data = await response.json();
            const models = (data.models || []).map((m: any) => m.name);
            const available = models.some((m: string) => m.includes('nomic-embed'));

            return { available, model: this.model };
        } catch (error) {
            this.logger.warn({ error }, 'Embedding health check failed');
            return { available: false, model: this.model };
        }
    }

    /**
     * Get embedding dimensions for the current model
     */
    getDimensions(): number {
        return EMBEDDING_DIMENSIONS;
    }
}
