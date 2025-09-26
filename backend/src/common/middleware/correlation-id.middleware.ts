import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { correlationStorage } from '../correlation/correlation-context';

// Adds / propagates a correlation (request) id for distributed tracing & log correlation
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request & { correlationId?: string }, res: Response, next: NextFunction) {
    const headerKey = 'x-correlation-id';
    const existing = (req.headers[headerKey] || req.headers['x-request-id']) as string | string[] | undefined;
    const correlationId = Array.isArray(existing) ? existing[0] : existing || randomUUID();
    req.correlationId = correlationId;
    res.setHeader(headerKey, correlationId);
    // Seed AsyncLocalStorage so downstream async context can access correlationId
    correlationStorage.run({ correlationId }, () => next());
  }
}
