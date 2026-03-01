/**
 * Webhook System
 * 
 * Event-driven webhook support for conversion completion and other events.
 */

import type { WebhookEvent } from './types';

/**
 * Webhook registration
 */
export interface WebhookRegistration {
  /** Webhook ID */
  id: string;
  /** URL to send events to */
  url: string;
  /** Event types to subscribe to */
  events: WebhookEventType[];
  /** Secret for signature verification */
  secret?: string;
  /** Whether webhook is active */
  active: boolean;
  /** Created at timestamp */
  createdAt: number;
  /** Last triggered at */
  lastTriggeredAt?: number;
  /** Trigger count */
  triggerCount: number;
  /** Failure count */
  failureCount: number;
}

/**
 * Webhook event types
 */
export type WebhookEventType = 
  | 'conversion.completed'
  | 'conversion.failed'
  | 'conversion.started'
  | 'batch.completed'
  | 'batch.failed'
  | 'batch.progress'
  | 'webhook.test';

/**
 * Webhook delivery result
 */
export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
  durationMs: number;
  retryCount: number;
}

/**
 * Webhook manager
 */
export class WebhookManager {
  private webhooks: Map<string, WebhookRegistration> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private deliveryInProgress: Set<string> = new Set();
  private config: WebhookConfig;

  constructor(config: Partial<WebhookConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000,
      batchSize: 10,
      ...config
    };

    // Start processing queue
    this.startQueueProcessor();
  }

  /**
   * Register a webhook
   */
  async register(
    url: string,
    events: WebhookEventType[],
    secret?: string
  ): Promise<WebhookRegistration> {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid webhook URL');
    }

    const registration: WebhookRegistration = {
      id: this.generateId(),
      url,
      events,
      secret,
      active: true,
      createdAt: Date.now(),
      triggerCount: 0,
      failureCount: 0
    };

    this.webhooks.set(registration.id, registration);
    return registration;
  }

  /**
   * Unregister a webhook
   */
  unregister(webhookId: string): boolean {
    return this.webhooks.delete(webhookId);
  }

  /**
   * Update webhook
   */
  update(
    webhookId: string,
    updates: Partial<Pick<WebhookRegistration, 'url' | 'events' | 'active'>>
  ): WebhookRegistration | undefined {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return undefined;

    Object.assign(webhook, updates);
    return webhook;
  }

  /**
   * Get webhook
   */
  get(webhookId: string): WebhookRegistration | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * List webhooks
   */
  list(eventType?: WebhookEventType): WebhookRegistration[] {
    let webhooks = Array.from(this.webhooks.values());
    
    if (eventType) {
      webhooks = webhooks.filter(w => 
        w.active && w.events.includes(eventType)
      );
    }

    return webhooks;
  }

  /**
   * Trigger webhook(s) for an event
   */
  async trigger(event: WebhookEvent): Promise<void> {
    // Add to queue
    this.eventQueue.push(event);
  }

  /**
   * Test webhook
   */
  async test(webhookId: string): Promise<WebhookDeliveryResult> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return {
        success: false,
        error: 'Webhook not found',
        durationMs: 0,
        retryCount: 0
      };
    }

    return this.deliver(webhook, {
      id: `test_${Date.now()}`,
      type: 'webhook.test',
      timestamp: Date.now(),
      data: { message: 'Test webhook from DocsJS' },
      retryCount: 0
    });
  }

  /**
   * Process event queue
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      await this.processQueue();
    }, 1000);
  }

  private async processQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.splice(0, this.config.batchSize);

    for (const event of events) {
      const webhooks = this.list(event.type as WebhookEventType);
      
      for (const webhook of webhooks) {
        if (this.deliveryInProgress.has(webhook.id)) continue;
        
        this.deliveryInProgress.add(webhook.id);
        this.deliver(webhook, event).finally(() => {
          this.deliveryInProgress.delete(webhook.id);
        });
      }
    }
  }

  /**
   * Deliver event to webhook
   */
  private async deliver(
    webhook: WebhookRegistration,
    event: WebhookEvent
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    let lastError: string | undefined;

    // Build payload
    const payload = JSON.stringify({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      data: event.data
    });

    // Generate signature if secret provided
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event.type,
      'X-Webhook-Id': webhook.id
    };

    if (webhook.secret) {
      headers['X-Webhook-Signature'] = this.generateSignature(payload, webhook.secret);
    }

    // Attempt delivery with retries
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: payload,
          signal: controller.signal
        });

        clearTimeout(timeout);

        const result: WebhookDeliveryResult = {
          success: response.ok,
          statusCode: response.status,
          response: await response.text(),
          durationMs: Date.now() - startTime,
          retryCount: attempt
        };

        // Update webhook stats
        webhook.lastTriggeredAt = Date.now();
        webhook.triggerCount++;
        if (!response.ok) {
          webhook.failureCount++;
        }

        if (response.ok) {
          return result;
        }

        lastError = `HTTP ${response.status}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Wait before retry
      if (attempt < this.config.maxRetries) {
        await this.sleep(this.config.retryDelayMs * (attempt + 1));
      }
    }

    webhook.failureCount++;

    return {
      success: false,
      error: lastError,
      durationMs: Date.now() - startTime,
      retryCount: this.config.maxRetries
    };
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: string, secret: string): string {
    // Simplified - use crypto in production
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + secret);
    return btoa(String.fromCharCode(...new Uint8Array(data)));
  }

  /**
   * Get webhook stats
   */
  getStats(): WebhookStats {
    const webhooks = Array.from(this.webhooks.values());
    const totalTriggers = webhooks.reduce((sum, w) => sum + w.triggerCount, 0);
    const totalFailures = webhooks.reduce((sum, w) => sum + w.failureCount, 0);

    return {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter(w => w.active).length,
      totalTriggers,
      totalFailures,
      failureRate: totalTriggers > 0 ? totalFailures / totalTriggers : 0,
      queueLength: this.eventQueue.length
    };
  }

  private generateId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface WebhookConfig {
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  batchSize: number;
}

interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalTriggers: number;
  totalFailures: number;
  failureRate: number;
  queueLength: number;
}

/**
 * Create webhook event
 */
export function createWebhookEvent(
  type: WebhookEventType,
  data: Record<string, unknown>
): WebhookEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    data,
    retryCount: 0
  };
}
