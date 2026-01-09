/**
 * Job Execution API Routes
 * Handles job execution history and logs
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import type { ListExecutionsQuery } from '../types/job.types.js';

// Validation schemas
const listExecutionsSchema = z.object({
  jobId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED']).optional(),
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('50'),
});

export const executionsRoutes: FastifyPluginAsync = async (fastify) => {
  // List job executions for a specific job
  fastify.get('/jobs/:jobId/executions', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const query = listExecutionsSchema.parse(request.query);
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    const where: any = { jobId };
    if (query.status) {
      where.status = query.status;
    }

    const [executions, total] = await Promise.all([
      prisma.jobExecution.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              name: true,
              moduleId: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      prisma.jobExecution.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: executions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // List all executions (across all jobs)
  fastify.get('/', async (request, reply) => {
    const query = listExecutionsSchema.parse(request.query);
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.jobId) {
      where.jobId = query.jobId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [executions, total] = await Promise.all([
      prisma.jobExecution.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              name: true,
              moduleId: true,
              handler: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      prisma.jobExecution.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: executions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // Get execution by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const execution = await prisma.jobExecution.findUnique({
      where: { id },
      include: {
        job: true,
      },
    });

    if (!execution) {
      return reply.status(404).send({
        success: false,
        error: 'Execution not found',
      });
    }

    return reply.send({
      success: true,
      data: execution,
    });
  });

  // Get execution logs
  fastify.get('/:id/logs', async (request, reply) => {
    const { id } = request.params as { id: string };

    const execution = await prisma.jobExecution.findUnique({
      where: { id },
      select: {
        id: true,
        logs: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (!execution) {
      return reply.status(404).send({
        success: false,
        error: 'Execution not found',
      });
    }

    return reply.send({
      success: true,
      data: {
        id: execution.id,
        logs: execution.logs || '',
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
      },
    });
  });

  // Delete execution
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const execution = await prisma.jobExecution.findUnique({
      where: { id },
    });

    if (!execution) {
      return reply.status(404).send({
        success: false,
        error: 'Execution not found',
      });
    }

    await prisma.jobExecution.delete({
      where: { id },
    });

    return reply.send({
      success: true,
      message: 'Execution deleted successfully',
    });
  });

  // Get execution statistics
  fastify.get('/stats/summary', async (request, reply) => {
    const [total, pending, running, completed, failed, timeout, cancelled] = await Promise.all([
      prisma.jobExecution.count(),
      prisma.jobExecution.count({ where: { status: 'PENDING' } }),
      prisma.jobExecution.count({ where: { status: 'RUNNING' } }),
      prisma.jobExecution.count({ where: { status: 'COMPLETED' } }),
      prisma.jobExecution.count({ where: { status: 'FAILED' } }),
      prisma.jobExecution.count({ where: { status: 'TIMEOUT' } }),
      prisma.jobExecution.count({ where: { status: 'CANCELLED' } }),
    ]);

    // Get average duration for completed jobs
    const avgDuration = await prisma.jobExecution.aggregate({
      where: {
        status: 'COMPLETED',
        duration: { not: null },
      },
      _avg: {
        duration: true,
      },
    });

    return reply.send({
      success: true,
      data: {
        total,
        byStatus: {
          pending,
          running,
          completed,
          failed,
          timeout,
          cancelled,
        },
        averageDuration: avgDuration._avg.duration || 0,
        successRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
      },
    });
  });

  // Get recent executions (last 24 hours)
  fastify.get('/stats/recent', async (request, reply) => {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const executions = await prisma.jobExecution.findMany({
      where: {
        startedAt: {
          gte: last24Hours,
        },
      },
      include: {
        job: {
          select: {
            id: true,
            name: true,
            moduleId: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });

    return reply.send({
      success: true,
      data: executions,
    });
  });
};
