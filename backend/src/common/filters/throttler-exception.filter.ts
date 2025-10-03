import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { MetricsService } from '../../observability/metrics.service';

@Catch(ThrottlerException)
export class ThrottlerExceptionMetricsFilter implements ExceptionFilter {
  constructor(private readonly metrics: MetricsService) {}

  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    if (!res.getHeader('Retry-After')) {
      try {
        res.setHeader('Retry-After', 60);
      } catch {
        /* ignore */
      }
    }
    const routeLabel = req.route?.path || req.originalUrl || 'unknown';
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line no-console
      console.log('[throttler-filter] invoked for routeLabel=', routeLabel);
    }
    this.metrics?.incRateLimit(routeLabel);

    // Standard JSON structure; keep message simple
    res.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: res.getHeader('Retry-After'),
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
