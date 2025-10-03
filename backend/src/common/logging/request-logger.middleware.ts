import { Injectable, NestMiddleware, Optional } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getCorrelationId } from '../correlation/correlation-context';
import { PinoLoggerService } from './pino-logger.service';
import { MetricsService } from '../../observability/metrics.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(
    @Optional() private pino?: PinoLoggerService,
    @Optional() private metrics?: MetricsService,
  ) {}
  use(
    req: Request & { correlationId?: string; tenantId?: string },
    res: Response,
    next: NextFunction,
  ) {
    const start = process.hrtime.bigint();
    const { method, originalUrl } = req;
    const cid = req.correlationId;
    // Finish listener
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      // eslint-disable-next-line no-console
      const correlationFromContext = getCorrelationId();
      const log = {
        event: 'http_request',
        method,
        path: originalUrl,
        statusCode: res.statusCode,
        durationMs: +durationMs.toFixed(2),
        tenantId: req.tenantId,
        correlationId: cid || correlationFromContext,
        userId: (req as any).user?.id,
        env: process.env.NODE_ENV || 'development',
        service: process.env.SERVICE_NAME || 'aquafarm-backend',
        contentLength: res.getHeader('content-length'),
        ts: new Date().toISOString(),
      };
      if (this.pino) {
        (this.pino as any).info(log);
      } else {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(log));
      }
      // Metrics observation (best-effort)
      try {
        const route = originalUrl;
        const status = res.statusCode;
        this.metrics?.incRequest(method, status);
        this.metrics?.observeRequestDuration(method, route, status, durationMs / 1000);
        if (status === 401) this.metrics?.incUnauthorized(route);
      } catch {
        /* ignore metrics errors */
      }
    });
    next();
  }
}
