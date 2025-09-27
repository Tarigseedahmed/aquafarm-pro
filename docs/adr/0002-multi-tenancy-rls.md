# ADR 0002: Multi-Tenancy with Shared DB and RLS

## Context

- SaaS multi-tenant with cost-efficient isolation.
- Need strong data isolation with low operational overhead.

## Decision

- Single PostgreSQL database with a `tenantId` UUID column on all tenant-scoped tables.
- Row-Level Security policies match `tenantId = current_setting('app.tenant_id')::uuid` (defense-in-depth).
- Interceptor performs `SET app.tenant_id = '<uuid>'` per request.

## Consequences

- Strong per-tenant isolation enforced at DB layer (queries missing tenant predicate are still constrained).
- Operational simplicity vs schema-per-tenant.
- Additional complexity: need migrations and policy coverage tests.
- Fallback tenant for public endpoints retained for ergonomics; with strict mode off, still safe because policies scope data.

## Strict Mode

`TENANT_STRICT=true` forbids implicit fallback on protected (non-`@Public`) routes, forcing clients to be explicit and reducing accidental multi-tenant leakage.

## Telemetry

Structured warning log emitted whenever a fallback tenant is applied (route, method, strict flag, header presence). Supports anomaly detection.

## Alternatives

- Schema-per-tenant: operational overhead grows with tenants.
- Database-per-tenant: best isolation but high cost.

## Security

- Deny by default; only enable select policies.
- Add automated tests to assert policy behavior.
- Public endpoints explicitly annotated (`@Public`) bypass strict header requirement but still assign a deterministic fallback tenant id for logging consistency.
