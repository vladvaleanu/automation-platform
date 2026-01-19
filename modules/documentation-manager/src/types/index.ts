/**
 * Documentation Manager Types
 * Central export point for all module types
 */

// Module context
import { PrismaClient } from '@prisma/client';
import { FastifyBaseLogger } from 'fastify';

export interface ModuleContext {
    services: {
        prisma: PrismaClient;
        logger: FastifyBaseLogger;
    };
}

// Document types
export * from './document.types';

// Category types  
export * from './category.types';

// Folder types
export * from './folder.types';
