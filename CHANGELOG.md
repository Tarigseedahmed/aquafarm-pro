# Changelog

All notable changes to this project will be documented in this file.

The format roughly follows Keep a Changelog, with semantic versioning starting once the API stabilizes.

## [Unreleased]

### Added (Unreleased)

- (placeholder)

### Deprecated (Unreleased)

- (placeholder)

### Changed (Unreleased)

- (placeholder)

### Planned Removal (Unreleased)

- (placeholder)

### Fixed (Unreleased)

- (placeholder)

### Security (Unreleased)

- (placeholder)

## [0.2.0] - 2025-09-28

### Added (0.2.0)

- Prometheus metrics endpoint (`/api/metrics`) exposing process & custom counters via `prom-client`.
- MetricsService with idempotent initialization and helpers (`ensureCounter`, `ensureGauge`).
- Custom counters: `http_requests_total`, `rate_limit_exceeded_total`, `notifications_emitted_total`; gauge: `active_sse_connections`.
- Global pagination interceptor producing unified `{ data, meta }` envelope.
- Pagination utilities (`buildMeta`, `envelope`) with page clamping & limit normalization + comprehensive unit tests.
- Pagination Swagger decorator & reusable `Paginated*Response` schemas; documented `page` clamp behavior and `limit` cap (100).
- SSE notifications stream endpoint with active connection tracking and metrics integration.
- Optional Redis Pub/Sub scaffolding for horizontal notification fan-out (graceful no-op if Redis unavailable).
- Rate limiting (global + per-route override for login) integrated with metrics counter increments and `Retry-After` header.
- Notification DTO for Swagger schema clarity.
- E2E tests: rate limit behavior, rate limit metrics increments, SSE notification delivery, pagination edge cases.
- Seed/bootstrap test utilities updated to initialize metrics & tenancy consistently across e2e suites.

### Changed (0.2.0)

- Centralized throttling error handling inside a single GlobalExceptionFilter (adds `Retry-After`, increments `rate_limit_exceeded_total`).
- Normalized metrics route labels (prefixed `/api`) for consistency in dashboards.
- Improved pagination meta: added `hasNextPage` / `hasPreviousPage` flags.

### Deprecated (0.2.0)

- Legacy pagination array keys (`ponds`, `batches`, `records`, `notifications`, etc.) retained temporarily; removal still scheduled for `v0.4.0`.

### Fixed (0.2.0)

- Eliminated duplicate Prometheus metric registration when multiple Nest app instances spin up during tests (idempotent MetricsService).
- Ensured throttling metrics reliably increment after earlier DI/filter precedence issues.

### Removed (0.2.0)

- Obsolete custom throttler filters/guards (replaced by unified GlobalExceptionFilter + metrics integration).

### Security (0.2.0)

- Added rate limiting observability (counter + explicit `Retry-After`) to better detect brute-force attempts.

### Internal / DX (0.2.0)

- Consolidated metrics initialization to avoid test flakiness.
- Added structured logging snippets around metrics increments for easier debugging.

### Planned Removal (0.2.0)

- Removal of legacy pagination keys remains planned for `v0.4.0` once client migrations complete.

## [0.1.1] - 2025-09-26

### Added (initial release)

- Global Swagger header parameter `X-Tenant-Id` injected across all operations.
- Expanded README multi-tenancy examples (list farms, create farm, cross-tenant 404 scenario).
- E2E isolation tests for farms, ponds, and farm stats plus new swagger header presence test.

### Changed

- Unified JWT secret resolution via ConfigService (removed static constant usage).
- Enhanced multi-tenancy interceptor to translate tenant code → UUID and prepare for Postgres RLS.
- Updated technical implementation plan and roadmap with Sprint 1 progress slice.

### Fixed

- Eliminated invalid JWT signature issue by standardizing sign/verify secret.
- Ensured tenant scoping on all farm and pond queries to prevent cross-tenant leakage.

## [0.1.0] - 2025-09-25

### Added

- Initial NestJS backend scaffold (Auth, Tenancy, Farms, Ponds modules skeleton).
- Basic JWT auth (register/login) and tenant interceptor foundation.
- Initial E2E flow test (register → create farm → create pond).
- Logging pipeline with correlation ID middleware and Pino structured logs.

---

Unreleased changes will accumulate here until the next tagged version.
