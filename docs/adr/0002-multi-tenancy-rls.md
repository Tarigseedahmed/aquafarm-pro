# ADR 0002: Multi-Tenancy with Shared DB and RLS

## Context
- SaaS multi-tenant with cost-efficient isolation.
- Need strong data isolation with low operational overhead.

## Decision
- Use a single PostgreSQL database with 	enant_id on all business tables.
- Enable Row-Level Security (RLS) and define policies bound to current_setting('app.tenant_id').
- Service layer sets SET app.tenant_id = '<uuid>' per request after JWT validation.

## Consequences
- Strong per-tenant isolation enforced by DB.
- Simpler operational footprint than per-tenant DBs.
- Requires careful migration discipline and policy tests.

## Alternatives
- Schema-per-tenant: operational overhead grows with tenants.
- Database-per-tenant: best isolation but high cost.

## Security
- Deny by default; only enable select policies.
- Add automated tests to assert policy behavior.