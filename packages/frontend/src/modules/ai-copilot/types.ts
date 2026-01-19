/**
 * Forge AI Copilot - Type Definitions
 */

// Severity levels for incidents
export type IncidentSeverity = 'critical' | 'warning' | 'info';

// Status of an incident
export type IncidentStatus = 'active' | 'investigating' | 'resolved';

// Individual raw alert from monitoring
export interface RawAlert {
    id: string;
    source: string;
    message: string;
    timestamp: Date;
    labels: Record<string, string>;
}

// Grouped incident (multiple alerts)
export interface Incident {
    id: string;
    title: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    impact: string;
    duration: string;
    alertCount: number;
    hasForgeAnalysis: boolean;
    createdAt: Date;
    alerts?: RawAlert[];
}

// Chat message in the Forge workspace
export type ChatMessageRole = 'user' | 'forge' | 'system';

export interface ChatMessage {
    id: string;
    role: ChatMessageRole;
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

// Forge connection status
export interface ForgeStatus {
    connected: boolean;
    model: string | null;
    contextFocus: string | null;
}

// Settings persisted to localStorage (Phase 1) / DB (Phase 2+)
export interface ForgeSettings {
    // AI Brain
    provider: 'ollama' | 'localai' | 'openai-compatible';
    baseUrl: string;
    model: string;
    contextWindow: number;

    // Embeddings
    embeddingProvider: 'same' | 'nomic-embed-text' | 'mxbai-embed-large';
    embeddingModel: string;

    // Personality
    personaName: string;
    strictness: number; // 1-10
    infrastructurePriority: {
        power: boolean;
        cooling: boolean;
        access: boolean;
    };

    // Batching
    batchWindowSeconds: number;
    minAlertsForIncident: number;
}

// Default settings
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
        access: false,
    },
    batchWindowSeconds: 30,
    minAlertsForIncident: 5,
};
