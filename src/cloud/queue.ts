/**
 * Distributed Queue System
 * 
 * Queue management for bulk document processing with priority support.
 */

import type { QueueMessage, BatchJob } from './types';

/**
 * Queue implementation
 */
export class DistributedQueue {
  private queues: Map<string, Queue<Message>> = new Map();
  private processing: Map<string, Promise<void>> = new Map();
  private handlers: Map<string, MessageHandler> = new Map();
  private deadLetterQueue: Queue<Message> = new Queue();
  private config: QueueConfig;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxRetries: 3,
      visibilityTimeout: 30,
      defaultPriority: 0,
      concurrency: 5,
      ...config
    };
  }

  /**
   * Enqueue a message
   */
  async enqueue(
    queueName: string,
    payload: unknown,
    options: Partial<EnqueueOptions> = {}
  ): Promise<string> {
    const queue = this.getOrCreateQueue(queueName);
    
    const message: Message = {
      id: this.generateId(),
      payload,
      priority: options.priority ?? this.config.defaultPriority,
      maxRetries: options.maxRetries ?? this.config.maxRetries,
      retryCount: 0,
      visibilityTimeout: options.visibilityTimeout ?? this.config.visibilityTimeout,
      delaySeconds: options.delaySeconds ?? 0,
      attributes: options.attributes,
      timestamp: Date.now()
    };

    queue.enqueue(message, message.priority);
    
    // Trigger processing if not already running
    this.processQueue(queueName);
    
    return message.id;
  }

  /**
   * Register a message handler
   */
  registerHandler(queueName: string, handler: MessageHandler): void {
    this.handlers.set(queueName, handler);
  }

  /**
   * Process a queue
   */
  private async processQueue(queueName: string): Promise<void> {
    if (this.processing.has(queueName)) {
      return; // Already processing
    }

    const handler = this.handlers.get(queueName);
    if (!handler) {
      console.warn(`No handler registered for queue: ${queueName}`);
      return;
    }

    const queue = this.queues.get(queueName);
    if (!queue || queue.isEmpty()) {
      return;
    }

    const processLoop = async () => {
      while (!queue.isEmpty()) {
        const message = queue.dequeue();
        if (!message) break;

        try {
          await handler(message.payload);
          // Message processed successfully
        } catch (error) {
          message.retryCount++;
          if (message.retryCount < message.maxRetries) {
            // Re-queue with delay
            message.timestamp = Date.now() + (message.retryCount * 1000);
            queue.enqueue(message, message.priority - message.retryCount);
          } else {
            // Send to dead letter queue
            this.deadLetterQueue.enqueue(message, -1000);
          }
        }
      }
      this.processing.delete(queueName);
    };

    this.processing.set(queueName, processLoop());
    processLoop();
  }

  /**
   * Get queue stats
   */
  getStats(queueName: string): QueueStats {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return { size: 0, oldestMessageAge: 0, priorityDistribution: {} };
    }

    const messages = queue.toArray();
    const now = Date.now();
    const oldestMessageAge = messages.length > 0 
      ? Math.max(...messages.map(m => now - m.timestamp))
      : 0;

    const priorityDistribution: Record<number, number> = {};
    messages.forEach(m => {
      priorityDistribution[m.priority] = (priorityDistribution[m.priority] || 0) + 1;
    });

    return {
      size: messages.length,
      oldestMessageAge,
      priorityDistribution
    };
  }

  /**
   * Clear a queue
   */
  clear(queueName: string): void {
    this.queues.delete(queueName);
  }

  private getOrCreateQueue(queueName: string): Queue<Message> {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, new Queue<Message>());
    }
    return this.queues.get(queueName)!;
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Priority Queue implementation
 */
class Queue<T> {
  private items: { value: T; priority: number }[] = [];

  enqueue(value: T, priority: number): void {
    this.items.push({ value, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.value;
  }

  peek(): T | undefined {
    return this.items[0]?.value;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  toArray(): T[] {
    return this.items.map(item => item.value);
  }
}

interface Message extends QueueMessage {
  payload: unknown;
}

interface MessageHandler {
  (payload: unknown): Promise<void>;
}

interface QueueConfig {
  maxRetries: number;
  visibilityTimeout: number;
  defaultPriority: number;
  concurrency: number;
}

interface EnqueueOptions {
  priority: number;
  maxRetries: number;
  visibilityTimeout: number;
  delaySeconds: number;
  attributes?: Record<string, string>;
}

interface QueueStats {
  size: number;
  oldestMessageAge: number;
  priorityDistribution: Record<number, number>;
}

/**
 * Batch Job Processor
 */
export class BatchProcessor {
  private queue: DistributedQueue;
  private jobs: Map<string, BatchJob> = new Map();
  private handlers: Map<string, BatchJobHandler> = new Map();

  constructor(queue?: DistributedQueue) {
    this.queue = queue || new DistributedQueue();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.queue.registerHandler('batch', async (payload) => {
      const job = payload as BatchJob;
      await this.processJob(job);
    });
  }

  /**
   * Submit a batch job
   */
  async submitBatch(
    type: BatchJob['type'],
    inputFiles: string[],
    outputFormat: string,
    options: Partial<BatchJobOptions> = {}
  ): Promise<string> {
    const job: BatchJob = {
      id: this.generateJobId(),
      type,
      status: 'pending',
      inputFiles,
      outputFormat,
      progress: 0,
      createdAt: Date.now(),
      callbackUrl: options.callbackUrl,
      metadata: options.metadata
    };

    this.jobs.set(job.id, job);

    await this.queue.enqueue('batch', job, {
      priority: options.priority ?? 0,
      attributes: { jobId: job.id }
    });

    return job.id;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * List jobs
   */
  listJobs(filter?: Partial<JobFilter>): BatchJob[] {
    let jobs = Array.from(this.jobs.values());
    
    if (filter?.status) {
      jobs = jobs.filter(j => j.status === filter.status);
    }
    if (filter?.type) {
      jobs = jobs.filter(j => j.type === filter.type);
    }
    if (filter?.createdAfter) {
      jobs = jobs.filter(j => j.createdAt >= filter.createdAfter!);
    }
    if (filter?.createdBefore) {
      jobs = jobs.filter(j => j.createdAt <= filter.createdBefore!);
    }

    return jobs.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'cancelled';
    job.completedAt = Date.now();
    return true;
  }

  private async processJob(job: BatchJob): Promise<void> {
    job.status = 'processing';
    job.startedAt = Date.now();

    try {
      const totalFiles = job.inputFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        if (job.status === 'cancelled') {
          break;
        }

        const file = job.inputFiles[i];
        // Process each file
        job.progress = Math.round(((i + 1) / totalFiles) * 100);
      }

      if (job.status !== 'cancelled') {
        job.status = 'completed';
        job.resultUrl = `/results/${job.id}`;
      }
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
    }

    job.completedAt = Date.now();

    // Trigger callback if specified
    if (job.callbackUrl) {
      this.triggerCallback(job);
    }
  }

  private async triggerCallback(job: BatchJob): Promise<void> {
    try {
      const response = await fetch(job.callbackUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          resultUrl: job.resultUrl,
          error: job.error
        })
      });
      if (!response.ok) {
        console.error(`Callback failed for job ${job.id}: ${response.status}`);
      }
    } catch (error) {
      console.error(`Callback error for job ${job.id}:`, error);
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface BatchJobHandler {
  (job: BatchJob): Promise<void>;
}

interface BatchJobOptions {
  priority: number;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}

interface JobFilter {
  status: BatchJob['status'];
  type: BatchJob['type'];
  createdAfter: number;
  createdBefore: number;
}
