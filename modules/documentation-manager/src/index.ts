/**
 * Documentation Manager Module - Backend Entry Point
 */

import type { FastifyPluginAsync } from 'fastify';
import { documentsRoutes } from './routes/documents.routes';
import { categoriesRoutes } from './routes/categories.routes';
import { foldersRoutes } from './routes/folders.routes';
import { attachmentsRoutes } from './routes/attachments.routes';

import type { ModuleContext } from '@nxforge/shared';

const plugin: FastifyPluginAsync = async (app) => {
  app.log.info('[Documentation Manager] Module initialized');

  // Access prisma from decorated app (provided by core)
  const { prisma } = app;

  if (!prisma) {
    app.log.error('Prisma instance not found on app decoration');
    throw new Error('Prisma instance not found on app decoration');
  }

  // Construct module context for the services
  const context: ModuleContext = {
    module: {
      id: 'documentation-manager',
      name: 'documentation-manager',
      version: '1.0.0',
    },
    services: {
      prisma,
      logger: app.log,
    },
  };

  app.log.info('[Documentation Manager] Registering routes...');

  await app.register(documentsRoutes, { ...context, prefix: '/documents' });
  await app.register(categoriesRoutes, { ...context, prefix: '/categories' });
  await app.register(foldersRoutes, { ...context, prefix: '/folders' });
  await app.register(attachmentsRoutes, { ...context, prefix: '/attachments' });

  app.log.info('[Documentation Manager] All routes registered');
};


/**
 * Job handler: Cleanup trash
 * Permanently deletes documents that have been in trash for more than 30 days
 */
export async function cleanupTrash(context: ModuleContext) {
  const { prisma, logger } = context.services;
  logger.info('[Documentation Manager] Running cleanup-trash job');

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM documents WHERE deleted_at IS NOT NULL AND deleted_at < $1`,
      thirtyDaysAgo
    );

    logger.info(`[Documentation Manager] Cleanup complete. Permanently deleted ${result} documents.`);
    return { success: true, deletedCount: result };
  } catch (error) {
    logger.error({ error }, '[Documentation Manager] Cleanup failed');
    throw error;
  }
}

export default plugin;
