/**
 * AI Copilot Module - Forge
 * Local infrastructure intelligence operator
 * 
 * Phase 2: Backend with Ollama integration
 */

import { FastifyPluginAsync } from 'fastify';
import { registerRoutes } from './routes/index.js';
import type { ModuleContext } from './types/index.js';

/**
 * Forge AI Copilot module plugin
 * Phase 2: Full backend with Ollama integration
 */
const plugin: FastifyPluginAsync = async (app) => {
    app.log.info('[ai-copilot] Forge module initializing...');

    // Get services from app decoration (provided by core)
    const prisma = (app as any).prisma;

    if (!prisma) {
        app.log.error('Prisma instance not found on app decoration');
        throw new Error('Prisma instance not found on app decoration');
    }

    // Create module context
    const context: ModuleContext = {
        module: {
            id: 'ai-copilot',
            name: 'ai-copilot',
            version: '0.2.0',
        },
        services: {
            prisma,
            logger: app.log as any,
        },
    };

    // Register routes (prefixed with /api/v1/m/ai-copilot/ by core)
    await registerRoutes(app, context);

    app.log.info('[ai-copilot] Forge module initialized successfully');
};

export default plugin;
