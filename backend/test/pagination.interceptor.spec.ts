import { PaginationInterceptor } from '../src/common/pagination/pagination.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

function createExecutionContext(query: Record<string, any> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ query }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as any;
}

describe('PaginationInterceptor', () => {
  it('passes through already wrapped response', (done) => {
    const interceptor = new PaginationInterceptor();
    const ctx = createExecutionContext({ page: '2', limit: '5' });
    const body = {
      data: [1, 2],
      meta: { total: 10, page: 2, limit: 5, totalPages: 5, hasNext: true, hasPrev: true },
    };
    const handler: CallHandler = { handle: () => of(body) };
    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res).toBe(body);
      done();
    });
  });

  it('wraps plain items + total structure', (done) => {
    const interceptor = new PaginationInterceptor();
    const ctx = createExecutionContext({ page: '1', limit: '10' });
    const handler: CallHandler = { handle: () => of({ items: [1, 2, 3], total: 3, extra: 'x' }) };
    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res.data).toEqual([1, 2, 3]);
      expect(res.meta.total).toBe(3);
      expect(res.extra).toBe('x');
      done();
    });
  });

  it('wraps raw array', (done) => {
    const interceptor = new PaginationInterceptor();
    const ctx = createExecutionContext();
    const handler: CallHandler = { handle: () => of([10, 20]) };
    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res.data).toEqual([10, 20]);
      expect(res.meta.total).toBe(2);
      done();
    });
  });
});
