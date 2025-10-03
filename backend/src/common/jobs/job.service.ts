import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface JobOptions {
  delay?: number; // Delay in milliseconds
  attempts?: number; // Number of retry attempts
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number; // Number of completed jobs to keep
  removeOnFail?: number; // Number of failed jobs to keep
}

export interface JobData {
  [key: string]: any;
}

export interface Job {
  id: string;
  name: string;
  data: JobData;
  options: JobOptions;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  attempts: number;
  maxAttempts: number;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
}

export interface JobQueue {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);
  private readonly jobQueues = new Map<string, Job[]>();
  private readonly workers = new Map<string, (job: Job) => Promise<any>>();

  constructor(
    private redisService: RedisService,
    private pinoLogger: PinoLoggerService,
  ) {}

  /**
   * Add a job to the queue
   */
  async addJob(
    queueName: string,
    jobName: string,
    data: JobData,
    options: JobOptions = {},
  ): Promise<Job> {
    const job: Job = {
      id: this.generateJobId(),
      name: jobName,
      data,
      options: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
        ...options,
      },
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.attempts || 3,
      status: options.delay ? 'delayed' : 'waiting',
    };

    // Store job in memory queue
    if (!this.jobQueues.has(queueName)) {
      this.jobQueues.set(queueName, []);
    }

    const queue = this.jobQueues.get(queueName)!;
    queue.push(job);

    // Store in Redis for persistence
    if (this.redisService.isEnabled()) {
      await this.storeJobInRedis(queueName, job);
    }

    this.logger.debug(
      `Job ${job.id} added to queue ${queueName}: ${jobName}`,
    );

    // Process job if no delay
    if (!options.delay) {
      setImmediate(() => this.processQueue(queueName));
    } else {
      // Schedule delayed job
      setTimeout(() => {
        job.status = 'waiting';
        this.processQueue(queueName);
      }, options.delay);
    }

    return job;
  }

  /**
   * Register a worker for a job type
   */
  registerWorker(queueName: string, jobName: string, worker: (job: Job) => Promise<any>): void {
    const workerKey = `${queueName}:${jobName}`;
    this.workers.set(workerKey, worker);
    
    this.logger.log(`Worker registered for ${workerKey}`);
  }

  /**
   * Process jobs in a queue
   */
  private async processQueue(queueName: string): Promise<void> {
    const queue = this.jobQueues.get(queueName);
    if (!queue) return;

    const waitingJobs = queue.filter(job => job.status === 'waiting');
    if (waitingJobs.length === 0) return;

    // Process jobs concurrently (limit to 5 concurrent jobs per queue)
    const activeJobs = queue.filter(job => job.status === 'active');
    const maxConcurrent = 5;
    
    if (activeJobs.length >= maxConcurrent) {
      return;
    }

    const job = waitingJobs[0];
    await this.processJob(queueName, job);
  }

  /**
   * Process a single job
   */
  private async processJob(queueName: string, job: Job): Promise<void> {
    const workerKey = `${queueName}:${job.name}`;
    const worker = this.workers.get(workerKey);

    if (!worker) {
      this.logger.error(`No worker found for job ${workerKey}`);
      job.status = 'failed';
      job.failedAt = new Date();
      return;
    }

    job.status = 'active';
    job.processedAt = new Date();
    job.attempts++;

    try {
      this.logger.debug(`Processing job ${job.id}: ${job.name}`);
      
      const result = await worker(job);
      
      job.status = 'completed';
      job.completedAt = new Date();
      
      this.logger.debug(`Job ${job.id} completed successfully`);
      
      // Clean up completed jobs
      this.cleanupCompletedJobs(queueName, job);
      
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      
      if (job.attempts < job.maxAttempts) {
        // Retry job with backoff
        const delay = this.calculateBackoffDelay(job);
        job.status = 'delayed';
        
        setTimeout(() => {
          job.status = 'waiting';
          this.processQueue(queueName);
        }, delay);
        
        this.logger.debug(`Job ${job.id} scheduled for retry in ${delay}ms`);
      } else {
        // Job failed permanently
        job.status = 'failed';
        job.failedAt = new Date();
        
        this.cleanupFailedJobs(queueName, job);
      }
    }

    // Continue processing other jobs
    setImmediate(() => this.processQueue(queueName));
  }

  /**
   * Calculate backoff delay for retry
   */
  private calculateBackoffDelay(job: Job): number {
    const backoff = job.options.backoff!;
    const baseDelay = backoff.delay;
    
    if (backoff.type === 'exponential') {
      return baseDelay * Math.pow(2, job.attempts - 1);
    } else {
      return baseDelay;
    }
  }

  /**
   * Clean up completed jobs
   */
  private cleanupCompletedJobs(queueName: string, job: Job): void {
    const queue = this.jobQueues.get(queueName);
    if (!queue) return;

    const removeCount = job.options.removeOnComplete || 10;
    const completedJobs = queue.filter(j => j.status === 'completed');
    
    if (completedJobs.length > removeCount) {
      completedJobs
        .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime())
        .slice(0, completedJobs.length - removeCount)
        .forEach(j => {
          const index = queue.indexOf(j);
          if (index > -1) {
            queue.splice(index, 1);
          }
        });
    }
  }

  /**
   * Clean up failed jobs
   */
  private cleanupFailedJobs(queueName: string, job: Job): void {
    const queue = this.jobQueues.get(queueName);
    if (!queue) return;

    const removeCount = job.options.removeOnFail || 5;
    const failedJobs = queue.filter(j => j.status === 'failed');
    
    if (failedJobs.length > removeCount) {
      failedJobs
        .sort((a, b) => a.failedAt!.getTime() - b.failedAt!.getTime())
        .slice(0, failedJobs.length - removeCount)
        .forEach(j => {
          const index = queue.indexOf(j);
          if (index > -1) {
            queue.splice(index, 1);
          }
        });
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(queueName: string): JobQueue | null {
    const queue = this.jobQueues.get(queueName);
    if (!queue) return null;

    return {
      name: queueName,
      waiting: queue.filter(j => j.status === 'waiting').length,
      active: queue.filter(j => j.status === 'active').length,
      completed: queue.filter(j => j.status === 'completed').length,
      failed: queue.filter(j => j.status === 'failed').length,
      delayed: queue.filter(j => j.status === 'delayed').length,
    };
  }

  /**
   * Get all queue statistics
   */
  getAllQueueStats(): JobQueue[] {
    return Array.from(this.jobQueues.keys()).map(queueName => 
      this.getQueueStats(queueName)!
    );
  }

  /**
   * Get job by ID
   */
  getJob(queueName: string, jobId: string): Job | null {
    const queue = this.jobQueues.get(queueName);
    if (!queue) return null;

    return queue.find(job => job.id === jobId) || null;
  }

  /**
   * Cancel a job
   */
  async cancelJob(queueName: string, jobId: string): Promise<boolean> {
    const job = this.getJob(queueName, jobId);
    if (!job) return false;

    if (job.status === 'waiting' || job.status === 'delayed') {
      job.status = 'failed';
      job.failedAt = new Date();
      
      const queue = this.jobQueues.get(queueName)!;
      const index = queue.indexOf(job);
      if (index > -1) {
        queue.splice(index, 1);
      }
      
      return true;
    }

    return false;
  }

  /**
   * Store job in Redis for persistence
   */
  private async storeJobInRedis(queueName: string, job: Job): Promise<void> {
    if (!this.redisService.isEnabled()) return;

    try {
      const key = `job:${queueName}:${job.id}`;
      await this.redisService.setex(key, 86400, JSON.stringify(job)); // 24 hours TTL
    } catch (error) {
      this.logger.error(`Failed to store job ${job.id} in Redis:`, error);
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const stats = this.getAllQueueStats();
      const totalJobs = stats.reduce((sum, queue) => 
        sum + queue.waiting + queue.active + queue.completed + queue.failed + queue.delayed, 0
      );
      
      this.logger.debug(`Job service health check: ${totalJobs} total jobs across ${stats.length} queues`);
      return true;
    } catch (error) {
      this.logger.error('Job service health check failed:', error);
      return false;
    }
  }
}
