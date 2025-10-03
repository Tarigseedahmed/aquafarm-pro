# Backup & Restore Plan (Production-lite)

This document outlines backup/restore for the PostgreSQL database and uploaded files.

## Database (PostgreSQL)

- Frequency: Daily full backup; retain 7–14 days (adjust per policy)
- Tooling: `pg_dump` for logical backups; gzip compression
- Storage: Offsite S3/MinIO bucket with versioning + lifecycle policy

### Backup (manual/dev)

```bash
# DB creds via env or pass PGPASSWORD inline
./scripts/backup-postgres.sh localhost 5432 aquapro postgres ./backups
```

### Restore (manual/dev)

```bash
# Restore into an existing database
./scripts/restore-postgres.sh localhost 5432 aquapro postgres ./backups/aquapro-YYYYMMDD-HHMMSS.sql.gz
```

Notes:

- For large DBs consider `pg_dump -Fc` (custom format) + `pg_restore` for parallel restore.
- Communicate maintenance window and expected downtime.

## Uploads (Files)

- Frequency: Daily archive of `backend/uploads` (or rely on object storage versioning if using S3/MinIO)
- Tooling: `tar.gz` archives and/or native object storage versioning

### Backup

```bash
./scripts/backup-uploads.sh ./backend/uploads ./backups
```

### Restore

```bash
# Extract into uploads dir
mkdir -p ./backend/uploads
 tar -xzf ./backups/uploads-YYYYMMDD-HHMMSS.tar.gz -C ./backend/uploads
```

## Automation (CI/CD / Cron)

- Use a cron job on the host or a scheduled CI workflow to execute backups.
- Upload artifacts to a secure bucket (S3/MinIO) with server-side encryption.
- Rotate credentials regularly and restrict write access to backup-only principals.

### Cron examples (host)

Daily at 02:00 (DB + uploads), then push to S3/MinIO:

```bash
0 2 * * * cd /opt/aquafarm && \
  ./scripts/backup-postgres.sh localhost 5432 aquapro postgres ./backups && \
  ./scripts/backup-uploads.sh ./backend/uploads ./backups && \
  AWS_ACCESS_KEY_ID=XXXX AWS_SECRET_ACCESS_KEY=YYYY AWS_DEFAULT_REGION=us-east-1 \
  ./scripts/upload-to-s3.sh ./backups s3://aquafarm-backups/prod/ --endpoint-url https://minio.local
```

Tip: use IAM with write-only access and server-side encryption (SSE-S3/KMS).

## Disaster Recovery Checklist

- Define RTO/RPO targets and test them.
- Quarterly restore drills to a staging environment.
- Verify integrity (checksum) of backup archives post-upload.
- Maintain infra as code for reproducible environments.
