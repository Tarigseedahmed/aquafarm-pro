import { Injectable } from '@nestjs/common';
import { ThrottlerConfigService } from './throttler-config.service';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface ThrottleContext {
  ip: string;
  userAgent: string;
  userId?: string;
  tenantId?: string;
  endpoint: string;
  method: string;
}

@Injectable()
export class EnhancedThrottlerService {
  constructor(
    private throttlerConfig: ThrottlerConfigService,
    private logger: PinoLoggerService,
  ) {}

  /**
   * Check if request should be throttled
   */
  shouldThrottle(context: ThrottleContext, profileName: string): RateLimitInfo {
    const profile = this.throttlerConfig.getProfile(profileName);
    if (!profile) {
      this.logger.warn(
        {
          event: 'throttle.unknown_profile',
          profileName,
          endpoint: context.endpoint,
        },
        'Unknown throttle profile requested',
      );
      return {
        limit: 100,
        remaining: 100,
        resetTime: Date.now() + 60000,
      };
    }

    // Check skip conditions
    if (profile.skipIf) {
      const mockContext = { switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) };
      if (profile.skipIf(mockContext as any)) {
        return {
          limit: profile.limit,
          remaining: profile.limit,
          resetTime: Date.now() + profile.ttl,
        };
      }
    }

    // Log throttle attempt
    this.logger.info(
      {
        event: 'throttle.check',
        profile: profileName,
        ip: context.ip,
        userId: context.userId,
        tenantId: context.tenantId,
        endpoint: context.endpoint,
        method: context.method,
        limit: profile.limit,
        ttl: profile.ttl,
      },
      'Rate limit check performed',
    );

    // In a real implementation, you would:
    // 1. Check Redis cache for current request count
    // 2. Increment counter if under limit
    // 3. Return appropriate rate limit info

    return {
      limit: profile.limit,
      remaining: Math.max(0, profile.limit - 1), // Simulated
      resetTime: Date.now() + profile.ttl,
      retryAfter: profile.limit <= 1 ? Math.ceil(profile.ttl / 1000) : undefined,
    };
  }

  /**
   * Get rate limit headers
   */
  getRateLimitHeaders(rateLimitInfo: RateLimitInfo): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
      'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimitInfo.resetTime / 1000).toString(),
    };

    if (rateLimitInfo.retryAfter) {
      headers['Retry-After'] = rateLimitInfo.retryAfter.toString();
    }

    return headers;
  }

  /**
   * Log rate limit violation
   */
  logRateLimitViolation(context: ThrottleContext, profileName: string, rateLimitInfo: RateLimitInfo): void {
    this.logger.warn(
      {
        event: 'throttle.violation',
        profile: profileName,
        ip: context.ip,
        userId: context.userId,
        tenantId: context.tenantId,
        endpoint: context.endpoint,
        method: context.method,
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        retryAfter: rateLimitInfo.retryAfter,
      },
      'Rate limit violation detected',
    );
  }

  /**
   * Get throttle profile for endpoint
   */
  getProfileForEndpoint(endpoint: string, method: string): string {
    // Authentication endpoints
    if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
      return 'auth';
    }

    if (endpoint.includes('/auth/password-reset')) {
      return 'password-reset';
    }

    // File upload endpoints
    if (endpoint.includes('/upload') || method === 'POST' && endpoint.includes('/files')) {
      return 'file-upload';
    }

    // Water quality endpoints
    if (endpoint.includes('/water-quality')) {
      return 'water-quality';
    }

    // Reports endpoints
    if (endpoint.includes('/reports')) {
      return 'reports';
    }

    // Metrics endpoints
    if (endpoint.includes('/metrics')) {
      return 'metrics';
    }

    // Default API profile
    return 'api';
  }

  /**
   * Check if IP is whitelisted
   */
  isWhitelistedIP(ip: string): boolean {
    const whitelistedIPs = [
      '127.0.0.1',
      '::1',
      'localhost',
    ];

    // Add internal network IPs if needed
    if (process.env.INTERNAL_NETWORK_IPS) {
      whitelistedIPs.push(...process.env.INTERNAL_NETWORK_IPS.split(','));
    }

    return whitelistedIPs.includes(ip);
  }

  /**
   * Get client identifier for rate limiting
   */
  getClientIdentifier(context: ThrottleContext): string {
    // For authenticated users, use user ID + IP for more granular control
    if (context.userId) {
      return `user:${context.userId}:${context.ip}`;
    }

    // For anonymous users, use IP only
    return `ip:${context.ip}`;
  }
}
