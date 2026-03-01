/**
 * Cloud Infrastructure Types
 * 
 * Type definitions for serverless, queues, CDN, and cloud deployment.
 */

/**
 * Serverless function configuration
 */
export interface ServerlessConfig {
  /** Function name */
  name: string;
  /** Memory size in MB */
  memorySize: number;
  /** Timeout in seconds */
  timeout: number;
  /** Maximum concurrent executions */
  maxConcurrent: number;
  /** Environment variables */
  env: Record<string, string>;
}

/**
 * Queue message
 */
export interface QueueMessage {
  /** Message ID */
  id: string;
  /** Message payload */
  payload: unknown;
  /** Priority (higher = more urgent) */
  priority: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Current retry count */
  retryCount: number;
  /** Visibility timeout in seconds */
  visibilityTimeout: number;
  /** Delay before visible in seconds */
  delaySeconds: number;
  /** Message attributes */
  attributes?: Record<string, string>;
  /** Timestamp */
  timestamp: number;
}

/**
 * Batch job
 */
export interface BatchJob {
  /** Job ID */
  id: string;
  /** Job type */
  type: 'convert' | 'transform' | 'render' | 'export';
  /** Job status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  /** Input files */
  inputFiles: string[];
  /** Output format */
  outputFormat: string;
  /** Progress percentage */
  progress: number;
  /** Result URL */
  resultUrl?: string;
  /** Error message */
  error?: string;
  /** Created at */
  createdAt: number;
  /** Started at */
  startedAt?: number;
  /** Completed at */
  completedAt?: number;
  /** Callback URL */
  callbackUrl?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Webhook event
 */
export type WebhookEventType = 
  | 'conversion.completed'
  | 'conversion.failed'
  | 'conversion.started'
  | 'batch.completed'
  | 'batch.failed'
  | 'batch.progress'
  | 'webhook.test';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: number;
  data: Record<string, unknown>;
  retryCount: number;
}

/**
 * CDN configuration
 */
export interface CDNConfig {
  /** CDN provider */
  provider: 'cloudfront' | 'cloudflare' | 'akamai' | 'custom';
  /** Distribution domain */
  domain: string;
  /** Cache rules */
  cacheRules: CacheRule[];
  /** SSL certificate ARN */
  sslCertArn?: string;
  /** Geo restrictions */
  geoRestrictions?: GeoRestriction;
}

/**
 * Cache rule
 */
export interface CacheRule {
  /** Path pattern */
  pathPattern: string;
  /** TTL in seconds */
  ttl: number;
  /** Cache control */
  cacheControl?: string;
  /** Enable compression */
  compress?: boolean;
}

/**
 * Geo restriction
 */
export interface GeoRestriction {
  /** Restriction type */
  type: 'none' | 'whitelist' | 'blacklist';
  /** Countries */
  countries: string[];
}

/**
 * API response time target
 */
export interface PerformanceTarget {
  /** 95th percentile latency in ms */
  p95LatencyMs: number;
  /** 99th percentile latency in ms */
  p99LatencyMs: number;
  /** Maximum concurrent connections */
  maxConcurrentConnections: number;
  /** Requests per second */
  requestsPerSecond: number;
}

/**
 * Conversion request
 */
export interface ConversionRequest {
  /** Request ID */
  requestId: string;
  /** Input format */
  inputFormat: string;
  /** Output format */
  outputFormat: string;
  /** Options */
  options?: Record<string, unknown>;
  /** Priority */
  priority?: number;
  /** Callback URL */
  callbackUrl?: string;
  /** Webhook URL */
  webhookUrl?: string;
}

/**
 * Conversion result
 */
export interface ConversionResult {
  /** Request ID */
  requestId: string;
  /** Success */
  success: boolean;
  /** Output URL */
  outputUrl?: string;
  /** Error message */
  error?: string;
  /** Processing time in ms */
  processingTimeMs: number;
  /** File size in bytes */
  fileSizeBytes: number;
}

/**
 * Rate limit config
 */
export interface RateLimitConfig {
  /** Requests per window */
  maxRequests: number;
  /** Window size in seconds */
  windowSizeSeconds: number;
  /** Burst size */
  burstSize: number;
}
