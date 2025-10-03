#!/usr/bin/env bash
set -euo pipefail

# Simple PostgreSQL backup script
# Usage: ./scripts/backup-postgres.sh <host> <port> <db> <user> <out-dir>

HOST=${1:-localhost}
PORT=${2:-5432}
DB=${3:-aquapro_dev}
USER=${4:-postgres}
OUT_DIR=${5:-./backups}

mkdir -p "$OUT_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT_FILE="$OUT_DIR/${DB}-${STAMP}.sql.gz"

echo "[backup] Dumping $DB@$HOST:$PORT to $OUT_FILE"
PGPASSWORD=${PGPASSWORD:-admin123} pg_dump -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -F p --no-owner --no-privileges | gzip -9 > "$OUT_FILE"
echo "[backup] Done."


