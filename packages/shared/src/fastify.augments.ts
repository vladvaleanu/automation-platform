/**
 * Fastify Type Augmentations
 * 
 * Augments Fastify's FastifyInstance with decorated services.
 * Import this file in your module to get proper types for app.prisma, etc.
 */

import type { PrismaClient } from '@prisma/client';
import type { BrowserService, EventBusService } from './services.types.js';

declare module 'fastify' {
    interface FastifyInstance {
        /** Prisma database client */
        prisma: PrismaClient;

        /** Playwright browser automation service */
        browserService: BrowserService;

        /** Event bus for pub/sub messaging (optional) */
        eventBus?: EventBusService;
    }
}
