import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, TokenBucket } from '../src/ratelimit';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 10,
      message: 'Rate limit exceeded'
    });
  });

  describe('TokenBucket', () => {
    it('should allow requests up to limit', () => {
      const bucket = new TokenBucket(5, 5);
      expect(bucket.tryConsume()).toBe(true);
      expect(bucket.tryConsume()).toBe(true);
      expect(bucket.tryConsume()).toBe(true);
      expect(bucket.tryConsume()).toBe(true);
      expect(bucket.tryConsume()).toBe(true);
    });

    it('should reject requests over limit', () => {
      const bucket = new TokenBucket(2, 2);
      expect(bucket.tryConsume()).toBe(true);
      expect(bucket.tryConsume()).toBe(true);
      expect(bucket.tryConsume()).toBe(false);
    });

    it('should track remaining tokens', () => {
      const bucket = new TokenBucket(5, 5);
      bucket.tryConsume();
      bucket.tryConsume();
      expect(bucket.getRemaining()).toBe(3);
    });
  });

  describe('check', () => {
    it('should allow requests within limit', async () => {
      const result = await limiter.check({ ip: 'test-ip' });
      expect(result.success).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should track different IPs separately', async () => {
      await limiter.check({ ip: 'ip-1' });
      await limiter.check({ ip: 'ip-1' });
      
      const result1 = await limiter.check({ ip: 'ip-1' });
      const result2 = await limiter.check({ ip: 'ip-2' });
      
      expect(result1.remaining).toBeLessThan(result2.remaining);
    });
  });

  describe('middleware', () => {
    it('should call next on success', async () => {
      const req = { ip: 'test' };
      const res: any = {
        setHeader: () => {},
        status: () => ({ json: () => {} })
      };
      const next = () => {};
      
      const allowed = await limiter.middleware(req, res, next);
      expect(allowed).toBe(true);
    });

    it('should set rate limit headers', async () => {
      const req = { ip: 'test' };
      const headers: Record<string, string> = {};
      const res: any = {
        setHeader: (name: string, value: string) => { headers[name] = value; },
        status: () => ({ json: () => {} })
      };
      
      await limiter.middleware(req, res, () => {});
      
      expect(headers['X-RateLimit-Limit']).toBeDefined();
      expect(headers['X-RateLimit-Remaining']).toBeDefined();
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('should clean up buckets', async () => {
      await limiter.check({ ip: 'test' });
      limiter.destroy();
      // Should not throw
    });
  });
});
