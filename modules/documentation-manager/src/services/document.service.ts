/**
 * Document Service
 * Core CRUD operations for documents
 */

// import { prisma } from '../../../../packages/backend/src/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { VersionService } from './version.service';
import { markdownService } from './markdown.service';
import { DocumentWithRelations, DocumentListRow, DocumentStatus } from '../types/document.types';

interface CreateDocumentData {
  title: string;
  content: string;
  categoryId: string;
  folderId?: string | null;
  authorId: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
}

interface UpdateDocumentData {
  title?: string;
  content?: string;
  categoryId?: string;
  folderId?: string | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
  changeNote?: string;
}

export class DocumentService {
  private prisma: PrismaClient;
  private versionService: VersionService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.versionService = new VersionService(prisma);
  }

  /**
   * Create a new document
   */
  async createDocument(data: CreateDocumentData) {
    // Check if document with same title already exists (case-insensitive)
    const existing = await this.prisma.document.findFirst({
      where: {
        title: { equals: data.title, mode: 'insensitive' },
        deletedAt: null,
      },
      select: { id: true, title: true },
    });

    if (existing) {
      throw new Error(`A document with the title "${data.title}" already exists`);
    }

    const slug = this.generateSlug(data.title);
    const contentHtml = markdownService.renderToHtml(data.content);

    // Create document using Prisma
    const document = await this.prisma.document.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        contentHtml,
        excerpt: this.generateExcerpt(data.content),
        categoryId: data.categoryId,
        folderId: data.folderId || null,
        authorId: data.authorId,
        status: data.status || 'DRAFT',
      },
      select: { id: true },
    });

    const documentId = document.id;

    // Create initial version
    await this.versionService.createVersion(documentId, data.title, data.content, data.authorId, 'Initial version');

    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      await this.addTags(documentId, data.tags);
    }

    return this.getDocument(documentId);
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string) {
    // Explicitly list columns to avoid selecting the embedding vector column
    // which Prisma cannot serialize
    const documents = await this.prisma.$queryRaw<DocumentWithRelations[]>`
      SELECT
        d.id,
        d.title,
        d.slug,
        d.content,
        d.content_html,
        d.excerpt,
        d.category_id,
        d.folder_id,
        d.author_id,
        d.status,
        d.ai_accessible,
        d.created_at,
        d.updated_at,
        d.published_at,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'icon', c.icon
        ) as category,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'email', u.email
        ) as author,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as tags
      FROM documents d
      JOIN document_categories c ON d.category_id = c.id
      JOIN users u ON d.author_id = u.id
      LEFT JOIN document_tags dt ON d.id = dt.document_id
      LEFT JOIN tags t ON dt.tag_id = t.id
      WHERE d.id = ${documentId}
      GROUP BY d.id, c.id, c.name, c.icon, u.id, u.username, u.email
    `;

    return documents[0] || null;
  }

  /**
   * Get document by slug
   */
  async getDocumentBySlug(slug: string) {
    const document = await this.prisma.document.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!document) {
      return null;
    }

    return this.getDocument(document.id);
  }

  /**
   * Update document
   */
  async updateDocument(documentId: string, data: UpdateDocumentData, userId: string) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title) {
      // Check if another document with same title already exists (case-insensitive)
      const existing = await this.prisma.document.findFirst({
        where: {
          title: { equals: data.title, mode: 'insensitive' },
          id: { not: documentId },
          deletedAt: null,
        },
        select: { id: true, title: true },
      });

      if (existing) {
        throw new Error(`A document with the title "${data.title}" already exists`);
      }

      updates.push(`title = $${updates.length + 1}`);
      values.push(data.title);
      updates.push(`slug = $${updates.length + 1}`);
      values.push(this.generateSlug(data.title));
    }

    if (data.content) {
      updates.push(`content = $${updates.length + 1}`);
      values.push(data.content);
      updates.push(`content_html = $${updates.length + 1}`);
      values.push(markdownService.renderToHtml(data.content));
      updates.push(`excerpt = $${updates.length + 1}`);
      values.push(this.generateExcerpt(data.content));
    }

    if (data.categoryId) {
      updates.push(`category_id = $${updates.length + 1}`);
      values.push(data.categoryId);
    }

    if (data.folderId !== undefined) {
      updates.push(`folder_id = $${updates.length + 1}`);
      values.push(data.folderId);
    }

    if (data.status) {
      updates.push(`status = $${updates.length + 1}::"DocumentStatus"`);
      values.push(data.status);

      if (data.status === 'PUBLISHED') {
        updates.push(`published_at = NOW()`);
      }
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      return this.getDocument(documentId);
    }

    // Perform update
    await this.prisma.$executeRawUnsafe(`
      UPDATE documents
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1}
    `, ...values, documentId);

    // Create new version if content changed
    if (data.content) {
      const doc = await this.getDocument(documentId);
      await this.versionService.createVersion(
        documentId,
        data.title || doc.title,
        data.content,
        userId,
        data.changeNote || 'Updated document'
      );
    }

    // Update tags if provided
    if (data.tags) {
      await this.updateTags(documentId, data.tags);
    }

    return this.getDocument(documentId);
  }

  /**
   * Delete document
   */
  /**
   * Soft delete document (move to trash)
   */
  async deleteDocument(documentId: string) {
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
        status: 'DRAFT',
        ai_accessible: false,
        // Note: embedding cannot be set via Prisma (Unsupported type)
        // A raw SQL query may still be needed if embedding must be cleared
      },
    });
  }

  /**
   * Restore document from trash
   */
  async restoreDocument(documentId: string) {
    await this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: null },
    });
    return this.getDocument(documentId);
  }

  /**
   * Permanently delete document
   */
  async permanentDeleteDocument(documentId: string) {
    await this.prisma.document.delete({
      where: { id: documentId },
    });
  }

  /**
   * List documents with filters
   */
  async listDocuments(filters: {
    categoryId?: string;
    folderId?: string;
    status?: string;
    search?: string;
    tags?: string[];
    authorId?: string;
    trashed?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Filter by deleted status
    if (filters.trashed) {
      whereConditions.push(`d.deleted_at IS NOT NULL`);
    } else {
      whereConditions.push(`d.deleted_at IS NULL`);
    }

    if (filters.categoryId) {
      whereConditions.push(`d.category_id = $${paramIndex}`);
      queryParams.push(filters.categoryId);
      paramIndex++;
    }

    if (filters.folderId) {
      whereConditions.push(`d.folder_id = $${paramIndex}`);
      queryParams.push(filters.folderId);
      paramIndex++;
    }

    if (filters.status) {
      whereConditions.push(`d.status = $${paramIndex}::"DocumentStatus"`);
      queryParams.push(filters.status);
      paramIndex++;
    }

    if (filters.authorId) {
      whereConditions.push(`d.author_id = $${paramIndex}`);
      queryParams.push(filters.authorId);
      paramIndex++;
    }

    if (filters.search) {
      whereConditions.push(`to_tsvector('english', d.title || ' ' || d.content) @@ plainto_tsquery('english', $${paramIndex})`);
      queryParams.push(filters.search);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const documents = await this.prisma.$queryRawUnsafe<Array<any>>(`
      SELECT
        d.id, d.title, d.slug, d.excerpt, d.status, d.folder_id, d.created_at, d.updated_at, d.published_at,
        json_build_object('id', c.id, 'name', c.name, 'icon', c.icon) as category,
        json_build_object('id', u.id, 'username', u.username) as author,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as tags
      FROM documents d
      JOIN document_categories c ON d.category_id = c.id
      JOIN users u ON d.author_id = u.id
      LEFT JOIN document_tags dt ON d.id = dt.document_id
      LEFT JOIN tags t ON dt.tag_id = t.id
      ${whereClause}
      GROUP BY d.id, c.id, c.name, c.icon, u.id, u.username
      ORDER BY d.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, ...queryParams, limit, offset);

    return documents;
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  /**
   * Generate excerpt from content
   */
  private generateExcerpt(content: string, length: number = 200): string {
    const text = content.replace(/[#*`_\[\]]/g, '').trim();
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  /**
   * Add tags to document
   */
  private async addTags(documentId: string, tagNames: string[]) {
    for (const tagName of tagNames) {
      // Get or create tag using Prisma upsert
      const tag = await this.prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
        select: { id: true },
      });

      // Link to document using Prisma create with ignore on conflict
      await this.prisma.documentTag.upsert({
        where: {
          documentId_tagId: {
            documentId,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          documentId,
          tagId: tag.id,
        },
      });
    }
  }

  /**
   * Update document tags
   */
  private async updateTags(documentId: string, tagNames: string[]) {
    // Remove existing tags
    await this.prisma.documentTag.deleteMany({
      where: { documentId },
    });

    // Add new tags
    await this.addTags(documentId, tagNames);
  }
}
