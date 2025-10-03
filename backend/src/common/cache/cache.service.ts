import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  serialize?: boolean; // Whether to serialize/deserialize data
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  constructor(
    private redisService: RedisService,
    private pinoLogger: PinoLoggerService,
  ) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const value = await this.redisService.get(fullKey);
      
      if (value === null) {
        this.stats.misses++;
        this.logger.debug(`Cache miss for key: ${fullKey}`);
        return null;
      }

      this.stats.hits++;
      this.logger.debug(`Cache hit for key: ${fullKey}`);
      
      if (options.serialize !== false) {
        return JSON.parse(value);
      }
      
      return value as T;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      let serializedValue: string;

      if (options.serialize !== false) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = value as string;
      }

      const result = await this.redisService.setex(
        fullKey,
        options.ttl || 3600, // Default 1 hour
        serializedValue,
      );

      this.stats.sets++;
      this.logger.debug(`Cache set for key: ${fullKey}`);
      
      return result === 'OK';
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redisService.del(fullKey);
      
      this.stats.deletes++;
      this.logger.debug(`Cache delete for key: ${fullKey}`);
      
      return result !== null && result > 0;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys with pattern
   */
  async deletePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern, options.prefix);
      const keys = await this.redisService.keys(fullPattern);
      
      if (!keys || keys.length === 0) {
        return 0;
      }

      const result = await this.redisService.del(...keys);
      
      if (result === null) {
        return 0;
      }

      this.stats.deletes += result;
      this.logger.debug(`Cache delete pattern: ${fullPattern}, deleted ${result} keys`);
      
      return result;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redisService.exists(fullKey);
      
      if (result === null) {
        return false;
      }
      
      return result;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - get from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Increment numeric value
   */
  async increment(key: string, by: number = 1, options: CacheOptions = {}): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redisService.incrby(fullKey, by);
      
      if (result === null) {
        return 0;
      }

      // Set TTL if specified
      if (options.ttl) {
        await this.redisService.expire(fullKey, options.ttl);
      }
      
      return result;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redisService.expire(fullKey, ttl);
      
      return Boolean(result);
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redisService.ttl(fullKey);
      return result !== null ? result : -1;
    } catch (error) {
      this.stats.errors++;
      this.logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Get cache hit ratio
   */
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redisService.ping();
      return true;
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return false;
    }
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string, prefix?: string): string {
    const basePrefix = 'aquafarm:';
    // Enforce tenant prefix if available from request context
    let tenantPrefix = '';
    try {
      const { RequestContext } = require('../context/request-context');
      const ctx = RequestContext.get?.();
      if (ctx?.tenantId) {
        tenantPrefix = `tenant:${ctx.tenantId}:`;
      }
    } catch {}
    const keyPrefix = prefix ? `${basePrefix}${tenantPrefix}${prefix}:` : `${basePrefix}${tenantPrefix}`;
    return `${keyPrefix}${key}`;
  }
}
