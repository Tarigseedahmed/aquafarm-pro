import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { MetricsService } from '../../observability/metrics.service';

@Catch(ThrottlerException)
export class RateLimitExceptionFilter implements ExceptionFilter {
  constructor(private readonly metrics: MetricsService) {}

  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (!response.getHeader('Retry-After')) {
      try {
        // Fallback ttl; deriving exact remaining window would need internal storage access.
        response.setHeader('Retry-After', 60);
      } catch {
        /* ignore */
      }
    }
    this.metrics?.incRateLimit(request.route?.path || request.originalUrl || 'unknown');

    response.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: response.getHeader('Retry-After'),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
