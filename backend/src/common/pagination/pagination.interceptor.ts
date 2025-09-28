import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buildMeta, PaginationMeta } from './pagination';

// Interceptor: standardizes list responses to { data, meta } without forcing controllers to repeat wrapping logic.
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { query } = request;
    const page = query.page ? parseInt(String(query.page), 10) || 1 : 1;
    const limit = query.limit ? Math.min(parseInt(String(query.limit), 10) || 25, 100) : 25;

    return next.handle().pipe(
      map((body) => {
        if (body && typeof body === 'object' && Array.isArray(body.data) && body.meta) {
          return body; // already in envelope
        }
        if (body && typeof body === 'object' && Array.isArray(body.items)) {
          const total = typeof body.total === 'number' ? body.total : body.items.length;
          const metaBase = buildMeta(total, page, limit);
          const meta = {
            ...metaBase,
            hasNextPage: metaBase.hasNext,
            hasPreviousPage: metaBase.hasPrev,
          };
          const legacyWrapper = Object.keys(body).reduce(
            (acc, k) => {
              if (k !== 'items' && k !== 'total') acc[k] = (body as any)[k];
              return acc;
            },
            {} as Record<string, any>,
          );
          return { data: body.items, meta, ...legacyWrapper };
        }
        if (Array.isArray(body)) {
          const total = body.length;
          const metaRaw: PaginationMeta = buildMeta(total, 1, total || 1);
          return {
            data: body,
            meta: {
              ...metaRaw,
              hasNextPage: metaRaw.hasNext,
              hasPreviousPage: metaRaw.hasPrev,
            },
          };
        }
        return body;
      }),
    );
  }
}
