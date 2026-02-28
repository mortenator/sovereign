#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Sovereign Deploy — Backup Script
# ═══════════════════════════════════════════════════════════════════════════════
# Backs up:
#   1. PostgreSQL (all three databases via pg_dump)
#   2. MinIO data (sovereign-documents bucket)
# Stores backups locally and optionally uploads to an S3-compatible target.
#
# Usage:
#   ./scripts/backup.sh                    # Interactive, uses .env
#   BACKUP_TARGET=s3 ./scripts/backup.sh   # Force S3 upload
#
# Schedule with cron (daily at 02:00):
#   0 2 * * * /opt/sovereign/deploy/docker-compose/scripts/backup.sh >> /var/log/sovereign-backup.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$COMPOSE_DIR/.env"

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
else
  echo "ERROR: .env file not found at $ENV_FILE" >&2
  exit 1
fi

# ─────────────────────────────────────────────
# Configuration (from .env with defaults)
# ─────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/sovereign}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="sovereign-backup-${TIMESTAMP}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

S3_ENDPOINT="${BACKUP_S3_ENDPOINT:-}"
S3_BUCKET="${BACKUP_S3_BUCKET:-sovereign-backups}"
S3_ACCESS_KEY="${BACKUP_S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${BACKUP_S3_SECRET_KEY:-}"
S3_REGION="${BACKUP_S3_REGION:-eu-central-1}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
info() { echo -e "${BOLD}→${NC} $1"; }

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Sovereign Backup — $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "═══════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────
# Verify containers are running
# ─────────────────────────────────────────────
check_containers() {
  info "Checking container status..."

  for CONTAINER in sovereign-postgres sovereign-minio; do
    if ! docker inspect "$CONTAINER" --format='{{.State.Running}}' 2>/dev/null | grep -q true; then
      fail "Container $CONTAINER is not running. Cannot backup."
    fi
  done
  ok "Containers are running"
}

# ─────────────────────────────────────────────
# Create backup directory
# ─────────────────────────────────────────────
setup_backup_dir() {
  info "Creating backup directory: $BACKUP_PATH"
  # Set restrictive file-creation mask for the rest of this process: new files
  # default to 600 (owner read/write only) and new directories to 700.
  # This ensures pg_dump output files and mc mirror files never have
  # world- or group-readable permissions, even transiently before the
  # compress_backup step applies explicit chmod 600 to the final archive.
  umask 077
  mkdir -p "$BACKUP_PATH"
  chmod 700 "$BACKUP_PATH"
  ok "Backup directory ready"
}

# ─────────────────────────────────────────────
# Backup PostgreSQL — all three databases
# ─────────────────────────────────────────────
backup_postgres() {
  info "Backing up PostgreSQL databases..."

  local PG_BACKUP_DIR="$BACKUP_PATH/postgres"
  mkdir -p "$PG_BACKUP_DIR"

  local DATABASES=("sovereign" "onlyoffice" "keycloak")

  for DB in "${DATABASES[@]}"; do
    info "  Dumping database: $DB"
    docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" sovereign-postgres \
      pg_dump \
        --username sovereign \
        --format custom \
        --compress 9 \
        --no-password \
        --lock-wait-timeout=60000 \
        "$DB" \
      > "$PG_BACKUP_DIR/${DB}.dump"

    local SIZE
    SIZE=$(du -sh "$PG_BACKUP_DIR/${DB}.dump" | cut -f1)
    ok "  $DB → ${DB}.dump ($SIZE)"
  done

  # Global dump (roles, tablespaces)
  info "  Dumping global roles..."
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" sovereign-postgres \
    pg_dumpall \
      --username sovereign \
      --globals-only \
      --no-password \
    > "$PG_BACKUP_DIR/globals.sql"

  ok "PostgreSQL backup complete"
}

# ─────────────────────────────────────────────
# Backup MinIO — sovereign-documents bucket
# ─────────────────────────────────────────────
backup_minio() {
  info "Backing up MinIO data (sovereign-documents bucket)..."

  local MINIO_BACKUP_DIR="$BACKUP_PATH/minio"
  mkdir -p "$MINIO_BACKUP_DIR"

  # Use mc (MinIO client) via docker. Pass credentials as environment variables
  # (not CLI args) so they are not exposed in the process list.
  docker run --rm \
    --network sovereign-net \
    -v "$MINIO_BACKUP_DIR:/backup" \
    -e MINIO_ROOT_USER="${MINIO_ROOT_USER}" \
    -e MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD}" \
    minio/mc:RELEASE.2024-03-13T23-51-57Z \
    sh -c 'mc alias set sovereign http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" --quiet &&
      mc mirror --overwrite sovereign/sovereign-documents /backup/ &&
      echo MinIO mirror complete'

  local COUNT
  COUNT=$(find "$MINIO_BACKUP_DIR" -type f | wc -l)
  ok "MinIO backup complete: $COUNT files"
}

# ─────────────────────────────────────────────
# Compress backup archive
# ─────────────────────────────────────────────
compress_backup() {
  info "Compressing backup archive..."

  local ARCHIVE="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
  tar -czf "$ARCHIVE" -C "$BACKUP_DIR" "$BACKUP_NAME"
  chmod 600 "$ARCHIVE"

  local SIZE
  SIZE=$(du -sh "$ARCHIVE" | cut -f1)
  ok "Archive created: $ARCHIVE ($SIZE)"

  # Generate SHA256 checksum
  local CHECKSUM_FILE="${ARCHIVE}.sha256"
  sha256sum "$ARCHIVE" > "$CHECKSUM_FILE"
  chmod 600 "$CHECKSUM_FILE"
  local CHECKSUM
  CHECKSUM=$(awk '{print $1}' "$CHECKSUM_FILE")
  ok "SHA256: $CHECKSUM"

  # Remove uncompressed directory
  rm -rf "$BACKUP_PATH"

  # Export for S3 upload
  ARCHIVE_PATH="$ARCHIVE"
  ARCHIVE_FILE="${BACKUP_NAME}.tar.gz"
  CHECKSUM_PATH="$CHECKSUM_FILE"
  CHECKSUM_FILE_NAME="${BACKUP_NAME}.tar.gz.sha256"
}

# ─────────────────────────────────────────────
# Upload to S3-compatible target (optional)
# ─────────────────────────────────────────────
upload_to_s3() {
  if [[ -z "$S3_ENDPOINT" ]]; then
    warn "S3_ENDPOINT not set — skipping remote upload."
    warn "Set BACKUP_S3_ENDPOINT in .env to enable remote backups."
    return 0
  fi

  if [[ -z "$S3_ACCESS_KEY" || -z "$S3_SECRET_KEY" ]]; then
    warn "S3 credentials not set — skipping remote upload."
    return 0
  fi

  # NOTE (URL validation tradeoff): S3_ENDPOINT is verified to be non-empty
  # above but its format (valid URL, reachable host) is not pre-validated here.
  # mc itself will emit a clear error if the endpoint is malformed or unreachable,
  # which propagates as a non-zero exit and aborts the script (set -euo pipefail).
  # Add a `curl --connect-timeout 5 -sf "$S3_ENDPOINT"` pre-check here if you
  # need explicit connectivity validation before the mc config file is written.

  # NOTE (security tradeoff): Backups are uploaded without additional
  # client-side encryption. The archive is compressed but plaintext.
  # COMPLIANCE.md recommends encryption at rest — rely on S3 server-side
  # encryption (SSE) enabled on the target bucket, or add GPG encryption
  # here before upload if your S3 provider does not enforce SSE.
  info "Uploading to S3-compatible storage: $S3_ENDPOINT/$S3_BUCKET"

  # Write credentials to a temp config file so they are not exposed in the
  # process list (which would happen if passed as mc alias set CLI arguments).
  local MC_CONF_DIR
  MC_CONF_DIR=$(mktemp -d)
  # Ensure the credentials directory is always removed, even if the upload
  # fails mid-way (set -euo pipefail would otherwise exit without cleanup).
  # shellcheck disable=SC2064
  trap "rm -rf '${MC_CONF_DIR}'" RETURN
  cat > "$MC_CONF_DIR/config.json" <<EOF
{
  "version": "10",
  "aliases": {
    "backup-target": {
      "url": "${S3_ENDPOINT}",
      "accessKey": "${S3_ACCESS_KEY}",
      "secretKey": "${S3_SECRET_KEY}",
      "api": "s3v4",
      "path": "auto"
    }
  }
}
EOF
  chmod 600 "$MC_CONF_DIR/config.json"

  local UPLOAD_DATE
  UPLOAD_DATE=$(date +%Y/%m)

  docker run --rm \
    -v "$ARCHIVE_PATH:/backup/$ARCHIVE_FILE:ro" \
    -v "$CHECKSUM_PATH:/backup/$CHECKSUM_FILE_NAME:ro" \
    -v "$MC_CONF_DIR:/root/.mc:ro" \
    minio/mc:RELEASE.2024-03-13T23-51-57Z \
    sh -c "mc cp /backup/${ARCHIVE_FILE} backup-target/${S3_BUCKET}/${UPLOAD_DATE}/${ARCHIVE_FILE} && mc cp /backup/${CHECKSUM_FILE_NAME} backup-target/${S3_BUCKET}/${UPLOAD_DATE}/${CHECKSUM_FILE_NAME} && echo 'Upload complete'"

  rm -rf "$MC_CONF_DIR"
  ok "Uploaded: s3://$S3_BUCKET/$UPLOAD_DATE/$ARCHIVE_FILE"
  ok "Uploaded: s3://$S3_BUCKET/$UPLOAD_DATE/$CHECKSUM_FILE_NAME"
}

# ─────────────────────────────────────────────
# Cleanup old local backups
# ─────────────────────────────────────────────
cleanup_old_backups() {
  info "Removing local backups older than ${RETENTION_DAYS} days..."

  local COUNT
  COUNT=$(find "$BACKUP_DIR" -name "sovereign-backup-*.tar.gz" -mtime "+$RETENTION_DAYS" | wc -l)

  if [[ $COUNT -gt 0 ]]; then
    find "$BACKUP_DIR" -name "sovereign-backup-*.tar.gz" -mtime "+$RETENTION_DAYS" -delete
    # Also delete the paired checksum files so they don't accumulate indefinitely.
    find "$BACKUP_DIR" -name "sovereign-backup-*.tar.gz.sha256" -mtime "+$RETENTION_DAYS" -delete
    ok "Removed $COUNT old backup(s)"
  else
    ok "No old backups to remove"
  fi
}

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
print_summary() {
  echo ""
  echo "═══════════════════════════════════════════════════"
  echo -e "  ${GREEN}${BOLD}Backup completed successfully!${NC}"
  echo "═══════════════════════════════════════════════════"
  echo "  Archive: $ARCHIVE_PATH"
  echo "  Date:    $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  echo ""
  echo "  To restore, see: docs/INSTALL.md#restore"
  echo ""
}

# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
main() {
  check_containers
  setup_backup_dir
  backup_postgres
  backup_minio
  compress_backup
  upload_to_s3
  cleanup_old_backups
  print_summary
}

main "$@"
