/**
 * Folders Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ModuleContext, FolderWithCount, FolderWithChildren } from '../types';
import { DocumentListRow } from '../types/document.types';
import { registerAuthHook, getUserId } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated, sendError, sendNotFound, sendBadRequest } from '../utils/response.utils';

const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  icon: z.string().optional().nullable(),
  order: z.number().optional(),
});

export async function foldersRoutes(app: FastifyInstance, context: ModuleContext) {
  const prisma = context.services.prisma;

  // Register authentication hook
  registerAuthHook(app);

  /**
   * GET /api/v1/docs/folders
   * List folders by category (hierarchical)
   */
  app.get('/', async (request, reply) => {
    try {
      const { categoryId } = request.query as { categoryId?: string };

      if (!categoryId) {
        return reply.status(400).send({
          success: false,
          error: { message: 'categoryId query parameter is required', statusCode: 400 },
        });
      }

      // Get all folders for the category
      const folders = await prisma.$queryRaw<FolderWithCount[]>`
        SELECT
          f.*,
          COUNT(DISTINCT d.id)::int as document_count,
          COUNT(DISTINCT sf.id)::int as subfolder_count
        FROM document_folders f
        LEFT JOIN documents d ON f.id = d.folder_id AND d.deleted_at IS NULL
        LEFT JOIN document_folders sf ON f.id = sf.parent_id
        WHERE f.category_id = ${categoryId}::uuid
        GROUP BY f.id
        ORDER BY f.\"order\" ASC, f.name ASC
      `;

      // Build hierarchical structure
      const buildTree = (parentId: string | null = null): any[] => {
        return folders
          .filter((f: any) => f.parent_id === parentId)
          .map((folder: any) => ({
            ...folder,
            children: buildTree(folder.id),
          }));
      };

      const tree = buildTree(null);

      reply.send({
        success: true,
        data: tree,
      });
    } catch (err) {
      const error = err as Error;
      reply.status(500).send({
        success: false,
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  /**
   * GET /api/v1/docs/folders/:id
   * Get folder details with contents
   */
  app.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const folders = await prisma.$queryRaw<FolderWithChildren[]>`
        SELECT
          f.*,
          json_build_object(
            'id', c.id,
            'name', c.name,
            'icon', c.icon
          ) as category
        FROM document_folders f
        JOIN document_categories c ON f.category_id = c.id
        WHERE f.id = ${id}::uuid
      `;

      if (folders.length === 0) {
        return reply.status(404).send({
          success: false,
          error: { message: 'Folder not found', statusCode: 404 },
        });
      }

      const folder = folders[0];

      // Get subfolders
      const subfolders = await prisma.$queryRaw<FolderWithCount[]>`
        SELECT
          f.*,
          COUNT(DISTINCT d.id)::int as document_count
        FROM document_folders f
        LEFT JOIN documents d ON f.id = d.folder_id AND d.deleted_at IS NULL
        WHERE f.parent_id = ${id}::uuid
        GROUP BY f.id
        ORDER BY f.\"order\" ASC, f.name ASC
      `;

      // Get documents in this folder
      const documents = await prisma.$queryRaw<DocumentListRow[]>`
        SELECT
          d.id, d.title, d.slug, d.excerpt, d.status,
          d.created_at, d.updated_at, d.published_at,
          json_build_object(
            'id', u.id,
            'username', u.username
          ) as author
        FROM documents d
        JOIN users u ON d.author_id = u.id
        WHERE d.folder_id = ${id}::uuid
        ORDER BY d.updated_at DESC
      `;

      reply.send({
        success: true,
        data: {
          ...folder,
          subfolders,
          documents,
        },
      });
    } catch (err) {
      const error = err as Error;
      reply.status(500).send({
        success: false,
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  /**
   * POST /api/v1/docs/folders
   * Create folder (authenticated users)
   */
  app.post('/', async (request, reply) => {
    try {
      const data = createFolderSchema.parse(request.body);
      const userId = getUserId(request);

      // Verify parent folder belongs to same category if specified
      if (data.parentId) {
        const parentFolders = await prisma.$queryRaw<Array<{ category_id: string }>>`
          SELECT category_id FROM document_folders WHERE id = ${data.parentId}::uuid
        `;

        if (parentFolders.length === 0) {
          return reply.status(404).send({
            success: false,
            error: { message: 'Parent folder not found', statusCode: 404 },
          });
        }

        if (parentFolders[0].category_id !== data.categoryId) {
          return reply.status(400).send({
            success: false,
            error: { message: 'Parent folder must be in the same category', statusCode: 400 },
          });
        }
      }

      const result = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO document_folders (name, category_id, parent_id, "order")
        VALUES (
          ${data.name},
          ${data.categoryId}::uuid,
          ${data.parentId || null}::uuid,
          ${data.order || 0}
        )
        RETURNING id
      `;

      const folderId = result[0].id;

      const folders = await prisma.$queryRaw<FolderWithChildren[]>`
        SELECT * FROM document_folders WHERE id = ${folderId}::uuid
      `;

      reply.status(201).send({
        success: true,
        data: folders[0],
      });
    } catch (err) {
      const error = err as Error;
      reply.status(400).send({
        success: false,
        error: { message: error.message, statusCode: 400 },
      });
    }
  });

  /**
   * PUT /api/v1/docs/folders/:id
   * Update folder
   */
  app.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateFolderSchema.parse(request.body);

      // Verify folder exists
      const existing = await prisma.$queryRaw<Array<{ category_id: string }>>`
        SELECT category_id FROM document_folders WHERE id = ${id}::uuid
      `;

      if (existing.length === 0) {
        return reply.status(404).send({
          success: false,
          error: { message: 'Folder not found', statusCode: 404 },
        });
      }

      // Verify new parent folder is in same category and not the folder itself
      if (data.parentId) {
        if (data.parentId === id) {
          return reply.status(400).send({
            success: false,
            error: { message: 'Folder cannot be its own parent', statusCode: 400 },
          });
        }

        const parentFolders = await prisma.$queryRaw<Array<{ category_id: string }>>`
          SELECT category_id FROM document_folders WHERE id = ${data.parentId}::uuid
        `;

        if (parentFolders.length === 0) {
          return reply.status(404).send({
            success: false,
            error: { message: 'Parent folder not found', statusCode: 404 },
          });
        }

        if (parentFolders[0].category_id !== existing[0].category_id) {
          return reply.status(400).send({
            success: false,
            error: { message: 'Parent folder must be in the same category', statusCode: 400 },
          });
        }
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(data.name);
        paramIndex++;
      }

      if (data.parentId !== undefined) {
        updates.push(`parent_id = $${paramIndex}::uuid`);
        values.push(data.parentId);
        paramIndex++;
      }

      if (data.order !== undefined) {
        updates.push(`\"order\" = $${paramIndex}`);
        values.push(data.order);
        paramIndex++;
      }

      if (updates.length === 0) {
        const folders = await prisma.$queryRaw<FolderWithChildren[]>`
          SELECT * FROM document_folders WHERE id = ${id}::uuid
        `;
        return reply.send({
          success: true,
          data: folders[0],
        });
      }

      updates.push(`updated_at = NOW()`);

      await prisma.$executeRawUnsafe(`
        UPDATE document_folders
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}::uuid
      `, ...values, id);

      const folders = await prisma.$queryRaw<FolderWithChildren[]>`
        SELECT * FROM document_folders WHERE id = ${id}::uuid
      `;

      reply.send({
        success: true,
        data: folders[0],
      });
    } catch (err) {
      const error = err as Error;
      reply.status(400).send({
        success: false,
        error: { message: error.message, statusCode: 400 },
      });
    }
  });

  /**
   * DELETE /api/v1/docs/folders/:id
   * Delete folder (must be empty)
   */
  app.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Check if folder has documents
      const docCount = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int as count FROM documents WHERE folder_id = ${id}::uuid
      `;

      if (docCount[0].count > 0) {
        return reply.status(400).send({
          success: false,
          error: { message: 'Cannot delete folder with documents', statusCode: 400 },
        });
      }

      // Check if folder has subfolders
      const folderCount = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int as count FROM document_folders WHERE parent_id = ${id}::uuid
      `;

      if (folderCount[0].count > 0) {
        return reply.status(400).send({
          success: false,
          error: { message: 'Cannot delete folder with subfolders', statusCode: 400 },
        });
      }

      await prisma.$executeRaw`
        DELETE FROM document_folders WHERE id = ${id}::uuid
      `;

      reply.send({
        success: true,
        data: { message: 'Folder deleted successfully' },
      });
    } catch (err) {
      const error = err as Error;
      reply.status(400).send({
        success: false,
        error: { message: error.message, statusCode: 400 },
      });
    }
  });
}
