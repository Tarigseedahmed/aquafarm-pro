import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { PinoLoggerService } from '../logging/pino-logger.service';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CACHE_PREFIX_METADATA,
  CACHE_SERIALIZE_METADATA,
} from './cache.decorators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
    private logger: PinoLoggerService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Get cache metadata
    const cacheKey = this.reflector.getAllAndOverride<string>(CACHE_KEY_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!cacheKey) {
      return next.handle();
    }

    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]) || 3600;

    const prefix = this.reflector.getAllAndOverride<string>(CACHE_PREFIX_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    const serialize = this.reflector.getAllAndOverride<boolean>(CACHE_SERIALIZE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]) !== false;

    // Build dynamic cache key
    const dynamicKey = this.buildCacheKey(cacheKey, request);
    
    try {
      // Try to get from cache
      const cachedResult = await this.cacheService.get(dynamicKey, {
        ttl,
        prefix,
        serialize,
      });

      if (cachedResult !== null) {
        this.logger.debug(
          {
            event: 'cache.hit',
            key: dynamicKey,
            method: request.method,
            url: request.url,
          },
          'Cache hit',
        );
        return of(cachedResult);
      }

      this.logger.debug(
        {
          event: 'cache.miss',
          key: dynamicKey,
          method: request.method,
          url: request.url,
        },
        'Cache miss',
      );

      // Execute the method and cache the result
      return next.handle().pipe(
        tap(async (result) => {
          try {
            await this.cacheService.set(dynamicKey, result, {
              ttl,
              prefix,
              serialize,
            });
            
            this.logger.debug(
              {
                event: 'cache.set',
                key: dynamicKey,
                method: request.method,
                url: request.url,
              },
              'Result cached',
            );
          } catch (error) {
            this.logger.error(
              {
                event: 'cache.set.error',
                key: dynamicKey,
                error: error.message,
              },
              'Failed to cache result',
            );
          }
        }),
      );
    } catch (error) {
      this.logger.error(
        {
          event: 'cache.interceptor.error',
          key: dynamicKey,
          error: error.message,
        },
        'Cache interceptor error',
      );
      
      // Fall back to normal execution
      return next.handle();
    }
  }

  private buildCacheKey(template: string, request: any): string {
    let key = template;

    // Replace placeholders with actual values
    key = key.replace(/\{method\}/g, request.method);
    key = key.replace(/\{url\}/g, request.url);
    key = key.replace(/\{query\}/g, JSON.stringify(request.query || {}));
    key = key.replace(/\{body\}/g, JSON.stringify(request.body || {}));
    key = key.replace(/\{params\}/g, JSON.stringify(request.params || {}));
    
    // Add user context if available
    if (request.user?.id) {
      key = key.replace(/\{userId\}/g, request.user.id);
    }
    
    // Add tenant context if available
    if (request.tenantId) {
      key = key.replace(/\{tenantId\}/g, request.tenantId);
    }

    // Add IP address
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    key = key.replace(/\{ip\}/g, ip);

    return key;
  }
}

@Injectable()
export class CacheEvictInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
    private logger: PinoLoggerService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Get cache evict metadata
    const evictConfig = this.reflector.getAllAndOverride<{
      key?: string;
      prefix?: string;
      allEntries?: boolean;
      beforeInvocation?: boolean;
    }>('cache:evict', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!evictConfig) {
      return next.handle();
    }

    const { key, prefix, allEntries, beforeInvocation } = evictConfig;

    // Evict before invocation if specified
    if (beforeInvocation) {
      await this.evictCache(key, prefix, allEntries, request);
    }

    return next.handle().pipe(
      tap(async () => {
        // Evict after successful invocation
        if (!beforeInvocation) {
          await this.evictCache(key, prefix, allEntries, request);
        }
      }),
    );
  }

  private async evictCache(key: string, prefix?: string, allEntries?: boolean, request?: any): Promise<void> {
    try {
      if (allEntries) {
        // Clear all cache entries with prefix
        await this.cacheService.deletePattern('*', { prefix });
        
        this.logger.debug(
          {
            event: 'cache.evict.all',
            prefix,
          },
          'All cache entries evicted',
        );
      } else {
        // Build dynamic key
        const dynamicKey = this.buildCacheKey(key, request);
        
        // Delete specific key
        await this.cacheService.delete(dynamicKey, { prefix });
        
        this.logger.debug(
          {
            event: 'cache.evict.key',
            key: dynamicKey,
          },
          'Cache key evicted',
        );
      }
    } catch (error) {
      this.logger.error(
        {
          event: 'cache.evict.error',
          key,
          error: error.message,
        },
        'Failed to evict cache',
      );
    }
  }

  private buildCacheKey(template: string, request: any): string {
    let key = template;

    // Replace placeholders with actual values
    if (request) {
      key = key.replace(/\{method\}/g, request.method);
      key = key.replace(/\{url\}/g, request.url);
      key = key.replace(/\{query\}/g, JSON.stringify(request.query || {}));
      key = key.replace(/\{body\}/g, JSON.stringify(request.body || {}));
      key = key.replace(/\{params\}/g, JSON.stringify(request.params || {}));
      
      if (request.user?.id) {
        key = key.replace(/\{userId\}/g, request.user.id);
      }
      
      if (request.tenantId) {
        key = key.replace(/\{tenantId\}/g, request.tenantId);
      }
    }

    return key;
  }
}
