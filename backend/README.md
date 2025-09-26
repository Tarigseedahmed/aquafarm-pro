# AquaFarm Backend (NestJS)

[![Backend CI](https://github.com/REPLACE_OWNER/REPLACE_REPO/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/REPLACE_OWNER/REPLACE_REPO/actions/workflows/backend-ci.yml)

Multi-tenant aquaculture management API built with NestJS + TypeORM. Provides isolation via tenant headers, RLS in Postgres, and structured logging.

> استبدل `REPLACE_OWNER/REPLACE_REPO` باسم حسابك والمستودع بعد إعداد الـ remote.

## المحتوى

- [النبذة](#النبذة)
- [الخصائص الرئيسية](#الخصائص-الرئيسية)
- [الإعداد](#الإعداد)
- [التشغيل (SQLite)](#running-sqlite-quick-start)
- [التشغيل (PostgreSQL)](#running-postgresql)
- [الهجرة (Migrations)](#migrations)
- [تعدد المستأجرين](#multi-tenancy)
- [Strict Mode](#strict-mode)
- [التتبع و السجلات](#telemetry--logging)
- [RLS](#postgres-row-level-security-rls)
- [Auth](#auth)
- [البيئة](#environment)
- [الاختبارات](#testing)
- [التحسينات المخطط لها](#planned-enhancements)
- [النشر](#deployment-outline)
- [الترخيص](#license)

## النبذة

AquaFarm Backend: NestJS + TypeORM multi-tenant aquaculture management API.

Current API version: 0.1.1 (docs at /docs in non-production environments).

## الخصائص الرئيسية

- Multi-tenancy via `X-Tenant-Id` header and `tenantId` FK columns.
- Strict mode (`TENANT_STRICT`) + fallback default tenant with telemetry logging.
- Correlation ID propagation (`x-correlation-id`) + structured JSON request logging (env, service, userId, contentLength) via Pino.
- Postgres Row-Level Security (RLS) using session GUC `app.tenant_id`.
- Auth (JWT) with role field (admin/user) – extensible to RBAC.
- Domain modules: farms, ponds, water quality readings, fish batches, feeding records, notifications.
- TypeORM migrations (synchronize disabled) for safe schema evolution.
- Migration integrity test to catch duplicate names & ensure critical columns.
- Pluggable database: SQLite for quick start or PostgreSQL for real environments.

## الإعداد

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

Public (non-sensitive) routes may omit it and a fallback (`DEFAULT_TENANT_CODE` or `default`) is used for logging context only. For data‑bearing endpoints always set the header explicitly to avoid future strict-mode rejections.

Current resolution pipeline:
 
1. Interceptor reads `X-Tenant-Id` (or alias headers) → resolves code to UUID.
2. If absent and route is public → fallback code used (not recommended for mutations).
3. Guards & services enforce tenant UUID scoping at repository queries.

Example curls:

```bash
# List farms (GET)
curl -H "Authorization: Bearer <JWT>" -H "X-Tenant-Id: default" http://localhost:3001/api/farms

# Create farm (POST)
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: default" \
  -d '{"name":"Farm A"}' \
  http://localhost:3001/api/farms

# Cross-tenant access attempt (should 404 if farm not in tenant scope)
curl -H "Authorization: Bearer <JWT_OTHER_TENANT>" -H "X-Tenant-Id: other" http://localhost:3001/api/farms/<farm-uuid>
```

Swagger UI automatically injects a reusable header parameter (X-Tenant-Id) for every operation; you can set it once per request. When `TENANT_STRICT=true`, protected endpoints will reject requests missing this header.

### Strict Mode

Set `TENANT_STRICT=true` to force non-public routes to REQUIRE an `X-Tenant-Id` header. Public routes (`@Public`) keep using fallback.


### Telemetry & Logging

Fallback events are logged by `TenantTelemetryService` (Pino) with structured JSON at warn level. Each HTTP request is logged (event `http_request`) including: method, path, statusCode, durationMs, tenantId, correlationId, userId (if authenticated), env, service, contentLength. Use these for tracing & anomaly detection. Pretty logging is enabled automatically in non-production environments.

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

`TenantInterceptor` sets the session GUC `app.tenant_id` per request (Postgres) so the database enforces isolation even if a repository call accidentally omits the tenant predicate.

Test harness: `test/rls-postgres.e2e-spec.ts` (auto-skipped unless `DB_TYPE=postgres`).

The system bootstraps a default tenant using `DEFAULT_TENANT_CODE/NAME` if empty on first use.

## Auth

Issue a JWT via register/login endpoints. Payload structure:

```json
{
  "sub": "<user-uuid>",
  "email": "user@example.com",
  "role": "user",
  "tenantId": "<tenant-uuid>",
  "iat": 1710000000,
  "exp": 1710086400
}
```

Security notes:

- Set `JWT_SECRET` in production (rotation policy recommended).
- Test environment injects `test-secret` via `test/setup-e2e.ts`.
- Add refresh token rotation & revocation list in future milestone.

## Environment

See `.env.example` for annotated configuration (SQLite vs PostgreSQL, multi-tenancy defaults, JWT settings).

## Testing

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

## Planned Enhancements

- RBAC permissions matrix.
- Indexes on (tenantId, foreign keys) for performance – future migration.
- Audit logging & metrics.
- Redis caching, WebSocket notifications.

## Deployment (Outline)


1. Build Docker image (CI workflow provided).
1. Run migrations on startup job/container.
1. Provide env vars (no synchronize) and ensure `JWT_SECRET` rotation policy.
1. Add DB connection pool sizing (production tuning).

## License

Internal / UNLICENSED (update if you change distribution model).
