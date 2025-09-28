/**
 * Normalize dynamic API routes to reduce Prometheus label cardinality.
 * Heuristics:
 *  - Strip query string
 *  - Replace UUID v4 values with :id
 *  - Replace 24-char hex (Mongo-like) with :id
 *  - Replace long hex tokens (>=16) with :id
 *  - Replace purely numeric tokens length >=4 with :id (common auto IDs)
 *  - Trim trailing slash (except root '/')
 *  - Collapse duplicate slashes
 */
export function normalizeRoute(raw: string): string {
  if (!raw) return raw;
  let route = raw.split('?')[0];
  // Collapse duplicate slashes
  route = route.replace(/\/+/g, '/');
  // UUID v4
  route = route.replace(
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b/g,
    ':id',
  );
  // 24 hex (Mongo ObjectId style)
  route = route.replace(/\b[0-9a-fA-F]{24}\b/g, ':id');
  // Long hex tokens (>=16 chars) to catch other opaque IDs
  route = route.replace(/\b[0-9a-fA-F]{16,}\b/g, ':id');
  // Pure numeric IDs length >=4 (avoid replacing years like 2025? still fine, but keep)
  route = route.replace(/\b\d{4,}\b/g, ':id');
  // Trim trailing slash (except root)
  if (route.length > 1 && route.endsWith('/')) route = route.slice(0, -1);
  return route;
}

