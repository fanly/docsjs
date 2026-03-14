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
  RateLimitConfig,
} from "./types";

// Queue system
export { DistributedQueue, BatchProcessor } from "./queue";

// Serverless
export {
  DocumentTransformationHandler,
  createLambdaHandler,
  createVercelHandler,
  createNetlifyHandler,
} from "./serverless";

// CDN
export { CDNManager, CloudFrontProvider, CloudflareProvider, EdgeCache } from "./cdn";

// Webhooks
// WebhookRegistration is a type-only export (interface) and cannot be emitted at runtime.
// Importers should use it as a type, not as a value. Hence, split exports into a value export and a type export.
export { WebhookManager, createWebhookEvent } from "./webhooks";
export type { WebhookRegistration } from "./webhooks";
