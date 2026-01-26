import type { FastifyPluginAsync } from 'fastify';
import { registerRoutes } from './routes/index.js';
import type { BrowserModuleContext } from '@nxforge/shared';

const plugin: FastifyPluginAsync = async (app) => {
  app.log.info('[ConsumptionMonitor] Module initialized');

  // Get services from app decoration (provided by core)
  const { prisma, browserService } = app;

  if (!prisma) {
    app.log.error('Prisma instance not found on app decoration');
    throw new Error('Prisma instance not found on app decoration');
  }

  if (!browserService) {
    app.log.error('BrowserService not found on app decoration');
    throw new Error('BrowserService not found on app decoration');
  }

  const context: BrowserModuleContext = {
    module: {
      id: 'consumption-monitor',
      name: 'consumption-monitor',
      version: '1.0.0',
    },
    services: {
      prisma,
      logger: app.log,
      browser: browserService,
    }
  };

  // Register routes
  // Routes are defined in routes/index.ts
  await registerRoutes(app, context);
};

export default plugin;
