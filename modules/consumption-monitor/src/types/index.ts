import type { PrismaClient } from '@prisma/client';

// Re-export shared types for convenience
export type {
  ModuleContext,
  BrowserModuleContext,
  JobContext,
  BrowserService,
  BrowserOptions,
  BrowserSession,
  EventBusService as EventBus,
} from '@nxforge/shared';

// Augment Fastify with decorated services from core
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    browserService: BrowserService;
    eventBus?: EventBusService;
  }
}

// Import the types we're using in the augmentation
import type { BrowserService, EventBusService } from '@nxforge/shared';
