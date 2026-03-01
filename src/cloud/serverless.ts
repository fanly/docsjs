/**
 * Serverless Function Handlers
 * 
 * Serverless API endpoints for document transformation.
 */

import type { ConversionRequest, ConversionResult, PerformanceTarget } from './types';

/**
 * Serverless function context
 */
export interface ServerlessContext {
  /** Request ID */
  requestId: string;
  /** Function name */
  functionName: string;
  /** Function version */
  functionVersion: string;
  /** Memory limit in MB */
  memoryLimit: number;
  /** Time limit in ms */
  timeLimit: number;
  /** Environment */
  env: Record<string, string>;
}

/**
 * Serverless handler result
 */
export interface HandlerResult<T = unknown> {
  /** Status code */
  statusCode: number;
  /** Response body */
  body: T;
  /** Headers */
  headers?: Record<string, string>;
  /** Error */
  error?: string;
}

/**
 * Document transformation handler
 */
export class DocumentTransformationHandler {
  private engine: DocumentTransformationEngine;
  private performance: PerformanceTracker;

  constructor(engine: DocumentTransformationEngine) {
    this.engine = engine;
    this.performance = new PerformanceTracker();
  }

  /**
   * Handle conversion request
   */
  async handle(
    request: ConversionRequest,
    context: ServerlessContext
  ): Promise<HandlerResult<ConversionResult>> {
    const startTime = Date.now();

    try {
      // Validate request
      if (!request.inputFormat || !request.outputFormat) {
        return {
          statusCode: 400,
          body: {
            requestId: request.requestId,
            success: false,
            error: 'Missing inputFormat or outputFormat',
            processingTimeMs: Date.now() - startTime,
            fileSizeBytes: 0
          }
        };
      }

      // Process document
      const result = await this.engine.transform({
        input: request.requestId,
        inputFormat: request.inputFormat,
        outputFormat: request.outputFormat,
        options: request.options
      });

      const processingTime = Date.now() - startTime;

      // Track performance
      this.performance.record({
        latencyMs: processingTime,
        success: true
      });

      // If callback URL specified, queue async result
      if (request.callbackUrl) {
        this.queueCallback(request, result, processingTime);
        return {
          statusCode: 202,
          body: {
            requestId: request.requestId,
            success: true,
            outputUrl: `/results/${request.requestId}`,
            processingTimeMs: processingTime,
            fileSizeBytes: result.size || 0
          }
        };
      }

      return {
        statusCode: 200,
        body: {
          requestId: request.requestId,
          success: true,
          outputUrl: result.url,
          processingTimeMs: processingTime,
          fileSizeBytes: result.size || 0
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.performance.record({
        latencyMs: processingTime,
        success: false
      });

      return {
        statusCode: 500,
        body: {
          requestId: request.requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTimeMs: processingTime,
          fileSizeBytes: 0
        }
      };
    }
  }

  /**
   * Handle health check
   */
  handleHealthCheck(): HandlerResult<HealthCheckResult> {
    const stats = this.performance.getStats();
    
    return {
      statusCode: stats.healthy ? 200 : 503,
      body: {
        healthy: stats.healthy,
        timestamp: Date.now(),
        averageLatencyMs: stats.averageLatencyMs,
        errorRate: stats.errorRate,
        requestsPerMinute: stats.requestsPerMinute
      }
    };
  }

  /**
   * Handle webhook test
   */
  async handleWebhookTest(
    webhookUrl: string
  ): Promise<HandlerResult<WebhookTestResult>> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webhook.test',
          timestamp: Date.now(),
          message: 'Webhook test from DocsJS'
        })
      });

      return {
        statusCode: response.ok ? 200 : response.status,
        body: {
          success: response.ok,
          statusCode: response.status,
          responseTimeMs: 0
        }
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: {
          success: false,
          statusCode: 0,
          error: error instanceof Error ? error.message : 'Network error'
        }
      };
    }
  }

  private async queueCallback(
    request: ConversionRequest,
    result: TransformResult,
    processingTime: number
  ): Promise<void> {
    if (!request.callbackUrl) return;

    // In production, would queue to a message queue
    console.log(`Queuing callback for request ${request.requestId}`);
  }
}

/**
 * Document transformation engine interface
 */
export interface DocumentTransformationEngine {
  transform(options: TransformOptions): Promise<TransformResult>;
}

export interface TransformOptions {
  input: string;
  inputFormat: string;
  outputFormat: string;
  options?: Record<string, unknown>;
}

export interface TransformResult {
  url?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

interface HealthCheckResult {
  healthy: boolean;
  timestamp: number;
  averageLatencyMs: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface WebhookTestResult {
  success: boolean;
  statusCode: number;
  responseTimeMs: number;
  error?: string;
}

/**
 * Performance tracker
 */
class PerformanceTracker {
  private samples: PerformanceSample[] = [];
  private readonly maxSamples = 1000;
  private readonly windowMs = 60000; // 1 minute

  record(sample: PerformanceSample): void {
    this.samples.push({
      ...sample,
      timestamp: Date.now()
    });

    // Trim old samples
    const cutoff = Date.now() - this.windowMs;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);

    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }

  getStats(): {
    healthy: boolean;
    averageLatencyMs: number;
    errorRate: number;
    requestsPerMinute: number;
  } {
    if (this.samples.length === 0) {
      return {
        healthy: true,
        averageLatencyMs: 0,
        errorRate: 0,
        requestsPerMinute: 0
      };
    }

    const total = this.samples.length;
    const errors = this.samples.filter(s => !s.success).length;
    const totalLatency = this.samples.reduce((sum, s) => sum + s.latencyMs, 0);

    return {
      healthy: true, // Could add threshold checks
      averageLatencyMs: Math.round(totalLatency / total),
      errorRate: errors / total,
      requestsPerMinute: total
    };
  }
}

interface PerformanceSample {
  latencyMs: number;
  success: boolean;
  timestamp: number;
}

/**
 * Create AWS Lambda handler
 */
export function createLambdaHandler(
  engine: DocumentTransformationEngine
): (event: unknown, context: ServerlessContext) => Promise<HandlerResult> {
  const handler = new DocumentTransformationHandler(engine);

  return async (event, context) => {
    const request = event as ConversionRequest;
    return handler.handle(request, context);
  };
}

/**
 * Create Vercel API handler
 */
export function createVercelHandler(
  engine: DocumentTransformationEngine
): (req: unknown, res: unknown) => Promise<void> {
  const handler = new DocumentTransformationHandler(engine);

  return async (req: any, res: any) => {
    if (req.method === 'GET' && req.url === '/health') {
      const result = handler.handleHealthCheck();
      res.status(result.statusCode).json(result.body);
      return;
    }

    if (req.method === 'POST' && req.url === '/convert') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      
      const request = JSON.parse(body) as ConversionRequest;
      const result = await handler.handle(request, {
        requestId: request.requestId || `req_${Date.now()}`,
        functionName: 'docsjs-convert',
        functionVersion: '1.0',
        memoryLimit: 1024,
        timeLimit: 30000,
        env: process.env
      });

      res.status(result.statusCode).json(result.body);
      return;
    }

    res.status(404).json({ error: 'Not found' });
  };
}

/**
 * Create Netlify Function handler
 */
export function createNetlifyHandler(
  engine: DocumentTransformationEngine
): (event: any) => Promise<any> {
  const handler = new DocumentTransformationHandler(engine);

  return async (event) => {
    const path = event.path;
    const method = event.httpMethod;

    if (method === 'GET' && path === '/health') {
      const result = handler.handleHealthCheck();
      return {
        statusCode: result.statusCode,
        body: JSON.stringify(result.body)
      };
    }

    if (method === 'POST' && path === '/convert') {
      const request = JSON.parse(event.body) as ConversionRequest;
      const result = await handler.handle(request, {
        requestId: request.requestId || `req_${Date.now()}`,
        functionName: 'docsjs-convert',
        functionVersion: '1.0',
        memoryLimit: 1024,
        timeLimit: 30000,
        env: process.env
      });

      return {
        statusCode: result.statusCode,
        body: JSON.stringify(result.body)
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    };
  };
}
