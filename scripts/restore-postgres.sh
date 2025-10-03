#!/usr/bin/env bash
set -euo pipefail

# Restore PostgreSQL from gzip sql dump
# Usage: ./scripts/restore-postgres.sh <host> <port> <db> <user> <dump.sql.gz>

HOST=${1:-localhost}
PORT=${2:-5432}
DB=${3:-aquapro_dev}
USER=${4:-postgres}
DUMP=${5:-}

if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
  echo "Usage: $0 <host> <port> <db> <user> <dump.sql.gz>" >&2
  exit 1
fi

echo "[restore] Restoring $DUMP into $DB@$HOST:$PORT"
gunzip -c "$DUMP" | PGPASSWORD=${PGPASSWORD:-admin123} psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB"
echo "[restore] Done."


