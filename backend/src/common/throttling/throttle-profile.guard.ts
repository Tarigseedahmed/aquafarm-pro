import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';
import { THROTTLE_PROFILE_KEY } from './throttle-profile.decorator';

@Injectable()
export class ThrottleProfileGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  private async getTracker(req: Record<string, any>): Promise<string> {
    // Use tenant ID if available, otherwise fall back to IP
    const tenantId = req.tenantId;
    const ip = req.ip || req.connection?.remoteAddress;

    if (tenantId) {
      return `tenant:${tenantId}`;
    }

    return `ip:${ip}`;
  }

  private async buildContextConfig(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const profileName = this.reflector.getAllAndOverride<string>(THROTTLE_PROFILE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no profile specified, try to determine from route
    const finalProfileName = profileName || this.determineProfileFromRoute(request);

    return {
      context: await this.getTracker(request),
      ttl: this.getTTL(finalProfileName),
      limit: this.getLimit(finalProfileName),
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // SECURITY FIX AC-005: Implement actual rate limiting
    const config = await this.buildContextConfig(context);

    // Skip if Redis is not available (graceful degradation)
    if (!this.redisService.isEnabled()) {
      return true;
    }

    const key = `ratelimit:${config.context}:${Date.now()}`;
    const ttlSeconds = Math.ceil(config.ttl / 1000);

    try {
      // Increment request count
      const currentCount = await this.redisService.incr(key);

      // Set TTL on first request
      if (currentCount === 1) {
        await this.redisService.expire(key, ttlSeconds);
      }

      // Check if limit exceeded
      if (currentCount > config.limit) {
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-RateLimit-Limit', config.limit.toString());
        response.setHeader('X-RateLimit-Remaining', '0');
        response.setHeader('Retry-After', ttlSeconds.toString());

        throw new HttpException(
          {
            statusCode: 429,
            message: 'Too many requests, please try again later',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Add rate limit headers
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', config.limit.toString());
      response.setHeader('X-RateLimit-Remaining', (config.limit - currentCount).toString());

      return true;
    } catch (error) {
      // If it's our rate limit error, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      // Otherwise, gracefully degrade (allow request)
      return true;
    }
  }

  private determineProfileFromRoute(request: any): string {
    const path = request.route?.path || request.url;

    // Authentication routes
    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      return 'auth';
    }

    if (path.includes('/auth/forgot-password') || path.includes('/auth/reset-password')) {
      return 'password-reset';
    }

    // Water quality routes
    if (path.includes('/water-quality')) {
      return 'water-quality';
    }

    // File upload routes
    if (path.includes('/upload') || path.includes('/files')) {
      return 'file-upload';
    }

    // Reports routes
    if (path.includes('/reports')) {
      return 'reports';
    }

    // Metrics routes
    if (path.includes('/metrics')) {
      return 'metrics';
    }

    // Default to API profile
    return 'api';
  }

  private getTTL(profileName: string): number {
    const profiles = {
      auth: 15 * 60 * 1000, // 15 minutes
      'password-reset': 60 * 60 * 1000, // 1 hour
      api: 60 * 1000, // 1 minute
      'water-quality': 60 * 1000, // 1 minute
      'file-upload': 60 * 1000, // 1 minute
      reports: 5 * 60 * 1000, // 5 minutes
      metrics: 60 * 1000, // 1 minute
    };

    return profiles[profileName] || 60 * 1000;
  }

  private getLimit(profileName: string): number {
    const limits = {
      auth: 5,
      'password-reset': 3,
      api: 100,
      'water-quality': 200,
      'file-upload': 10,
      reports: 10,
      metrics: 10,
    };

    return limits[profileName] || 100;
  }
}
