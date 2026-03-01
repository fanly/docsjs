/**
 * Storage Module
 * 
 * Provides Redis and PostgreSQL storage support for production deployment.
 */

export interface StorageConfig {
  type: 'memory' | 'redis' | 'postgres';
  redis?: RedisConfig;
  postgres?: PostgresConfig;
}

export interface RedisConfig {
  url: string;
  keyPrefix?: string;
  ttl?: number;
}

export interface PostgresConfig {
  connectionString: string;
  ssl?: boolean;
  poolSize?: number;
}

// In-memory storage (fallback)
class MemoryStorage {
  private store = new Map<string, { value: unknown; expiry?: number }>();

  async get(key: string): Promise<unknown | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiry: ttl ? Date.now() + ttl : undefined
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// Redis storage
class RedisStorage {
  private redis: any;
  private keyPrefix: string;
  private ttl: number;

  constructor(config: RedisConfig) {
    this.keyPrefix = config.keyPrefix || 'docsjs:';
    this.ttl = config.ttl || 3600;
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get(key: string): Promise<unknown | null> {
    try {
      const value = await this.redis.get(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.set(this.getKey(key), serialized, 'EX', ttl || this.ttl);
    } catch {
      // Fallback silently
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch {
      // Fallback silently
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch {
      // Fallback silently
    }
  }
}

// PostgreSQL storage
class PostgresStorage {
  private pool: any;

  async get(key: string): Promise<unknown | null> {
    try {
      const result = await this.pool.query(
        'SELECT value FROM docsjs_storage WHERE key = $1 AND (expiry IS NULL OR expiry > NOW())',
        [key]
      );
      return result.rows[0]?.value ? JSON.parse(result.rows[0].value) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const expiry = ttl ? new Date(Date.now() + ttl) : null;
      await this.pool.query(
        `INSERT INTO docsjs_storage (key, value, expiry) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (key) DO UPDATE SET value = $2, expiry = $3`,
        [key, JSON.stringify(value), expiry]
      );
    } catch {
      // Fallback silently
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.pool.query('DELETE FROM docsjs_storage WHERE key = $1', [key]);
    } catch {
      // Fallback silently
    }
  }

  async clear(): Promise<void> {
    try {
      await this.pool.query('DELETE FROM docsjs_storage');
    } catch {
      // Fallback silently
    }
  }
}

export interface Storage {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export function createStorage(config: StorageConfig): Storage {
  switch (config.type) {
    case 'redis':
      return new RedisStorage(config.redis!);
    case 'postgres':
      return new PostgresStorage();
    default:
      return new MemoryStorage();
  }
}

export { MemoryStorage, RedisStorage, PostgresStorage };
