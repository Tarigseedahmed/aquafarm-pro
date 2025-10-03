#!/usr/bin/env bash
set -euo pipefail

# Compress backend uploads directory
# Usage: ./scripts/backup-uploads.sh <uploads-dir> <out-dir>

SRC=${1:-./backend/uploads}
OUT_DIR=${2:-./backups}

mkdir -p "$OUT_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE="$OUT_DIR/uploads-$STAMP.tar.gz"

echo "[backup] Archiving $SRC -> $ARCHIVE"
tar -czf "$ARCHIVE" -C "$SRC" . || echo "[backup] No uploads found (skipping)"
echo "[backup] Done."


