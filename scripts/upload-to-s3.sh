#!/usr/bin/env bash
set -euo pipefail

# Upload a file or directory to S3/MinIO using AWS CLI
# Requires AWS CLI configured via env vars or config file
# Usage:
#  AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... AWS_DEFAULT_REGION=... \
#  ./scripts/upload-to-s3.sh <source-path> s3://bucket/prefix/ [--endpoint-url https://minio.local]

SRC=${1:-}
DEST=${2:-}
SHIFTED_ARGS=("${@:3}")

if [[ -z "$SRC" || -z "$DEST" ]]; then
  echo "Usage: $0 <source-path> s3://bucket/prefix/ [extra aws s3 cp args]" >&2
  exit 1
fi

if [[ -d "$SRC" ]]; then
  echo "[s3] Syncing directory $SRC -> $DEST"
  aws s3 sync "$SRC" "$DEST" "${SHIFTED_ARGS[@]}"
else
  echo "[s3] Uploading file $SRC -> $DEST"
  aws s3 cp "$SRC" "$DEST" "${SHIFTED_ARGS[@]}"
fi

echo "[s3] Done."


