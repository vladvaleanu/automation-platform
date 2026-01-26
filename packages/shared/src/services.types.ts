/**
 * Shared Service Types
 * 
 * Interfaces for core services that modules can access.
 * These match the implementations in packages/backend/src/services.
 */

/**
 * Browser service for Playwright automation
 */
export interface BrowserService {
    createSession(options?: BrowserOptions): Promise<BrowserSession>;
    closeSession(sessionId: string): Promise<void>;
    closeAllSessions(): Promise<void>;
    getActiveSessionCount(): number;
}

export interface BrowserOptions {
    headless?: boolean;
    timeout?: number;
    viewport?: { width: number; height: number };
    browserType?: 'chromium' | 'firefox' | 'webkit';
}

export interface BrowserSession {
    newPage(): Promise<unknown>; // Returns Playwright Page
    close(): Promise<void>;
}

/**
 * Event bus service for pub/sub messaging
 */
export interface EventBusService {
    emit(name: string, payload: Record<string, unknown>): Promise<void>;
    on(name: string, handler: EventHandler): void;
    off(name: string, handler: EventHandler): void;
    onPattern(pattern: string, handler: EventHandler): void;
}

export type EventHandler = (context: EventContext) => void | Promise<void>;

export interface EventContext {
    event: {
        id: string;
        name: string;
        source: string;
        payload: Record<string, unknown>;
        createdAt: Date;
    };
}
