import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { EnhancedThrottlerService, ThrottleContext } from './enhanced-throttler.service';
import { PinoLoggerService } from '../logging/pino-logger.service';

export const THROTTLE_PROFILE_KEY = 'throttle_profile';
export const ThrottleProfile = (profile: string) => SetMetadata(THROTTLE_PROFILE_KEY, profile);

@Injectable()
export class EnhancedThrottleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private enhancedThrottler: EnhancedThrottlerService,
    private logger: PinoLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get throttle profile from decorator or use default
    const profileName = this.reflector.getAllAndOverride<string>(THROTTLE_PROFILE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || this.enhancedThrottler.getProfileForEndpoint(request.path, request.method);

    // Skip rate limiting for whitelisted IPs
    const clientIP = this.getClientIP(request);
    if (this.enhancedThrottler.isWhitelistedIP(clientIP)) {
      return true;
    }

    // Build throttle context
    const throttleContext: ThrottleContext = {
      ip: clientIP,
      userAgent: request.headers['user-agent'] || 'unknown',
      userId: (request as any).user?.id,
      tenantId: (request as any).tenantId,
      endpoint: request.path,
      method: request.method,
    };

    try {
      // Check rate limit
      const rateLimitInfo = this.enhancedThrottler.shouldThrottle(throttleContext, profileName);

      // Set rate limit headers
      const headers = this.enhancedThrottler.getRateLimitHeaders(rateLimitInfo);
      Object.entries(headers).forEach(([key, value]) => {
        response.setHeader(key, value);
      });

      // Check if request should be blocked
      if (rateLimitInfo.remaining <= 0) {
        this.enhancedThrottler.logRateLimitViolation(throttleContext, profileName, rateLimitInfo);

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests',
            retryAfter: rateLimitInfo.retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        {
          event: 'throttle.error',
          error: error.message,
          ip: clientIP,
          endpoint: request.path,
        },
        'Rate limiting error',
      );

      // In case of error, allow the request to proceed
      return true;
    }
  }

  private getClientIP(request: Request): string {
    // Check for forwarded IP headers (from proxies/load balancers)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers['x-real-ip'];
    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    // Fallback to connection remote address
    return request.connection?.remoteAddress ||
           request.socket?.remoteAddress ||
           (request.connection as any)?.socket?.remoteAddress ||
           'unknown';
  }
}
