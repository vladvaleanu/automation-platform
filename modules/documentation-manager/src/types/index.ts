/**
 * Documentation Manager Types
 * Central export point for all module types
 */

// Module context
import { PrismaClient } from '@prisma/client';

// Re-export shared types for convenience
export type { ModuleContext } from '@nxforge/shared';

// Augment Fastify with decorated services from core
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}

// Document types
export * from './document.types';

// Category types  
export * from './category.types';

// Folder types
export * from './folder.types';
