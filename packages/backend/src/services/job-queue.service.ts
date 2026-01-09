/**
 * Job Queue Service
 * Manages BullMQ job queues for job execution
 */

import { Queue, QueueEvents, Job as BullJob } from 'bullmq';
import { createRedisConnection } from '../lib/redis.js';
import type { Job, JobExecution } from '../types/job.types.js';

export class JobQueueService {
  private queue: Queue;
  private queueEvents: QueueEvents;
  private readonly queueName = 'automation-jobs';

  constructor() {
    const connection = createRedisConnection();

    // Create BullMQ queue
    this.queue = new Queue(this.queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5 seconds initial delay
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
      },
    });

    // Queue events for monitoring
    this.queueEvents = new QueueEvents(this.queueName, { connection });

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for queue monitoring
   */
  private setupEventListeners(): void {
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`Job ${jobId} completed`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on('stalled', ({ jobId }) => {
      console.warn(`Job ${jobId} stalled`);
    });
  }

  /**
   * Add a job to the queue
   */
  async addJob(job: Job, delay?: number): Promise<BullJob> {
    return this.queue.add(
      job.id,
      {
        jobId: job.id,
        moduleId: job.moduleId,
        handler: job.handler,
        config: job.config,
      },
      {
        jobId: job.id,
        delay,
        attempts: job.retries,
        timeout: job.timeout,
      }
    );
  }

  /**
   * Add a recurring job (cron-based)
   */
  async addRecurringJob(job: Job, cronExpression: string): Promise<BullJob> {
    return this.queue.add(
      job.id,
      {
        jobId: job.id,
        moduleId: job.moduleId,
        handler: job.handler,
        config: job.config,
      },
      {
        jobId: job.id,
        repeat: {
          pattern: cronExpression,
        },
        attempts: job.retries,
        timeout: job.timeout,
      }
    );
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  /**
   * Remove a recurring job
   */
  async removeRecurringJob(jobId: string): Promise<void> {
    await this.queue.removeRepeatableByKey(jobId);
  }

  /**
   * Pause a job
   */
  async pauseJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      // For repeatable jobs, we need to remove and re-add when resumed
      const repeatableJobs = await this.queue.getRepeatableJobs();
      const repeatableJob = repeatableJobs.find((rj) => rj.id === jobId);
      if (repeatableJob) {
        await this.queue.removeRepeatableByKey(repeatableJob.key);
      }
    }
  }

  /**
   * Resume a job
   */
  async resumeJob(job: Job, cronExpression?: string): Promise<void> {
    if (cronExpression) {
      await this.addRecurringJob(job, cronExpression);
    }
  }

  /**
   * Get job status from queue
   */
  async getJobStatus(jobId: string): Promise<string | null> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return state;
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get repeatable jobs
   */
  async getRepeatableJobs() {
    return this.queue.getRepeatableJobs();
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(grace: number = 86400000): Promise<void> {
    // Clean completed jobs older than grace period (default 24 hours)
    await this.queue.clean(grace, 1000, 'completed');
    // Clean failed jobs older than 7 days
    await this.queue.clean(grace * 7, 1000, 'failed');
  }

  /**
   * Obliterate queue (remove all jobs - use with caution!)
   */
  async obliterate(): Promise<void> {
    await this.queue.obliterate({ force: true });
  }

  /**
   * Close queue connections
   */
  async close(): Promise<void> {
    await this.queueEvents.close();
    await this.queue.close();
  }
}

// Singleton instance
export const jobQueueService = new JobQueueService();
