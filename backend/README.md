<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[![Backend CI](https://github.com/REPLACE_OWNER/REPLACE_REPO/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/REPLACE_OWNER/REPLACE_REPO/actions/workflows/backend-ci.yml)

> استبدل `REPLACE_OWNER/REPLACE_REPO` باسم حسابك والمستودع بعد إعداد الـ remote.

AquaFarm Backend: NestJS + TypeORM multi-tenant aquaculture management API.

Key features:

- Multi-tenancy via `X-Tenant-Id` header and `tenantId` FK columns.
- Strict mode (`TENANT_STRICT`) + fallback default tenant with telemetry logging.
- Correlation ID propagation (`x-correlation-id`) + structured JSON request logging (env, service, userId, contentLength).
- Postgres Row-Level Security (RLS) using session GUC `app.tenant_id`.
- Auth (JWT) with role field (admin/user) – extensible to RBAC.
- Domain modules: farms, ponds, water quality readings, fish batches, feeding records, notifications.
- TypeORM migrations (synchronize disabled) for safe schema evolution.
- Migration integrity test to catch duplicate names & ensure critical columns.
- Pluggable database: SQLite for quick start or PostgreSQL for real environments.

## Project setup

```bash
cp .env.example .env   # adjust values
npm install
```

## Running (SQLite quick start)

```bash
# (in .env) set: DB_TYPE=sqlite
npm run start:dev
```

## Running (PostgreSQL)

1. Ensure Postgres is running locally:

```bash
docker run --name aquafarm-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=aquafarm -p 5432:5432 -d postgres:14
```

1. In `.env` set either discrete vars (DB_TYPE=postgres, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) or a `DATABASE_URL`.

1. Run initial migration (already generated):

```bash
npm run build
npm run migration:run
```

1. Start app:

```bash
npm run start:dev
```

## Migrations

Commands:

```bash
npm run migration:generate   # generates a new migration from entity diffs
npm run migration:run        # applies pending migrations
npm run migration:revert     # reverts last migration
```

Notes:

- Always commit generated migration files (`src/database/migrations/*.ts`).
- Do NOT re-enable TypeORM `synchronize` in production.
- For a clean baseline in dev: remove the SQLite file or drop the Postgres schema then re-run migrations.

## Multi-Tenancy

All tenant-scoped requests SHOULD include header:

```text
X-Tenant-Id: <tenant-id>
```

However, public (non-sensitive) routes can be marked with a `@Public()` decorator. For those routes:

- If the header is absent, a fallback tenant id (`DEFAULT_TENANT_ID` env var or `default-tenant`) is injected.
- This enables uptime/health probes and a splash root endpoint without forcing a tenant header.

Why fallback? It keeps logging / context uniform (every request still has a tenantId) and simplifies infrastructure health checks. Business data routes should still send the correct tenant header explicitly for isolation.

Planned hardening: later we can enforce that non-`@Public()` routes reject requests that rely on fallback rather than explicit header (telemetry already possible in guard).


### Strict Mode

Set `TENANT_STRICT=true` to force non-public routes to REQUIRE an `X-Tenant-Id` header. Public routes (`@Public`) keep using fallback.


### Telemetry & Logging

Fallback events are logged by `TenantTelemetryService` with structured JSON (level WARN). Each HTTP request is logged (event `http_request`) including: method, path, statusCode, durationMs, tenantId, correlationId, userId (if authenticated), env, service, contentLength. Use these for tracing & anomaly detection.

Example request log line:

```json
{"event":"http_request","method":"GET","path":"/api/health","statusCode":200,"durationMs":5.12,"tenantId":"default-tenant","correlationId":"a1b2c3d4","userId":"u_123","env":"development","service":"aquafarm-backend","contentLength":52,"ts":"2025-09-26T10:00:00.000Z"}
```

#### Correlation Context (Async)

An AsyncLocalStorage context propagates the correlationId so background jobs or queued tasks can call:

```ts
import { getCorrelationId } from './common/correlation/correlation-context';

const cid = getCorrelationId(); // string | undefined
```

Set `SERVICE_NAME` env var to customize the `service` field in logs.

### Postgres Row Level Security (RLS)

Migrations:

1. Enable RLS policies for core tables (sets policies comparing each row `tenantId` against `current_setting('app.tenant_id')::uuid`).
2. Add `tenantId` to `users` and apply policy.

`TenantInterceptor` sets the session GUC `app.tenant_id` per request so the database enforces isolation even if a repository call accidentally omits the tenant predicate.

Test harness: `test/rls-postgres.e2e-spec.ts` (auto-skipped unless `DB_TYPE=postgres`).

The system bootstraps a default tenant using `DEFAULT_TENANT_CODE/NAME` if empty on first use.

\n## Auth
Issue a JWT (login endpoint TBD) – token payload contains `role`. Admin routes guarded by simple AdminGuard (extend later to full RBAC).

\n## Environment
See `.env.example` for annotated configuration (SQLite vs PostgreSQL, multi-tenancy defaults, JWT settings).

\n## Testing

Unit tests:

```bash
npm run test
```

E2E (SQLite default):

```bash
npm run test:e2e
```

Focused isolation suites:

```bash
npm run test:tenant
npm run test:notifications
```

Migration integrity (unique names + users.tenantId present):

```bash
npm run test:e2e -- migration-integrity.e2e-spec.ts
```

Postgres RLS harness (only runs under `DB_TYPE=postgres`): `rls-postgres.e2e-spec.ts`.

\n## Planned Enhancements

- RBAC permissions matrix.
- Indexes on (tenantId, foreign keys) for performance – future migration.
- Audit logging & metrics.
- Redis caching, WebSocket notifications.

## Deployment (Outline)


1. Build Docker image (CI workflow provided).
1. Run migrations on startup job/container.
1. Provide env vars (no synchronize) and ensure `JWT_SECRET` rotation policy.
1. Add DB connection pool sizing (production tuning).

\n## License
Internal / UNLICENSED (update if you change distribution model).
