# Migration Strategy

This folder contains TypeORM migration sources (TS). They compile to `dist/database/migrations` for runtime.

## Baseline

The authoritative baseline is `1758872808218-InitialSchema.ts`. A previous empty placeholder (`1700000000000-InitialSchema.ts`) was removed to avoid confusion.

## Principles

1. No `synchronize` in production (only migrations).
2. CI Postgres job applies migrations (validates path).
3. Test (SQLite) uses in-memory + synchronize for speed.
4. Test (Postgres) runs migrations (exercise real path).
5. Prefer additive, reversible migrations; squash only before first production deploy.

## Common Commands

Generate: `npm run migration:generate --name MeaningfulName`  
Run: `npm run migration:run`  
Revert last: `npm run migration:revert`

## Adding a New Migration

1. Ensure working tree clean.
2. (If Postgres) Run a local Postgres instance with empty schema.
3. Apply current migrations: `npm run migration:run`.
4. Make entity changes.
5. Generate: `npm run migration:generate --name <ChangeName>`.
6. Review SQL for safety (indexes, nullability, data moves).
7. Commit.

## Drift Detection (Planned)

Future CI step can: create fresh DB → run migrations → run a schema sync diff (`typeorm schema:log`) → fail if differences exist.

## Rollback Notes

Not all historical migrations implement a destructive `down` (intentional to avoid unsafe drops). For critical production rollback, create a forward *fix* migration instead of relying on `down`.

## RLS & Multi-Tenancy

Row Level Security and tenant isolation policies live in dedicated migrations (`EnableRLSPolicies`, `AddTenantToUsersAndRLS`). They are Postgres-only and no-op under SQLite.

## Accounting Tables

The accounting core schema (tax profiles, tax rates, invoice series, fx rates) resides in `AddAccountingCoreTables` migration. Keep incremental changes isolated (e.g. indexes, constraints) for auditability.

---
Last updated after removing obsolete placeholder baseline.
