import { Job, JobStatus, Platform, UploadResult } from '@clipforge/shared';
import { JobQueue } from './job.queue';

interface QueueManagerOptions {
  maxWorkers?: number;
  queueName?: string;
}

export class QueueManager {
  private queueName: string;
  private maxWorkers: number;
  private isRunning: boolean = false;

  constructor(options: QueueManagerOptions = {}) {
    this.queueName = options.queueName || 'default';
    this.maxWorkers = options.maxWorkers || 3;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`Queue manager ${this.queueName} is already running`);
      return;
    }

    console.log(`Starting queue manager ${this.queueName} with ${this.maxWorkers} workers...`);

    // Start workers
    for (let i = 0; i < this.maxWorkers; i++) {
      await JobQueue.startWorker(this.queueName);
    }

    this.isRunning = true;
    console.log(`Queue manager ${this.queueName} started successfully`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log(`Queue manager ${this.queueName} is not running`);
      return;
    }

    console.log(`Stopping queue manager ${this.queueName}...`);
    
    await JobQueue.stopWorker(this.queueName);
    this.isRunning = false;
    console.log(`Queue manager ${this.queueName} stopped`);
  }

  async addJob(job: Job, accountId: string): Promise<string> {
    const bullJob = await JobQueue.addJob(job, accountId, this.queueName);
    return bullJob.id!;
  }

  async addMultipleJobs(jobs: Job[], accountId: string): Promise<string[]> {
    const bullJobs = await JobQueue.addMultipleJobs(jobs, accountId, this.queueName);
    return bullJobs.map(j => j.id!);
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  }> {
    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
    ] = await Promise.all([
      JobQueue.getWaitingCount(this.queueName),
      JobQueue.getActiveCount(this.queueName),
      JobQueue.getCompletedCount(this.queueName),
      JobQueue.getFailedCount(this.queueName),
      JobQueue.getDelayedCount(this.queueName),
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

  async getJobs(status: JobStatus, limit: number = 50): Promise<Job[]> {
    const bullJobs = await JobQueue.getJobs(
      status as 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
      this.queueName,
      limit
    );

    return bullJobs.map(bullJob => {
      const jobData = bullJob.data as { job: Job; accountId: string };
      return {
        ...jobData.job,
        progress: bullJob.progress(),
        status: bullJob.getState() as JobStatus,
      };
    });
  }

  async getJobById(jobId: string): Promise<Job | null> {
    const bullJob = await JobQueue.getJobById(jobId, this.queueName);
    
    if (!bullJob) {
      return null;
    }

    const jobData = bullJob.data as { job: Job; accountId: string };
    return {
      ...jobData.job,
      progress: bullJob.progress(),
      status: bullJob.getState() as JobStatus,
    };
  }

  async removeJob(jobId: string): Promise<void> {
    await JobQueue.removeJob(jobId, this.queueName);
  }

  async retryFailedJobs(limit: number = 10): Promise<number> {
    const failedJobs = await this.getJobs('failed', limit);
    
    let retried = 0;
    for (const job of failedJobs) {
      // Increment retry count
      const updatedJob: Job = {
        ...job,
        retryCount: (job.retryCount || 0) + 1,
        status: 'pending',
        updatedAt: new Date(),
      };

      // Re-add to queue
      await this.addJob(updatedJob, job.id); // Using job.id as accountId for retry
      retried++;
    }

    return retried;
  }

  async cleanCompleted(limit: number = 100): Promise<number> {
    return JobQueue.cleanCompleted(this.queueName, limit);
  }

  async cleanFailed(limit: number = 100): Promise<number> {
    return JobQueue.cleanFailed(this.queueName, limit);
  }

  async getNextScheduledJob(): Promise<Job | null> {
    const waitingJobs = await this.getJobs('waiting', 100);
    
    // Find job with nearest schedule time
    let nextJob: Job | null = null;
    let nextTime: number | null = null;

    for (const job of waitingJobs) {
      if (job.scheduleTime) {
        const scheduleTime = new Date(job.scheduleTime).getTime();
        if (!nextTime || scheduleTime < nextTime) {
          nextTime = scheduleTime;
          nextJob = job;
        }
      }
    }

    return nextJob;
  }

  async processScheduledJobs(): Promise<number> {
    const waitingJobs = await this.getJobs('waiting', 100);
    const now = new Date();

    let processed = 0;
    for (const job of waitingJobs) {
      if (job.scheduleTime && new Date(job.scheduleTime) <= now) {
        // Remove from waiting and add to active
        await this.removeJob(job.id);
        await this.addJob(job, job.id);
        processed++;
      }
    }

    return processed;
  }

  async pauseQueue(): Promise<void> {
    await JobQueue.stopWorker(this.queueName);
  }

  async resumeQueue(): Promise<void> {
    await JobQueue.startWorker(this.queueName);
  }

  async getQueueHealth(): Promise<{
    healthy: boolean;
    workers: number;
    queueLength: number;
    lastJobTime?: Date;
  }> {
    try {
      const stats = await this.getQueueStats();
      const workers = this.maxWorkers;
      
      // Check if queue is processing
      const activeJobs = await this.getJobs('active');
      const lastJobTime = activeJobs.length > 0 ? new Date(Math.max(...activeJobs.map(j => j.updatedAt.getTime()))) : undefined;

      return {
        healthy: true,
        workers,
        queueLength: stats.total,
        lastJobTime,
      };
    } catch (error) {
      return {
        healthy: false,
        workers: 0,
        queueLength: 0,
      };
    }
  }
}

export const queueManager = new QueueManager();
