import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getCorrelationId } from '../correlation/correlation-context';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request & { correlationId?: string; tenantId?: string }, res: Response, next: NextFunction) {
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
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(log));
    });
    next();
  }
}
