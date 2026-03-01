import type { TransformationProfile } from '../types/engine';

export interface PerformanceMetrics {
  parseTimeMs: number;
  transformTimeMs: number;
  renderTimeMs: number;
  totalTimeMs: number;
  memoryUsageMB?: number;
}

export interface DiagnosticEntry {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  location?: { line: number; column: number };
}

export interface TransformResult {
  output: string;
  outputFormat: string;
  diagnostics?: { errors?: DiagnosticEntry[]; warnings?: DiagnosticEntry[]; stats?: PerformanceMetrics };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: number;
  processingTimeMs?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ConvertRequest {
  inputFormat?: 'docx' | 'html' | 'markdown';
  outputFormat: 'html' | 'markdown' | 'json';
  profile?: string;
  report?: boolean;
  file?: string;
  options?: ConvertOptions;
}

export interface ConvertOptions {
  preserveStyles?: boolean;
  plugins?: boolean;
  customProfile?: Partial<TransformationProfile>;
  async?: boolean;
  callbackUrl?: string;
}

export interface ConvertResponse extends ApiResponse<ConvertResultData> {}

export interface ConvertResultData {
  output: string;
  outputFormat: string;
  inputFilename?: string;
  profile: string;
  metrics?: PerformanceMetrics;
  diagnostics?: DiagnosticEntry[];
  jobId?: string;
  status?: 'completed' | 'pending' | 'processing';
}

export interface BatchConvertRequest {
  files: BatchFileItem[];
  outputFormat: 'html' | 'markdown' | 'json';
  profile?: string;
  async?: boolean;
}

export interface BatchFileItem {
  filename: string;
  content: string;
}

export interface BatchConvertResponse extends ApiResponse<BatchConvertResultData> {}

export interface BatchConvertResultData {
  jobId: string;
  total: number;
  completed: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  results?: BatchItemResult[];
}

export interface BatchItemResult {
  filename: string;
  success: boolean;
  output?: string;
  error?: string;
  metrics?: PerformanceMetrics;
}

export interface CreateJobRequest {
  type: 'convert' | 'batch';
  payload: ConvertRequest | BatchConvertRequest;
  priority?: number;
  callbackUrl?: string;
}

export interface JobResponse extends ApiResponse<JobData> {}

export interface JobData {
  id: string;
  type: 'convert' | 'batch';
  status: JobStatus;
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: ConvertResultData | BatchConvertResultData;
  error?: ApiError;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface JobListResponse extends PaginatedResponse<JobData[]> {}

export interface UsageResponse extends ApiResponse<UsageStats> {}

export interface UsageStats {
  conversionsToday: number;
  conversionsThisMonth: number;
  bytesProcessedToday: number;
  avgProcessingTimeMs: number;
  successRate: number;
  activeJobs: number;
  pendingJobs: number;
}

export interface ServerConfig {
  port: number;
  host?: string;
  apiPrefix?: string;
  cors?: boolean;
  rateLimit?: RateLimitConfig;
  bodyLimit?: string;
  logging?: boolean;
  timeout?: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export const DEFAULT_SERVER_CONFIG: Partial<ServerConfig> = {
  port: 3000,
  host: '0.0.0.0',
  apiPrefix: '/api/v1',
  cors: true,
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100,
  },
  bodyLimit: '10mb',
  logging: true,
  timeout: 30000,
};

export type WebhookEventType = 
  | 'conversion.started'
  | 'conversion.completed'
  | 'conversion.failed'
  | 'batch.started'
  | 'batch.completed'
  | 'batch.failed'
  | 'job.completed'
  | 'job.failed';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: number;
  requestId: string;
  data: unknown;
}

export interface WebhookRegistration {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret?: string;
  enabled: boolean;
}
