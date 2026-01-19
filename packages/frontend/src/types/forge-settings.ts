
export interface ForgeSettings {
    provider: 'ollama' | 'localai' | 'openai-compatible';
    baseUrl: string;
    model: string;
    contextWindow: number;
    embeddingProvider: 'same' | 'nomic-embed-text' | 'mxbai-embed-large';
    embeddingModel: string;
    personaName: string;
    strictness: number;
    infrastructurePriority: {
        power: boolean;
        cooling: boolean;
        access: boolean;
    };
    batchWindowSeconds: number;
    minAlertsForIncident: number;
}

export const DEFAULT_FORGE_SETTINGS: ForgeSettings = {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3.1',
    contextWindow: 8192,
    embeddingProvider: 'same',
    embeddingModel: 'nomic-embed-text',
    personaName: 'Forge',
    strictness: 5,
    infrastructurePriority: {
        power: true,
        cooling: true,
        access: true,
    },
    batchWindowSeconds: 30,
    minAlertsForIncident: 5,
};
