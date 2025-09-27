import { PaginationInterceptor } from './pagination.interceptor';
import { of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';

// Simple mocks for ExecutionContext & CallHandler
function createCtx(query: any = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ query }),
    }),
  } as any;
}

function createHandler(returnValue: any): CallHandler<any> {
  return { handle: () => of(returnValue) } as CallHandler<any>;
}

describe('PaginationInterceptor', () => {
  const interceptor = new PaginationInterceptor();

  it('wraps plain array response', (done) => {
    const ctx = createCtx();
    const handler = createHandler([{ id: 1 }, { id: 2 }]);
    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res.data).toHaveLength(2);
      expect(res.meta.total).toBe(2);
      expect(res.meta.page).toBe(1);
      expect(res.meta.limit).toBe(2); // limit becomes total when array provided directly
      done();
    });
  });

  it('wraps {items,total} respecting query page & limit', (done) => {
    const ctx = createCtx({ page: '3', limit: '40' });
    const handler = createHandler({ items: new Array(5).fill(0).map((_, i) => ({ i })), total: 123 });
    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res.data).toHaveLength(5);
      expect(res.meta.total).toBe(123);
      expect(res.meta.page).toBe(3);
      expect(res.meta.limit).toBe(40);
      expect(res.meta.totalPages).toBe(Math.ceil(123 / 40));
      done();
    });
  });

  it('caps limit at 100', (done) => {
    const ctx = createCtx({ page: '1', limit: '500' });
    const handler = createHandler({ items: [{ a: 1 }], total: 200 });
    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res.meta.limit).toBe(100);
      done();
    });
  });

  it('passes through already enveloped response', (done) => {
    const ctx = createCtx({ page: '2', limit: '10' });
    const existing = { data: [{ id: 1 }], meta: { page: 99, limit: 500, total: 1, totalPages: 1 } };
    const handler = createHandler(existing);
    interceptor.intercept(ctx, handler).subscribe((res) => {
      // unchanged
      expect(res).toBe(existing);
      done();
    });
  });

  it('derives total when missing total in {items}', (done) => {
    const ctx = createCtx({ page: '1', limit: '10' });
    const handler = createHandler({ items: [{}, {}, {}] });
    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res.meta.total).toBe(3);
      expect(res.data).toHaveLength(3);
      done();
    });
  });

  it('returns object untouched if not array / items shape', (done) => {
    const ctx = createCtx();
    const obj = { message: 'ok' };
    const handler = createHandler(obj);
    interceptor.intercept(ctx, handler).subscribe((res) => {
      expect(res).toBe(obj);
      done();
    });
  });
});
