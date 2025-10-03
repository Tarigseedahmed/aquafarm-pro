# Release v0.2.0 – Observability & Realtime Foundations

Tag: `v0.2.0`  
Date: 2025-09-28

## ✨ Highlights

- Prometheus metrics endpoint (`/api/metrics`) with process + custom counters (`http_requests_total`, `rate_limit_exceeded_total`, `notifications_emitted_total`) and gauge (`active_sse_connections`).
- Idempotent `MetricsService` preventing duplicate metric registration across multiple Nest instances (notably e2e tests).
- Real-time notifications via Server-Sent Events (SSE) including active connection tracking + metrics.
- Optional Redis Pub/Sub scaffolding enabling future horizontal scaling / multi-instance fan-out (graceful fallback if Redis disabled/unavailable).
- Unified pagination envelope `{ data, meta }` + enriched meta (`hasNextPage`, `hasPreviousPage`) and reusable Swagger pagination decorator.
- Global + route-specific rate limiting (login) with integrated metrics counter and `Retry-After` header on 429 responses.
- Expanded E2E + unit test coverage (pagination edge cases, rate limit metrics, SSE delivery, notifications paging).
- Removal of obsolete throttling filters/guards in favor of a unified `GlobalExceptionFilter`.

## 📦 Added

- `MetricsService`, `MetricsModule`, and `/metrics` controller (Prometheus exposition format).
- Counters: `http_requests_total`, `rate_limit_exceeded_total`, `notifications_emitted_total`.
- Gauge: `active_sse_connections` for live SSE clients.
- SSE notifications stream endpoint secured by JWT.
- Redis module/service (optional) for future cross-process notification broadcasting.
- Pagination Swagger decorator and `notification.dto.ts`.
- E2E tests: rate limiting, rate limit metrics, SSE notifications, pagination edges.
- Idempotent bootstrap for metrics in test harness.

## 🔄 Changed

- Throttling + error handling consolidated into a single `GlobalExceptionFilter` (adds `Retry-After` header, increments metrics, normalizes error response shape).
- Pagination meta extended with `hasNextPage` / `hasPreviousPage`.
- Route label normalization for metrics (consistent `/api` prefix).

## 🗑️ Removed

- Legacy bespoke throttling filters/guards (replaced by unified approach with metrics integration).

## 🛠 Fixed

- Duplicate metric registration errors during multi-instance (test) startup.
- Inconsistent rate limit counter increments caused by DI/filter precedence.

## ⚠️ Deprecated / Transitional

- Legacy array keys in paginated responses (`ponds`, `batches`, `records`, `notifications`, etc.) retained for backward compatibility; removal scheduled for `v0.4.0` (clients should migrate to `data`).

## 🔐 Security / Hardening

- Rate limiting observability: explicit counter + `Retry-After` improves detection of brute-force attempts.
- Foundation for future RBAC & RLS enhancements (stable tenancy isolation remains enforced).

## 🧪 Test Coverage Additions

- Pagination unit tests (arrays, derived totals, pre-wrapped input, clamping, negative/zero cases).
- E2E rate limit negative path & metrics delta assertions.
- SSE end-to-end verification (connection → emit → receive event path).

## 📈 Observability Roadmap (Next)

- Latency histogram (e.g., `http_request_duration_seconds`) + error rate counters.
- Dashboard JSON for Grafana.
- Tenant-scoped metrics segmentation (labels) where safe.

## 🔜 Planned (Sprint 2 Targets)

1.Water Quality module (entities, CRUD, isolation tests).
2. Fish Batches module.
3. RBAC foundation (roles, permissions matrix, guard, decorator).
4. Generic `Paginated<T>` OpenAPI schema refactor (dedupe decorators).
5. Redis-enabled multi-instance notification propagation (activate & test).
6. Caching layer for tenant code→UUID translation.

## 📝 Upgrade Notes

- If scraping metrics, add `/api/metrics` to Prometheus `scrape_configs`.
- Set `REDIS_URL` (e.g., `redis://localhost:6379`) to enable future multi-instance fan-out (currently optional; system no-ops on absence).
- Begin client migration off legacy pagination keys; watch changelog for the `v0.4.0` removal milestone.

## 🔗 Reference Commits (selection)

- c33fe9d feat(observability+notifications+pagination)
- 956cf12 fix(metrics) idempotent metrics
- a229828 chore(throttling) remove obsolete filters/guards
- fa31a21 feat(observability+throttling+notifications)
- 98c6ab6 docs(changelog) release entry
- 74bb860 docs(plan) updated plan for 0.2.0

---
Generated as a companion release note; mirror key points into a GitHub Release description when publishing.
