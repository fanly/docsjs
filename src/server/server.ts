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
  type WebhookRegistration,
  type WebhookEventType,
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
  private webhooks: Map<string, WebhookRegistration> = new Map();

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

          // Basic health check
          if (url === `${apiPrefix}/health`) {
            this.sendJson(res, 200, { success: true, data: { status: 'ok', timestamp: Date.now() } }, requestId, startTime);
            return;
          }

          // Detailed health check
          if (url === `${apiPrefix}/health/detailed` && req.method === 'GET') {
            const health = await this.getDetailedHealth();
            const statusCode = health.status === 'healthy' ? 200 : 503;
            this.sendJson(res, statusCode, { success: true, data: health }, requestId, startTime);
            return;
          }

          if (url === `${apiPrefix}/convert` && req.method === 'POST') {

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

          // Webhook endpoints
          if (url === `${apiPrefix}/webhooks` && req.method === 'POST') {
            const result = await this.handleCreateWebhook(requestId, body);
            this.sendJson(res, 201, result, requestId, startTime);
            return;
          }

          if (url === `${apiPrefix}/webhooks` && req.method === 'GET') {
            const result = await this.handleListWebhooks(requestId);
            this.sendJson(res, 200, result, requestId, startTime);
            return;
          }

          if (url.match(/^\/api\/v1\/webhooks\/[\w-]+$/) && req.method === 'DELETE') {
            const webhookId = url.split('/').pop();
            const result = await this.handleDeleteWebhook(requestId, webhookId!);
            if (result.success) {
              this.sendJson(res, 200, result, requestId, startTime);
            } else {
              this.sendJson(res, 404, result, requestId, startTime);
            }
            return;
          }

          if (url.match(/^\/api\/v1\/webhooks\/[\w-]+\/test$/) && req.method === 'POST') {
            const webhookId = url.split('/')[4];
            const result = await this.handleTestWebhook(requestId, webhookId, body);
            if (result.success) {
              this.sendJson(res, 200, result, requestId, startTime);
            } else {
              this.sendJson(res, 404, result, requestId, startTime);
            }
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
    
    // CDN-ready headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'X-Request-Id': requestId,
      'X-Processing-Time-Ms': String(processingTime),
    };
    
    // Add ETag for GET requests that can be cached
    if (statusCode === 200 && data.success) {
      const etag = this.generateETag(JSON.stringify(data));
      headers['ETag'] = etag;
      headers['Cache-Control'] = 'public, max-age=60, s-maxage=300';
    }
    
    res.writeHead(statusCode, headers);
    res.end(JSON.stringify(data));
  }

  private generateETag(content: string): string {
    return '"' + Math.abs(this.hashCode(content)).toString(16) + '"';
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
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

    return { success: true, data: stats };
  }

  private async handleCreateWebhook(requestId: string, body: string): Promise<ApiResponse<WebhookRegistration>> {
    const req = this.parseBody<{ url: string; events: WebhookEventType[]; secret?: string }>(body);
    
    if (!req.url) {
      return { success: false, error: { code: 'INVALID_REQUEST', message: 'url is required' } };
    }
    
    if (!req.events || req.events.length === 0) {
      return { success: false, error: { code: 'INVALID_REQUEST', message: 'events array is required' } };
    }
    
    const webhook: WebhookRegistration = {
      id: randomUUID(),
      url: req.url,
      events: req.events,
      secret: req.secret,
      enabled: true,
    };
    
    this.webhooks.set(webhook.id, webhook);
    return { success: true, data: webhook };
  }

  private async handleListWebhooks(requestId: string): Promise<ApiResponse<WebhookRegistration[]>> {
    const webhooks = Array.from(this.webhooks.values());
    return { success: true, data: webhooks };
  }

  private async handleDeleteWebhook(requestId: string, webhookId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const deleted = this.webhooks.delete(webhookId);
    return { success: true, data: { deleted } };
  }

  private async handleTestWebhook(requestId: string, webhookId: string, body: string): Promise<ApiResponse<{ delivered: boolean; responseCode?: number }>> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Webhook not found' } };
    }
    
    try {
      const testPayload = {
        event: 'test' as WebhookEventType,
        timestamp: Date.now(),
        requestId,
        data: { message: 'Test webhook from DocsJS' },
      };
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-DocsJS-Webhook-Event': 'test',
        },
        body: JSON.stringify(testPayload),
      });
      
      return { 
        success: true, 
        data: { delivered: response.ok, responseCode: response.status } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'DELIVERY_FAILED', message: error instanceof Error ? error.message : 'Unknown error' } 
      };
    }
  }

  private async notifyWebhooks(event: WebhookEventType, data: unknown) {
    const payload = {
      event,
      timestamp: Date.now(),
      requestId: randomUUID(),
      data,
    };
    
    for (const webhook of this.webhooks.values()) {
      if (!webhook.enabled || !webhook.events.includes(event)) continue;
      
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-DocsJS-Webhook-Event': event,
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.id}:`, error);
      }
    }
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

  private async getDetailedHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: number;
    uptime: number;
    checks: {
      memory: { status: 'ok' | 'warning' | 'error'; used: number; total: number };
      jobs: { status: 'ok' | 'warning' | 'error'; active: number; pending: number };
      storage: { status: 'ok' | 'warning' | 'error' };
    };
  }> {
    const memUsage = process.memoryUsage();
    const memUsedMB = memUsage.heapUsed / 1024 / 1024;
    const memTotalMB = memUsage.heapTotal / 1024 / 1024;
    const memStatus = memUsedMB / memTotalMB > 0.9 ? 'error' : memUsedMB / memTotalMB > 0.7 ? 'warning' : 'ok';
    const jobStatus = this.usage.activeJobs > 10 || this.usage.pendingJobs > 100 ? 'error' : this.usage.activeJobs > 5 || this.usage.pendingJobs > 50 ? 'warning' : 'ok';
    const overallStatus = memStatus === 'error' || jobStatus === 'error' ? 'unhealthy' : memStatus === 'warning' || jobStatus === 'warning' ? 'degraded' : 'healthy';
    return { status: overallStatus, timestamp: Date.now(), uptime: process.uptime(), checks: {
      memory: { status: memStatus as 'ok' | 'warning' | 'error', used: memUsedMB, total: memTotalMB },
      jobs: { status: jobStatus as 'ok' | 'warning' | 'error', active: this.usage.activeJobs, pending: this.usage.pendingJobs },
    }};
  }
  }
}
    }
  }
}

export { DocsJSServer };
export default DocsJSServer;
