export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildMeta(total: number, page = 1, limit = 10): PaginationMeta {
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const current = Math.min(Math.max(page, 1), totalPages);
  return {
    total,
    page: current,
    limit: safeLimit,
    totalPages,
    hasNext: current < totalPages,
    hasPrev: current > 1,
  };
}

export function envelope<T>(items: T[], meta: PaginationMeta): PaginatedResult<T> {
  return { data: items, meta };
}
