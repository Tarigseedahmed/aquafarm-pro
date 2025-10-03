import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { MetricsService } from '../../observability/metrics.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly baseGuard: ThrottlerGuard,
    private readonly metrics: MetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await this.baseGuard.canActivate(context);
    } catch (err) {
      if (err instanceof ThrottlerException) {
        const http = context.switchToHttp();
        const res = http.getResponse();
        const req = http.getRequest();
        if (!res.getHeader('Retry-After')) {
          try {
            res.setHeader('Retry-After', 60);
          } catch {
            /* ignore */
          }
        }
        this.metrics?.incRateLimit(req.route?.path || req.originalUrl || 'unknown');
      }
      throw err;
    }
  }
}
