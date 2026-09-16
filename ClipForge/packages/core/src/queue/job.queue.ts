import { Queue, Worker, Job as BullJob } from 'bullmq';
import { Job, JobStatus, Platform, UploadResult } from '@clipforge/shared';
import { homedir } from 'os';
import { join } from 'path';

interface JobData {
  job: Job;
  accountId: string;
  retryCount?: number;
}

interface JobResult {
  success: boolean;
  results?: UploadResult[];
  error?: string;
  processedFiles?: string[];
}

export class JobQueue {
  private static queues: Map<string, Queue> = new Map();
  private static workers: Map<string, Worker> = new Map();
  private static readonly REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  private static readonly CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY || '3');

  static getQueue(name: string = 'default'): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, { connection: this.REDIS_URL });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  static async addJob(
    job: Job,
    accountId: string,
    queueName: string = 'default'
  ): Promise<BullJob> {
    const queue = this.getQueue(queueName);
    
    const jobData: JobData = {
      job,
      accountId,
      retryCount: 0,
    };

    return queue.add('processJob', jobData, {
      attempts: job.maxRetries || 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    });
  }

  static async addMultipleJobs(
    jobs: Job[],
    accountId: string,
    queueName: string = 'default'
  ): Promise<BullJob[]> {
    const queue = this.getQueue(queueName);
    const bullJobs: BullJob[] = [];

    for (const job of jobs) {
      const jobData: JobData = {
        job,
        accountId,
        retryCount: 0,
      };

      const bullJob = await queue.add('processJob', jobData, {
        attempts: job.maxRetries || 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      });
      bullJobs.push(bullJob);
    }

    return bullJobs;
  }

  static async processJob(jobData: JobData): Promise<JobResult> {
    try {
      const { job, accountId, retryCount = 0 } = jobData;

      // Import services dynamically to avoid circular dependencies
      const { videoService } = await import('../services/video.service');
      const { platformService } = await import('../services/platform.service');
      const { AIService } = await import('../services/ai.service');

      // Update job status
      const updatedJob: Job = {
        ...job,
        status: 'processing',
        progress: 20,
        updatedAt: new Date(),
        retryCount,
      };

      // Step 1: Download and process video
      const processResult = await videoService.downloadAndProcess(
        job.url,
        {
          platforms: job.platforms,
          contentType: job.contentType,
          aspectRatio: job.aspectRatio,
          autoGenerateMetadata: job.autoGenerateMetadata,
          watermarkRemoval: job.watermarkRemoval,
          compressionPreset: job.compressionPreset,
          splitLongVideos: job.splitLongVideos,
          onProgress: (progress, status, message) => {
            // In a real implementation, we would update the job in the database
            console.log(`Job ${job.id} progress: ${progress}% - ${status} - ${message}`);
          },
        }
      );

      if (!processResult.success || !processResult.outputPath) {
        throw new Error(processResult.error || 'Failed to process video');
      }

      // Step 2: Upload to platforms
      const uploadResults: UploadResult[] = [];
      const processedFiles = processResult.processedVideos || [processResult.outputPath];

      for (const platform of job.platforms) {
        for (const filePath of processedFiles) {
          // Generate platform-specific metadata
          let title = processResult.metadata?.title || job.title || '';
          let description = processResult.metadata?.description || job.description || '';
          let hashtags = processResult.metadata?.hashtags || job.hashtags || [];

          // Generate platform-specific metadata if auto-generate is enabled
          if (job.autoGenerateMetadata) {
            const aiMetadata = await AIService.generatePlatformMetadata(
              title,
              description,
              platform,
              { model: 'gpt-4' }
            );
            title = aiMetadata.title;
            description = aiMetadata.description;
            hashtags = aiMetadata.hashtags;
          }

          const uploadResult = await platformService.uploadToPlatform(
            platform,
            accountId,
            filePath,
            {
              title,
              description,
              hashtags,
              contentType: job.contentType,
              scheduleTime: job.scheduleTime,
              isPublic: true,
            }
          );

          uploadResults.push(uploadResult);
        }
      }

      // Check if all uploads succeeded
      const allSuccess = uploadResults.every(r => r.success);

      return {
        success: allSuccess,
        results: uploadResults,
        processedFiles,
        error: allSuccess ? undefined : 'Some uploads failed',
      };
    } catch (error) {
      console.error('Job processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async startWorker(queueName: string = 'default'): Promise<void> {
    if (this.workers.has(queueName)) {
      return; // Worker already started
    }

    const queue = this.getQueue(queueName);
    
    const worker = new Worker(
      queue.name,
      async (job: BullJob) => {
        const jobData = job.data as JobData;
        return this.processJob(jobData);
      },
      {
        connection: this.REDIS_URL,
        concurrency: this.CONCURRENCY,
      }
    );

    worker.on('completed', (job: BullJob) => {
      const jobData = job.data as JobData;
      const result = job.returnvalue as JobResult;
      
      console.log(`Job ${jobData.job.id} completed:`, {
        success: result.success,
        results: result.results?.map(r => ({ platform: r.platform, success: r.success })),
      });

      // In a real implementation, we would update the job status in the database
    });

    worker.on('failed', (job: BullJob, error: Error) => {
      const jobData = job.data as JobData;
      console.error(`Job ${jobData.job.id} failed:`, error.message);

      // In a real implementation, we would update the job status in the database
      // and potentially retry the job
    });

    worker.on('progress', (job: BullJob, progress: number) => {
      const jobData = job.data as JobData;
      console.log(`Job ${jobData.job.id} progress: ${progress}%`);
    });

    worker.on('error', (error: Error) => {
      console.error('Worker error:', error);
    });

    this.workers.set(queueName, worker);
  }

  static async stopWorker(queueName: string = 'default'): Promise<void> {
    const worker = this.workers.get(queueName);
    if (worker) {
      await worker.close();
      this.workers.delete(queueName);
    }
  }

  static async getJobCount(queueName: string = 'default'): Promise<number> {
    const queue = this.getQueue(queueName);
    return queue.getJobCount();
  }

  static async getWaitingCount(queueName: string = 'default'): Promise<number> {
    const queue = this.getQueue(queueName);
    return queue.getJobCount('waiting');
  }

  static async getActiveCount(queueName: string = 'default'): Promise<number> {
    const queue = this.getQueue(queueName);
    return queue.getJobCount('active');
  }

  static async getCompletedCount(queueName: string = 'default'): Promise<number> {
    const queue = this.getQueue(queueName);
    return queue.getJobCount('completed');
  }

  static async getFailedCount(queueName: string = 'default'): Promise<number> {
    const queue = this.getQueue(queueName);
    return queue.getJobCount('failed');
  }

  static async getDelayedCount(queueName: string = 'default'): Promise<number> {
    const queue = this.getQueue(queueName);
    return queue.getJobCount('delayed');
  }

  static async getJobs(
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    queueName: string = 'default',
    limit: number = 100
  ): Promise<BullJob[]> {
    const queue = this.getQueue(queueName);
    return queue.getJobs([status], 0, limit);
  }

  static async getJobById(
    jobId: string,
    queueName: string = 'default'
  ): Promise<BullJob | null> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  static async removeJob(
    jobId: string,
    queueName: string = 'default'
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  static async cleanCompleted(
    queueName: string = 'default',
    limit: number = 100
  ): Promise<number> {
    const queue = this.getQueue(queueName);
    const jobs = await queue.getJobs('completed', 0, limit);
    
    let removed = 0;
    for (const job of jobs) {
      await job.remove();
      removed++;
    }
    
    return removed;
  }

  static async cleanFailed(
    queueName: string = 'default',
    limit: number = 100
  ): Promise<number> {
    const queue = this.getQueue(queueName);
    const jobs = await queue.getJobs('failed', 0, limit);
    
    let removed = 0;
    for (const job of jobs) {
      await job.remove();
      removed++;
    }
    
    return removed;
  }

  static async closeAll(): Promise<void> {
    for (const [name, queue] of this.queues) {
      await queue.close();
    }
    this.queues.clear();

    for (const [name, worker] of this.workers) {
      await worker.close();
    }
    this.workers.clear();
  }
}

export const jobQueue = JobQueue;
