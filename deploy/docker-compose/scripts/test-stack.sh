#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Sovereign Deploy — Stack Health Check Script
# ═══════════════════════════════════════════════════════════════════════════════
# Verifies that all services are running and responding correctly.
# Prints PASS/FAIL for each service.
#
# Usage:
#   ./scripts/test-stack.sh                    # Test running stack
#   ./scripts/test-stack.sh --start            # Start stack then test
#   ./scripts/test-stack.sh --domain docs.example.com  # Test specific domain

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$COMPOSE_DIR/.env"

# Load .env if present
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

DOMAIN="${DOMAIN:-localhost}"
START_STACK=false
TIMEOUT=300   # Wait up to 5 minutes for health checks

# Parse args — use while+shift so --domain VALUE (two-token form) works correctly.
# A for-loop iterator is not advanced by shift, so shift inside for is a no-op.
while [[ $# -gt 0 ]]; do
  case $1 in
    --start)    START_STACK=true ;;
    --domain=*) DOMAIN="${1#*=}" ;;
    --domain)   shift; DOMAIN="${1:-}" ;;
  esac
  shift
done

# ─────────────────────────────────────────────
# Colours and helpers
# ─────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  ${GREEN}[PASS]${NC} $1"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; FAIL=$((FAIL + 1)); }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; WARN=$((WARN + 1)); }
info() { echo -e "  ${BLUE}[INFO]${NC} $1"; }
section() { echo -e "\n${BOLD}$1${NC}"; echo "  $(printf '─%.0s' {1..50})"; }

echo ""
echo -e "${BOLD}${BLUE}Sovereign Stack Health Check${NC}"
echo "  Domain: $DOMAIN"
echo "  $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""

# ─────────────────────────────────────────────
# Optionally start the stack
# ─────────────────────────────────────────────
if $START_STACK; then
  section "Starting Stack"
  cd "$COMPOSE_DIR"
  docker compose up -d --remove-orphans
  info "Stack started. Waiting for services..."
fi

cd "$COMPOSE_DIR"

# ─────────────────────────────────────────────
# Wait for all containers to be healthy
# ─────────────────────────────────────────────
section "Container Health Status"

wait_for_healthy() {
  local CONTAINER=$1
  local ELAPSED=0
  local INTERVAL=5

  while true; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "not_found")

    case "$STATUS" in
      healthy) return 0 ;;
      not_found)
        # Container has no health check — check if it's running
        RUNNING=$(docker inspect --format='{{.State.Running}}' "$CONTAINER" 2>/dev/null || echo "false")
        [[ "$RUNNING" == "true" ]] && return 0 || return 1
        ;;
      unhealthy) return 1 ;;
      starting)
        if [[ $ELAPSED -ge $TIMEOUT ]]; then
          return 1
        fi
        sleep $INTERVAL
        ELAPSED=$((ELAPSED + INTERVAL))
        ;;
      *)
        return 1
        ;;
    esac
  done
}

CONTAINERS=(
  "sovereign-traefik:Traefik (reverse proxy)"
  "sovereign-postgres:PostgreSQL"
  "sovereign-redis:Redis"
  "sovereign-minio:MinIO"
  "sovereign-keycloak:Keycloak"
  "sovereign-onlyoffice:OnlyOffice Document Server"
  "sovereign-web:Sovereign Web App"
)

for ENTRY in "${CONTAINERS[@]}"; do
  CONTAINER="${ENTRY%%:*}"
  LABEL="${ENTRY#*:}"

  if wait_for_healthy "$CONTAINER"; then
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "running")
    pass "$LABEL ($STATUS)"
  else
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "not_found")
    fail "$LABEL (status: $STATUS)"
  fi
done

# ─────────────────────────────────────────────
# HTTP endpoint checks
# ─────────────────────────────────────────────
section "HTTP Endpoint Checks"

check_http() {
  local LABEL=$1
  local URL=$2
  local EXPECTED_CODE=${3:-200}
  local EXTRA_FLAGS=${4:-}

  local RESPONSE_CODE
  # shellcheck disable=SC2086
  RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    --connect-timeout 10 \
    --max-time 30 \
    $EXTRA_FLAGS \
    "$URL" 2>/dev/null || echo "000")

  if [[ "$RESPONSE_CODE" == "$EXPECTED_CODE" ]]; then
    pass "$LABEL → HTTP $RESPONSE_CODE ($URL)"
  else
    fail "$LABEL → HTTP $RESPONSE_CODE (expected $EXPECTED_CODE) — $URL"
  fi
}

# Internal container checks (via Docker network)
info "Testing internal endpoints via Docker exec..."

# PostgreSQL connectivity
if docker exec sovereign-postgres pg_isready -U sovereign -d sovereign -q 2>/dev/null; then
  pass "PostgreSQL — pg_isready"
else
  fail "PostgreSQL — pg_isready"
fi

# Redis ping
REDIS_PASS="${REDIS_PASSWORD:-}"
if docker exec sovereign-redis redis-cli -a "$REDIS_PASS" ping 2>/dev/null | grep -q PONG; then
  pass "Redis — PING/PONG"
else
  fail "Redis — PING/PONG"
fi

# OnlyOffice health check (internal)
if docker exec sovereign-onlyoffice curl -sf http://localhost:80/healthcheck 2>/dev/null | grep -qi "true"; then
  pass "OnlyOffice — /healthcheck (internal)"
else
  fail "OnlyOffice — /healthcheck (internal)"
fi

# Keycloak health check (internal)
if docker exec sovereign-keycloak curl -sf http://localhost:8080/health/ready 2>/dev/null | grep -qi "UP"; then
  pass "Keycloak — /health/ready (internal)"
else
  fail "Keycloak — /health/ready (internal)"
fi

# MinIO health check (internal)
if docker exec sovereign-minio mc ready local 2>/dev/null; then
  pass "MinIO — mc ready local"
else
  warn "MinIO — mc ready local (mc may not be in PATH, checking via curl)"
  if docker exec sovereign-minio curl -sf http://localhost:9000/minio/health/live -o /dev/null 2>/dev/null; then
    pass "MinIO — /minio/health/live"
  else
    fail "MinIO — health check"
  fi
fi

# External checks (via Traefik, requires domain resolution)
if [[ "$DOMAIN" != "localhost" ]] && [[ "$DOMAIN" != "sovereign.example.com" ]]; then
  info "Testing external endpoints via HTTPS..."

  check_http "Web Frontend" "https://$DOMAIN" "200" "--insecure"
  check_http "Web Health API" "https://$DOMAIN/api/health" "200" "--insecure"
  check_http "Auth (Keycloak)" "https://auth.$DOMAIN/health/ready" "200" "--insecure"
  check_http "Document Server" "https://docs.$DOMAIN/healthcheck" "200" "--insecure"
  check_http "HTTP→HTTPS redirect" "http://$DOMAIN" "301"
else
  warn "Skipping external HTTPS checks (domain not configured or is example.com)"
  info "Run with a real domain: ./scripts/test-stack.sh --domain your.domain.com"
fi

# ─────────────────────────────────────────────
# Volume checks
# ─────────────────────────────────────────────
section "Volume Checks"

VOLUMES=(
  "sovereign_postgres-data"
  "sovereign_minio-data"
  "sovereign_keycloak-data"
  "sovereign_onlyoffice-data"
  "sovereign_traefik-certs"
)

for VOL in "${VOLUMES[@]}"; do
  if docker volume inspect "$VOL" &>/dev/null; then
    pass "Volume: $VOL"
  else
    warn "Volume not found: $VOL (normal if using different compose project name)"
  fi
done

# ─────────────────────────────────────────────
# Security checks
# ─────────────────────────────────────────────
section "Security Checks"

# Verify JWT is enabled in OnlyOffice
JWT_STATUS=$(docker exec sovereign-onlyoffice \
  sh -c 'echo $JWT_ENABLED' 2>/dev/null || echo "unknown")
if [[ "$JWT_STATUS" == "true" ]]; then
  pass "OnlyOffice JWT_ENABLED=true"
else
  fail "OnlyOffice JWT_ENABLED is not 'true' (got: $JWT_STATUS) — SECURITY RISK in production"
fi

# Verify no ports directly exposed (only Traefik should be)
EXPOSED_PORTS=$(docker compose ps --format json 2>/dev/null | \
  python3 -c "import sys,json; [print(c.get('Name',''),c.get('Publishers',[])) for c in json.load(sys.stdin)]" \
  2>/dev/null || echo "")

info "Only Traefik should have ports 80/443 exposed externally (check docker compose ps)"

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
section "Summary"
echo ""
TOTAL=$((PASS + FAIL + WARN))
echo -e "  Tests run: $TOTAL"
echo -e "  ${GREEN}PASS: $PASS${NC}"
echo -e "  ${RED}FAIL: $FAIL${NC}"
echo -e "  ${YELLOW}WARN: $WARN${NC}"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo -e "  ${GREEN}${BOLD}Overall: PASS ✓${NC}"
  echo ""
  exit 0
else
  echo -e "  ${RED}${BOLD}Overall: FAIL ✗ — $FAIL check(s) failed${NC}"
  echo ""
  echo "  Run 'docker compose logs <service>' to investigate failures."
  exit 1
fi
