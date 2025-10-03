import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_PREFIX_METADATA = 'cache:prefix';
export const CACHE_SERIALIZE_METADATA = 'cache:serialize';

/**
 * Cache decorator for methods
 */
export function Cacheable(
  key: string,
  ttl: number = 3600,
  options: {
    prefix?: string;
    serialize?: boolean;
  } = {},
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyName, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyName, descriptor);
    SetMetadata(CACHE_PREFIX_METADATA, options.prefix)(target, propertyName, descriptor);
    SetMetadata(CACHE_SERIALIZE_METADATA, options.serialize !== false)(target, propertyName, descriptor);
    
    return descriptor;
  };
}

/**
 * Cache eviction decorator
 */
export function CacheEvict(
  key: string,
  options: {
    prefix?: string;
    allEntries?: boolean;
    beforeInvocation?: boolean;
  } = {},
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    SetMetadata('cache:evict', {
      key,
      prefix: options.prefix,
      allEntries: options.allEntries,
      beforeInvocation: options.beforeInvocation,
    })(target, propertyName, descriptor);
    
    return descriptor;
  };
}

/**
 * Cache update decorator
 */
export function CachePut(
  key: string,
  ttl: number = 3600,
  options: {
    prefix?: string;
    serialize?: boolean;
  } = {},
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    SetMetadata('cache:put', {
      key,
      ttl,
      prefix: options.prefix,
      serialize: options.serialize !== false,
    })(target, propertyName, descriptor);
    
    return descriptor;
  };
}

/**
 * Cache interceptor metadata
 */
export interface CacheInterceptorOptions {
  key: string;
  ttl?: number;
  prefix?: string;
  serialize?: boolean;
  evict?: {
    key: string;
    prefix?: string;
    allEntries?: boolean;
    beforeInvocation?: boolean;
  };
  put?: {
    key: string;
    ttl?: number;
    prefix?: string;
    serialize?: boolean;
  };
}
