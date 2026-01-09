/**
 * Job Management API Routes
 * Handles CRUD operations for jobs and schedules
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { jobQueueService } from '../services/job-queue.service.js';
import { jobSchedulerService } from '../services/job-scheduler.service.js';
import { workerService } from '../services/worker.service.js';
import { jobExecutorService } from '../services/job-executor.service.js';
import type { CreateJobDTO, UpdateJobDTO, ListJobsQuery } from '../types/job.types.js';

// Validation schemas
const createJobSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  moduleId: z.string().uuid(),
  handler: z.string().min(1),
  schedule: z.string().optional(),
  enabled: z.boolean().optional().default(true),
  timeout: z.number().int().positive().optional().default(300000),
  retries: z.number().int().nonnegative().optional().default(3),
  config: z.record(z.any()).optional(),
});

const updateJobSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  schedule: z.string().optional(),
  enabled: z.boolean().optional(),
  timeout: z.number().int().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
  config: z.record(z.any()).optional(),
});

const listJobsSchema = z.object({
  moduleId: z.string().uuid().optional(),
  enabled: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('50'),
});

export const jobsRoutes: FastifyPluginAsync = async (fastify) => {
  // List all jobs
  fastify.get('/', async (request, reply) => {
    const query = listJobsSchema.parse(request.query);
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.moduleId) {
      where.moduleId = query.moduleId;
    }
    if (query.enabled !== undefined) {
      where.enabled = query.enabled === 'true';
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          schedules: true,
          _count: {
            select: { executions: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // Get job by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        schedules: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10, // Last 10 executions
        },
        _count: {
          select: { executions: true },
        },
      },
    });

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: 'Job not found',
      });
    }

    // Get queue status
    const queueStatus = await jobQueueService.getJobStatus(id);

    return reply.send({
      success: true,
      data: {
        ...job,
        queueStatus,
      },
    });
  });

  // Create new job
  fastify.post('/', async (request, reply) => {
    const body = createJobSchema.parse(request.body);

    // Validate module exists
    const module = await prisma.module.findUnique({
      where: { id: body.moduleId },
    });

    if (!module) {
      return reply.status(404).send({
        success: false,
        error: 'Module not found',
      });
    }

    // Validate cron expression if provided
    if (body.schedule && !jobSchedulerService.validateCronExpression(body.schedule)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid cron expression',
      });
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        name: body.name,
        description: body.description,
        moduleId: body.moduleId,
        handler: body.handler,
        schedule: body.schedule,
        enabled: body.enabled ?? true,
        timeout: body.timeout ?? 300000,
        retries: body.retries ?? 3,
        config: body.config || {},
        createdBy: (request.user as any)?.id,
      },
      include: {
        schedules: true,
      },
    });

    // Create schedule if cron expression provided
    if (body.schedule) {
      await jobSchedulerService.createSchedule(job.id, body.schedule);
      await jobSchedulerService.enableJobSchedules(job.id);
    }

    return reply.status(201).send({
      success: true,
      data: job,
    });
  });

  // Update job
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateJobSchema.parse(request.body);

    // Check job exists
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return reply.status(404).send({
        success: false,
        error: 'Job not found',
      });
    }

    // Validate cron expression if provided
    if (body.schedule && !jobSchedulerService.validateCronExpression(body.schedule)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid cron expression',
      });
    }

    // Update job
    const job = await prisma.job.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        schedule: body.schedule,
        enabled: body.enabled,
        timeout: body.timeout,
        retries: body.retries,
        config: body.config,
      },
      include: {
        schedules: true,
      },
    });

    // Update schedule if changed
    if (body.schedule !== undefined) {
      if (body.schedule) {
        await jobSchedulerService.createSchedule(job.id, body.schedule);
        if (job.enabled) {
          await jobSchedulerService.enableJobSchedules(job.id);
        }
      } else {
        await jobSchedulerService.disableJobSchedules(job.id);
      }
    }

    return reply.send({
      success: true,
      data: job,
    });
  });

  // Delete job
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Check job exists
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: 'Job not found',
      });
    }

    // Remove from queue
    await jobQueueService.removeJob(id);
    await jobQueueService.removeRecurringJob(id);

    // Delete job (cascades to schedules and executions)
    await prisma.job.delete({
      where: { id },
    });

    return reply.send({
      success: true,
      message: 'Job deleted successfully',
    });
  });

  // Execute job manually
  fastify.post('/:id/execute', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: 'Job not found',
      });
    }

    if (!job.enabled) {
      return reply.status(400).send({
        success: false,
        error: 'Job is disabled',
      });
    }

    // Add to queue (worker will create execution record)
    await jobQueueService.addJob(job as any);

    return reply.send({
      success: true,
      message: 'Job queued for execution',
    });
  });

  // Enable job
  fastify.put('/:id/enable', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await prisma.job.update({
      where: { id },
      data: { enabled: true },
      include: { schedules: true },
    });

    // Enable schedules
    if (job.schedule) {
      await jobSchedulerService.enableJobSchedules(id);
    }

    return reply.send({
      success: true,
      data: job,
    });
  });

  // Disable job
  fastify.put('/:id/disable', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await prisma.job.update({
      where: { id },
      data: { enabled: false },
    });

    // Disable schedules
    await jobSchedulerService.disableJobSchedules(id);

    return reply.send({
      success: true,
      data: job,
    });
  });

  // Get queue metrics
  fastify.get('/metrics/queue', async (request, reply) => {
    const metrics = await jobQueueService.getQueueMetrics();
    const scheduleStats = await jobSchedulerService.getScheduleStats();

    return reply.send({
      success: true,
      data: {
        queue: metrics,
        schedules: scheduleStats,
      },
    });
  });

  // Get worker status
  fastify.get('/metrics/worker', async (request, reply) => {
    const status = workerService.getStatus();
    const cacheStats = jobExecutorService.getCacheStats();

    return reply.send({
      success: true,
      data: {
        worker: status,
        executor: cacheStats,
      },
    });
  });

  // Clear handler cache (useful after module updates)
  fastify.post('/cache/clear', async (request, reply) => {
    const { moduleId } = request.body as { moduleId?: string };

    jobExecutorService.clearCache(moduleId);

    return reply.send({
      success: true,
      message: moduleId
        ? `Cache cleared for module ${moduleId}`
        : 'Cache cleared for all modules',
    });
  });
};
