/**
 * CDN Delivery Infrastructure
 * 
 * CDN configuration and delivery optimization for transformation engine.
 */

import type { CDNConfig, CacheRule, GeoRestriction } from './types';

/**
 * CDN Provider interface
 */
export interface CDNProvider {
  /** Create distribution */
  createDistribution(config: CDNConfig): Promise<string>;
  /** Invalidate cache */
  invalidate(distributionId: string, paths: string[]): Promise<void>;
  /** Get distribution status */
  getStatus(distributionId: string): Promise<DistributionStatus>;
  /** Delete distribution */
  deleteDistribution(distributionId: string): Promise<void>;
}

/**
 * Distribution status
 */
export interface DistributionStatus {
  id: string;
  domain: string;
  status: 'creating' | 'deployed' | 'disabled';
  lastModified: number;
  enabled: boolean;
}

/**
 * CloudFront CDN Provider
 */
export class CloudFrontProvider implements CDNProvider {
  private credentials: AWSCloudFrontCredentials;

  constructor(credentials: AWSCloudFrontCredentials) {
    this.credentials = credentials;
  }

  async createDistribution(config: CDNConfig): Promise<string> {
    // In production, would call AWS CloudFront API
    console.log('Creating CloudFront distribution:', config.domain);
    return `dist_${Date.now()}`;
  }

  async invalidate(distributionId: string, paths: string[]): Promise<void> {
    console.log(`Invalidating ${paths.length} paths on ${distributionId}`);
  }

  async getStatus(distributionId: string): Promise<DistributionStatus> {
    return {
      id: distributionId,
      domain: `${distributionId}.cloudfront.net`,
      status: 'deployed',
      lastModified: Date.now(),
      enabled: true
    };
  }

  async deleteDistribution(distributionId: string): Promise<void> {
    console.log(`Deleting distribution ${distributionId}`);
  }
}

/**
 * Cloudflare CDN Provider
 */
export class CloudflareProvider implements CDNProvider {
  private zoneId: string;
  private apiToken: string;

  constructor(zoneId: string, apiToken: string) {
    this.zoneId = zoneId;
    this.apiToken = apiToken;
  }

  async createDistribution(config: CDNConfig): Promise<string> {
    console.log('Creating Cloudflare zone:', config.domain);
    return `zone_${Date.now()}`;
  }

  async invalidate(distributionId: string, paths: string[]): Promise<void> {
    console.log(`Purging ${paths.length} URLs on Cloudflare`);
  }

  async getStatus(distributionId: string): Promise<DistributionStatus> {
    return {
      id: distributionId,
      domain: this.zoneId,
      status: 'deployed',
      lastModified: Date.now(),
      enabled: true
    };
  }

  async deleteDistribution(distributionId: string): Promise<void> {
    console.log(`Deleting Cloudflare zone ${distributionId}`);
  }
}

/**
 * CDN Manager
 */
export class CDNManager {
  private provider: CDNProvider;
  private distributions: Map<string, CDNConfig> = new Map();

  constructor(provider: CDNProvider) {
    this.provider = provider;
  }

  /**
   * Create a new CDN distribution
   */
  async createDistribution(
    config: CDNConfig
  ): Promise<DistributionStatus> {
    const distId = await this.provider.createDistribution(config);
    this.distributions.set(distId, config);
    return this.provider.getStatus(distId);
  }

  /**
   * Invalidate cache for paths
   */
  async invalidateCache(
    distributionId: string,
    paths: string[]
  ): Promise<void> {
    await this.provider.invalidate(distributionId, paths);
  }

  /**
   * Invalidate all cache
   */
  async invalidateAll(distributionId: string): Promise<void> {
    await this.provider.invalidate(distributionId, ['/*']);
  }

  /**
   * Get distribution status
   */
  async getDistributionStatus(
    distributionId: string
  ): Promise<DistributionStatus | undefined> {
    const config = this.distributions.get(distributionId);
    if (!config) return undefined;
    return this.provider.getStatus(distributionId);
  }

  /**
   * Generate signed URL
   */
  generateSignedUrl(
    distributionId: string,
    path: string,
    expiresIn: number
  ): string {
    const config = this.distributions.get(distributionId);
    if (!config) {
      throw new Error(`Distribution ${distributionId} not found`);
    }

    const expires = Date.now() + expiresIn * 1000;
    // In production, would generate proper signed URL with cloud provider
    return `https://${config.domain}${path}?expires=${expires}&signature=${this.generateSignature(path, expires)}`;
  }

  /**
   * Generate signed cookie
   */
  generateSignedCookie(
    distributionId: string,
    path: string,
    expiresIn: number
  ): Record<string, string> {
    const expires = Date.now() + expiresIn * 1000;
    const signature = this.generateSignature(path, expires);

    return {
      'CloudFront-Expires': String(expires),
      'CloudFront-Signature': signature,
      'CloudFront-Key-Pair-Id': 'key-pair-id'
    };
  }

  /**
   * Get default cache rules for document transformation
   */
  static getDefaultCacheRules(): CacheRule[] {
    return [
      {
        pathPattern: '/results/*',
        ttl: 86400, // 24 hours
        cacheControl: 'public, max-age=86400'
      },
      {
        pathPattern: '/assets/*',
        ttl: 31536000, // 1 year
        cacheControl: 'public, max-age=31536000, immutable'
      },
      {
        pathPattern: '/api/*',
        ttl: 0,
        cacheControl: 'no-cache'
      }
    ];
  }

  /**
   * Create CloudFront configuration
   */
  static createCloudFrontConfig(
    domain: string,
    origin: string
  ): CDNConfig {
    return {
      provider: 'cloudfront',
      domain,
      cacheRules: CDNManager.getDefaultCacheRules()
    };
  }

  private generateSignature(path: string, expires: number): string {
    // Simplified signature - in production use proper HMAC
    return Buffer.from(`${path}:${expires}:secret`).toString('base64');
  }
}

/**
 * Edge caching middleware
 */
export class EdgeCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: EdgeCacheConfig;

  constructor(config: Partial<EdgeCacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 3600,
      ...config
    };
  }

  /**
   * Get cached response
   */
  get(key: string): CachedResponse | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    entry.hits++;
    return entry.response;
  }

  /**
   * Set cached response
   */
  set(
    key: string,
    response: CachedResponse,
    ttl?: number
  ): void {
    if (this.cache.size >= this.config.maxSize) {
      // Evict least recently used
      this.evictLRU();
    }

    this.cache.set(key, {
      response,
      expiresAt: Date.now() + (ttl ?? this.config.defaultTTL) * 1000,
      createdAt: Date.now(),
      hits: 0
    });
  }

  /**
   * Invalidate cache entries
   */
  invalidate(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get cache stats
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: entries.length > 0 ? totalHits / entries.length : 0,
      totalHits
    };
  }

  private evictLRU(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldest = key;
      }
    }

    if (oldest) {
      this.cache.delete(oldest);
    }
  }
}

interface CacheEntry {
  response: CachedResponse;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface EdgeCacheConfig {
  maxSize: number;
  defaultTTL: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  totalHits: number;
}

interface AWSCloudFrontCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}
