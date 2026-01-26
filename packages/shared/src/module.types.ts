/**
 * Shared Module Types
 * 
 * Unified ModuleContext and related types for all NxForge modules.
 * Modules should extend these base interfaces for module-specific needs.
 */

import type { FastifyBaseLogger } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { BrowserService, EventBusService } from './services.types.js';

/**
 * Module metadata provided to module context
 */
export interface ModuleInfo {
    id: string;
    name: string;
    version: string;
    config?: Record<string, unknown>;
}

/**
 * Base services available to all modules
 * Core services that every module can access
 */
export interface BaseModuleServices {
    prisma: PrismaClient;
    logger: FastifyBaseLogger;
}

/**
 * Extended services for modules that need browser automation
 */
export interface BrowserModuleServices extends BaseModuleServices {
    browser: BrowserService;
}

/**
 * Extended services for modules that need event bus access
 */
export interface EventModuleServices extends BaseModuleServices {
    eventBus: EventBusService;
}

/**
 * Full services including all optional services
 */
export interface FullModuleServices extends BaseModuleServices {
    browser?: BrowserService;
    eventBus?: EventBusService;
}

/**
 * Base module context passed to routes and services
 * This is the minimal context that all modules receive
 */
export interface BaseModuleContext<TServices extends BaseModuleServices = BaseModuleServices> {
    module: ModuleInfo;
    services: TServices;
}

/**
 * Default ModuleContext with base services
 * Use this for modules that only need prisma and logger
 */
export type ModuleContext = BaseModuleContext<BaseModuleServices>;

/**
 * ModuleContext for modules that need browser automation
 * Use this for modules like consumption-monitor
 */
export type BrowserModuleContext = BaseModuleContext<BrowserModuleServices>;

/**
 * ModuleContext with all available services
 * Use this for modules that need full access
 */
export type FullModuleContext = BaseModuleContext<FullModuleServices>;

/**
 * Job context provided by core job executor
 * This is the context passed to job handlers
 */
export interface JobContext {
    /** Job-specific configuration from manifest */
    config: Record<string, unknown>;

    /** Module information */
    module: ModuleInfo;

    /** All available services for job execution */
    services: {
        prisma: PrismaClient;
        browser: BrowserService;
        notifications: NotificationService;
        http: HttpService;
        logger: FastifyBaseLogger;
        events: EventBusService;
    };
}

/**
 * Notification service interface
 */
export interface NotificationService {
    email(options: { to: string | string[]; subject: string; body: string; html?: string }): Promise<void>;
    sms(options: { to: string; message: string }): Promise<void>;
    webhook(options: { url: string; payload: Record<string, unknown>; method?: string; headers?: Record<string, string> }): Promise<void>;
}

/**
 * HTTP service interface for modules
 */
export interface HttpService {
    get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    post<T = unknown>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    put<T = unknown>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
}

export interface HttpRequestOptions {
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
}

export interface HttpResponse<T = unknown> {
    data: T;
    status: number;
    headers: Record<string, string>;
}
