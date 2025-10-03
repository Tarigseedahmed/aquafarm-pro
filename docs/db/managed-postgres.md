# Managed PostgreSQL Setup (Production-lite)

This guide summarizes recommended settings when using a managed PostgreSQL (e.g., RDS, Cloud SQL, Azure DB for PG).

## Networking

- Place DB in a private subnet (no public IP).
- Allow ingress only from app subnets or bastion via security groups.
- Enforce TLS in transit; prefer provider CA bundle.

## Access & Auth

- Create an app user with least privileges (no superuser).
- Rotate credentials regularly; prefer IAM auth if available.
- Maintain separate users for app, migrations, and read-only analytics when applicable.

## Parameters

- Set `max_connections` appropriate to pool size (e.g., 100–200 for small instances).
- Enable `log_min_duration_statement` (e.g., 500ms) in staging to catch slow queries.
- Timezone UTC; set `statement_timeout` (e.g., 30s) to protect from runaway queries.

## Backups

- Automated snapshots: daily, retain 7–14 days; enable PITR if available.
- Test restores quarterly to staging.
- Export logical backups as secondary safety (our scripts: `scripts/backup-postgres.sh`).

## App Config

- Configure `DB_TYPE=postgres` and either discrete vars or `DATABASE_URL`.
- In production, run migrations via a job or CI step before app rollout.
- RLS policies recommended; ensure `TenantInterceptor` sets `app.tenant_id`.

## Observability

- Monitor with Prometheus exporters or provider metrics (CPU, connections, I/O, replication lag).
- Alert on high connection usage, storage near capacity, and slow query spikes.
