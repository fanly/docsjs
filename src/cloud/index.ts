/**
 * Cloud Infrastructure
 * 
 * Serverless, queue, CDN, and webhook support for cloud deployments.
 */

// Types
export type {
  ServerlessConfig,
  QueueMessage,
  BatchJob,
  WebhookEvent,
  WebhookEventType,
  CDNConfig,
  CacheRule,
  GeoRestriction,
  PerformanceTarget,
  ConversionRequest,
  ConversionResult,
  RateLimitConfig
} from './types';

// Queue system
export { DistributedQueue, BatchProcessor } from './queue';

// Serverless
export {
  DocumentTransformationHandler,
  createLambdaHandler,
  createVercelHandler,
  createNetlifyHandler
} from './serverless';

// CDN
export {
  CDNManager,
  CloudFrontProvider,
  CloudflareProvider,
  EdgeCache
} from './cdn';

// Webhooks
export { WebhookManager, WebhookRegistration, createWebhookEvent } from './webhooks';
