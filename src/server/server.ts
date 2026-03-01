import * as http from 'http';
import { randomUUID } from 'crypto';
import {
  type ServerConfig,
  type ApiResponse,
  type ConvertRequest,
  type ConvertResponse,
  type BatchConvertRequest,
  type BatchConvertResponse,
  type CreateJobRequest,
  type JobResponse,
  type JobData,
  type JobListResponse,
  type UsageResponse,
  DEFAULT_SERVER_CONFIG,
  type ConvertResultData,
  type BatchConvertResultData,
  type JobStatus,
  type UsageStats,
} from './types';

interface Job {
  id: string;
  type: 'convert' | 'batch';
  status: JobStatus;
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: ConvertResultData | BatchConvertResultData;
  error?: { code: string; message: string };
  payload: ConvertRequest | BatchConvertRequest;
  callbackUrl?: string;
}

interface UsageData {
  conversionsToday: number;
  conversionsThisMonth: number;
  bytesProcessedToday: number;
  totalProcessingTimeMs: number;
  successfulConversions: number;
  totalConversions: number;
  activeJobs: number;
  pendingJobs: number;
  lastReset: number;
}

class DocsJSServer {
  private server: http.Server | null = null;
  private config: ServerConfig;
  private jobs: Map<string, Job> = new Map();
  private usage: UsageData = {
    conversionsToday: 0,
    conversionsThisMonth: 0,
    bytesProcessedToday: 0,
    totalProcessingTimeMs: 0,
    successfulConversions: 0,
    totalConversions: 0,
    activeJobs: 0,
    pendingJobs: 0,
    lastReset: Date.now(),
  };
  private requestHandler: ((req: ConvertRequest) => Promise<ConvertResultData>) | null = null;

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = { ...DEFAULT_SERVER_CONFIG, ...config } as ServerConfig;
  }

  setRequestHandler(handler: (req: ConvertRequest) => Promise<ConvertResultData>) {
    this.requestHandler = handler;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        const requestId = randomUUID();
        const startTime = Date.now();

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', this.config.cors ? '*' : '');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const url = req.url || '';
        const apiPrefix = this.config.apiPrefix || '/api/v1';
        
        try {
          let body: string = '';
          for await (const chunk of req) {
            body += chunk;
          }

          if (this.config.logging) {
            console.log(`[${requestId}] ${req.method} ${url}`);
          }

          if (url === `${apiPrefix}/health`) {
            this.sendJson(res, 200, { success: true, data: { status: 'ok', timestamp: Date.now() } }, requestId, startTime);
            return;
          }

          if (url === `${apiPrefix}/convert` && req.method === 'POST') {
            const result = await this.handleConvert(requestId, body);
            this.sendJson(res, 200, result, requestId, startTime);
            return;
          }

          if (url === `${apiPrefix}/convert/batch` && req.method === 'POST') {
            const result = await this.handleBatchConvert(requestId, body);
            this.sendJson(res, 200, result, requestId, startTime);
            return;
          }

          if (url === `${apiPrefix}/jobs` && req.method === 'POST') {
            const result = await this.handleCreateJob(requestId, body);
            this.sendJson(res, 201, result, requestId, startTime);
            return;
          }

          if (url.match(/^\/api\/v1\/jobs\/[\w-]+$/) && req.method === 'GET') {
            const jobId = url.split('/').pop();
            const result = await this.handleGetJob(requestId, jobId!);
            if (result.success) {
              this.sendJson(res, 200, result, requestId, startTime);
            } else {
              this.sendJson(res, 404, result, requestId, startTime);
            }
            return;
          }

          if (url === `${apiPrefix}/jobs` && req.method === 'GET') {
            const result = await this.handleListJobs(requestId, url);
            this.sendJson(res, 200, result, requestId, startTime);
            return;
          }

          if (url === `${apiPrefix}/usage` && req.method === 'GET') {
            const result = await this.handleGetUsage(requestId);
            this.sendJson(res, 200, result, requestId, startTime);
            return;
          }

          this.sendJson(res, 404, { success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, requestId, startTime);
        } catch (error) {
          console.error(`[${requestId}] Error:`, error);
          this.sendJson(res, 500, { success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }, requestId, startTime);
        }
      });

      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`DocsJS API Server running on http://${this.config.host || '0.0.0.0'}:${this.config.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('DocsJS API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private sendJson(res: http.ServerResponse, statusCode: number, data: ApiResponse, requestId: string, startTime: number) {
    const processingTime = Date.now() - startTime;
    if (data.meta) {
      data.meta.requestId = requestId;
      data.meta.timestamp = Date.now();
      data.meta.processingTimeMs = processingTime;
    } else {
      data.meta = { requestId, timestamp: Date.now(), processingTimeMs: processingTime };
    }
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private parseBody<T>(body: string): T {
    try {
      return JSON.parse(body);
    } catch {
      throw new Error('Invalid JSON body');
    }
  }

  private async handleConvert(requestId: string, body: string): Promise<ConvertResponse> {
    const req = this.parseBody<ConvertRequest>(body);
    
    if (!req.file && !req.options?.async) {
      return { success: false, error: { code: 'MISSING_FILE', message: 'File content required' } };
    }

    if (req.options?.async) {
      const job = await this.createJob('convert', req, req.options.callbackUrl);
      return {
        success: true,
        data: {
          output: '',
          outputFormat: req.outputFormat,
          profile: req.profile || 'default',
          jobId: job.id,
          status: 'pending',
        },
      };
    }

    if (!this.requestHandler) {
      return { success: false, error: { code: 'NO_HANDLER', message: 'Request handler not set' } };
    }

    try {
      const result = await this.requestHandler(req);
      this.updateUsage(result.output.length, true);
      return { success: true, data: result };
    } catch (error) {
      this.updateUsage(0, false);
      return { success: false, error: { code: 'CONVERSION_FAILED', message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }

  private async handleBatchConvert(requestId: string, body: string): Promise<BatchConvertResponse> {
    const req = this.parseBody<BatchConvertRequest>(body);
    
    if (!req.files || req.files.length === 0) {
      return { success: false, error: { code: 'MISSING_FILES', message: 'Files array required' } };
    }

    if (req.async) {
      const job = await this.createJob('batch', req);
      return {
        success: true,
        data: {
          jobId: job.id,
          total: req.files.length,
          completed: 0,
          failed: 0,
          status: 'pending',
        },
      };
    }

    const results = await this.processBatch(req);
    return { success: true, data: results };
  }

  private async processBatch(req: BatchConvertRequest): Promise<BatchConvertResultData> {
    const results: BatchConvertResultData = {
      jobId: randomUUID(),
      total: req.files.length,
      completed: 0,
      failed: 0,
      status: 'processing',
      results: [],
    };

    for (const file of req.files) {
      try {
        const convertReq: ConvertRequest = {
          outputFormat: req.outputFormat,
          profile: req.profile,
          file: file.content,
        };
        
        if (this.requestHandler) {
          const result = await this.requestHandler(convertReq);
          results.results!.push({ filename: file.filename, success: true, output: result.output, metrics: result.metrics });
          results.completed++;
        }
      } catch (error) {
        results.results!.push({ filename: file.filename, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        results.failed++;
      }
    }

    results.status = results.failed === 0 ? 'completed' : results.completed === 0 ? 'failed' : 'partial';
    this.updateUsage(results.results.reduce((acc, r) => acc + (r.output?.length || 0), 0), results.failed === 0);
    return results;
  }

  private async createJob(type: 'convert' | 'batch', payload: ConvertRequest | BatchConvertRequest, callbackUrl?: string): Promise<Job> {
    const job: Job = {
      id: randomUUID(),
      type,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      payload,
      callbackUrl,
    };
    this.jobs.set(job.id, job);
    this.usage.pendingJobs++;
    this.processJobAsync(job.id);
    return job;
  }

  private async processJobAsync(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.startedAt = Date.now();
    this.usage.pendingJobs--;
    this.usage.activeJobs++;

    try {
      if (job.type === 'convert') {
        if (this.requestHandler) {
          const result = await this.requestHandler(job.payload as ConvertRequest);
          job.result = result;
          job.status = 'completed';
          this.usage.successfulConversions++;
        }
      } else {
        const result = await this.processBatch(job.payload as BatchConvertRequest);
        job.result = result;
        job.status = 'completed';
      }
    } catch (error) {
      job.status = 'failed';
      job.error = { code: 'JOB_FAILED', message: error instanceof Error ? error.message : 'Unknown error' };
    }

    job.completedAt = Date.now();
    job.progress = 100;
    this.usage.activeJobs--;

    if (job.callbackUrl) {
      this.sendWebhook(job);
    }
  }

  private async handleCreateJob(requestId: string, body: string): Promise<JobResponse> {
    const req = this.parseBody<CreateJobRequest>(body);
    
    if (!req.type || !req.payload) {
      return { success: false, error: { code: 'INVALID_REQUEST', message: 'type and payload required' } };
    }

    const job = await this.createJob(req.type, req.payload, req.callbackUrl);
    return { success: true, data: this.jobToJobData(job) };
  }

  private async handleGetJob(requestId: string, jobId: string): Promise<JobResponse> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } };
    }
    return { success: true, data: this.jobToJobData(job) };
  }

  private async handleListJobs(requestId: string, url: string): Promise<JobListResponse> {
    const jobs = Array.from(this.jobs.values()).map(j => this.jobToJobData(j));
    return {
      success: true,
      data: jobs,
      pagination: { page: 1, limit: 50, total: jobs.length, hasMore: false },
    };
  }

  private async handleGetUsage(requestId: string): Promise<UsageResponse> {
    this.checkUsageReset();
    const stats: UsageStats = {
      conversionsToday: this.usage.conversionsToday,
      conversionsThisMonth: this.usage.conversionsThisMonth,
      bytesProcessedToday: this.usage.bytesProcessedToday,
      avgProcessingTimeMs: this.usage.totalConversions > 0 ? this.usage.totalProcessingTimeMs / this.usage.totalConversions : 0,
      successRate: this.usage.totalConversions > 0 ? (this.usage.successfulConversions / this.usage.totalConversions) * 100 : 0,
      activeJobs: this.usage.activeJobs,
      pendingJobs: this.usage.pendingJobs,
    };
    return { success: true, data: stats };
  }

  private updateUsage(bytesProcessed: number, success: boolean) {
    this.checkUsageReset();
    this.usage.conversionsToday++;
    this.usage.conversionsThisMonth++;
    this.usage.bytesProcessedToday += bytesProcessed;
    this.usage.totalConversions++;
    if (success) {
      this.usage.successfulConversions++;
    }
  }

  private checkUsageReset() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    if (now - this.usage.lastReset > dayMs) {
      this.usage.conversionsToday = 0;
      this.usage.bytesProcessedToday = 0;
      this.usage.lastReset = now;
    }
  }

  private jobToJobData(job: Job): JobData {
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error,
    };
  }

  private async sendWebhook(job: Job) {
    if (!job.callbackUrl) return;
    try {
      const payload = {
        event: job.type === 'convert' ? 'conversion.completed' : 'batch.completed',
        timestamp: Date.now(),
        requestId: job.id,
        data: this.jobToJobData(job),
      };
      await fetch(job.callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Webhook delivery failed:', error);
    }
  }
}

export { DocsJSServer };
export default DocsJSServer;
