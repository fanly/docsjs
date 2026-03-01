/**
 * Rate Limiter Module
 * 
 * Provides rate limiting for API endpoints.
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

export interface KeyGenerator {
  (req: { ip?: string; headers?: Record<string, string> }): string;
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getResetTime(): number {
    const tokensNeeded = this.maxTokens - this.tokens;
    return Date.now() + (tokensNeeded / this.refillRate) * 1000;
  }
}

export class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private config: RateLimitConfig;
  private keyGenerator: KeyGenerator;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig, keyGenerator?: KeyGenerator) {
    this.config = config;
    this.keyGenerator = keyGenerator || ((req) => req.ip || 'default');
    
    // Cleanup old buckets every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets) {
        if (bucket.getResetTime() < now - config.windowMs) {
          this.buckets.delete(key);
        }
      }
    }, 300000);
  }

  async check(req: { ip?: string; headers?: Record<string, string> }): Promise<RateLimitResult> {
    const key = this.keyGenerator(req);
    let bucket = this.buckets.get(key);
    
    if (!bucket) {
      const maxTokens = this.config.maxRequests;
      const refillRate = maxTokens / (this.config.windowMs / 1000);
      bucket = new TokenBucket(maxTokens, refillRate);
      this.buckets.set(key, bucket);
    }

    const success = bucket.tryConsume();
    const remaining = bucket.getRemaining();
    const resetTime = bucket.getResetTime();

    return {
      success,
      remaining: Math.max(0, remaining),
      resetTime,
      message: success ? undefined : this.config.message || 'Rate limit exceeded'
    };
  }

  async middleware(req: { ip?: string; headers?: Record<string, string> }, res: {
    setHeader(name: string, value: string): void;
    status(code: number): { json(data: unknown): void };
  }): Promise<boolean> {
    const result = await this.check(req);
    
    res.setHeader('X-RateLimit-Limit', String(this.config.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

    if (!result.success) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: result.message || 'Too many requests'
        }
      });
      return false;
    }

    return true;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.clear();
  }
}

// Express/Node.js HTTP middleware wrapper
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);
  
  return async function rateLimitMiddleware(req: any, res: any, next: Function) {
    const allowed = await limiter.middleware(req, res);
    if (allowed) {
      next();
    }
  };
}

export { TokenBucket };
