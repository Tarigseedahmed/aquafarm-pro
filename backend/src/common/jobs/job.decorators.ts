import { SetMetadata } from '@nestjs/common';

export const JOB_HANDLER_METADATA = 'job:handler';
export const JOB_QUEUE_METADATA = 'job:queue';
export const JOB_OPTIONS_METADATA = 'job:options';

/**
 * Decorator for job handlers
 */
export function JobHandler(queueName: string, jobName: string, options: {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    SetMetadata(JOB_HANDLER_METADATA, {
      queueName,
      jobName,
      options,
      handler: descriptor.value,
    })(target, propertyName, descriptor);
    
    return descriptor;
  };
}

/**
 * Decorator for job queues
 */
export function JobQueue(queueName: string, options: {
  concurrency?: number;
  rateLimit?: {
    max: number;
    duration: number;
  };
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    SetMetadata(JOB_QUEUE_METADATA, {
      queueName,
      options,
    })(target, propertyName, descriptor);
    
    return descriptor;
  };
}

/**
 * Decorator for scheduling jobs
 */
export function ScheduleJob(queueName: string, jobName: string, cronExpression: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    SetMetadata('job:schedule', {
      queueName,
      jobName,
      cronExpression,
      handler: descriptor.value,
    })(target, propertyName, descriptor);
    
    return descriptor;
  };
}

/**
 * Job handler metadata interface
 */
export interface JobHandlerMetadata {
  queueName: string;
  jobName: string;
  options: {
    delay?: number;
    attempts?: number;
    backoff?: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
    removeOnComplete?: number;
    removeOnFail?: number;
  };
  handler: Function;
}

/**
 * Job queue metadata interface
 */
export interface JobQueueMetadata {
  queueName: string;
  options: {
    concurrency?: number;
    rateLimit?: {
      max: number;
      duration: number;
    };
  };
}

/**
 * Scheduled job metadata interface
 */
export interface ScheduledJobMetadata {
  queueName: string;
  jobName: string;
  cronExpression: string;
  handler: Function;
}
