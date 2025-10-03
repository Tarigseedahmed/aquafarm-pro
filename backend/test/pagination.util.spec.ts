import { buildMeta, envelope } from '../src/common/pagination/pagination';

describe('Pagination Utilities', () => {
  it('buildMeta for empty list returns totalPages=1 and no prev/next', () => {
    const meta = buildMeta(0, 1, 25);
    expect(meta).toEqual({
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('buildMeta last page flags correctly', () => {
    const meta = buildMeta(95, 4, 25); // pages: 1..4
    expect(meta.totalPages).toBe(4);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });

  it('envelope wraps data', () => {
    const meta = buildMeta(10, 1, 10);
    const wrapped = envelope([1, 2, 3], meta);
    expect(wrapped.data).toHaveLength(3);
    expect(wrapped.meta.total).toBe(10);
  });

  it('clamps page if requested page exceeds totalPages', () => {
    const meta = buildMeta(12, 10, 5); // totalPages = 3, requested page 10 -> clamp to 3
    expect(meta.page).toBe(3);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });

  it('clamps limit to minimum 1', () => {
    const meta = buildMeta(0, 1, 0);
    expect(meta.limit).toBe(1);
  });
});
