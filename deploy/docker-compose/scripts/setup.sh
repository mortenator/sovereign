#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# Sovereign Deploy — First-Run Setup Wizard
# ═══════════════════════════════════════════════════════════════════════════════
# Usage: ./scripts/setup.sh
# Run this once on a fresh server to configure and start the full stack.
# Requires Docker Engine ≥ 24 and Docker Compose plugin ≥ 2.20.

set -euo pipefail

# ─────────────────────────────────────────────
# Colours
# ─────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Colour

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$COMPOSE_DIR/.env"
ENV_EXAMPLE="$COMPOSE_DIR/.env.example"

banner() {
  echo -e "${BLUE}"
  echo "  ╔═══════════════════════════════════════════╗"
  echo "  ║   Sovereign Document Suite — Setup        ║"
  echo "  ║   EU-Sovereign · Self-Hosted · Secure     ║"
  echo "  ╚═══════════════════════════════════════════╝"
  echo -e "${NC}"
}

step() { echo -e "\n${BOLD}${BLUE}[$1]${NC} $2"; }
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }
ask()  { echo -en "  ${BOLD}$1${NC} "; }

# ─────────────────────────────────────────────
# Step 1: Preflight checks
# ─────────────────────────────────────────────
check_dependencies() {
  step "1/10" "Checking dependencies..."

  if ! command -v docker &>/dev/null; then
    fail "Docker not found. Install from https://docs.docker.com/engine/install/"
  fi
  ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

  if ! docker compose version &>/dev/null; then
    fail "Docker Compose plugin not found. Install: sudo apt install docker-compose-plugin"
  fi
  ok "Docker Compose $(docker compose version --short)"

  if ! command -v openssl &>/dev/null; then
    fail "openssl not found. Install: sudo apt install openssl"
  fi
  ok "openssl present"

  if ! command -v envsubst &>/dev/null; then
    fail "envsubst not found. Install: sudo apt install gettext-base"
  fi
  ok "envsubst present"

  if [[ "$EUID" -eq 0 ]]; then
    warn "Running as root. Consider using a non-root user with docker group access."
  fi
}

# ─────────────────────────────────────────────
# Step 2: Existing .env check
# ─────────────────────────────────────────────
check_existing_env() {
  step "2/10" "Checking existing configuration..."

  if [[ -f "$ENV_FILE" ]]; then
    warn "An existing .env file was found at: $ENV_FILE"
    ask "Overwrite it and regenerate all passwords? [y/N]:"
    read -r OVERWRITE
    if [[ "${OVERWRITE,,}" != "y" ]]; then
      echo ""
      echo "  Keeping existing .env. Starting stack with current configuration..."
      # Source .env so resolve_realm_config can read the variable values.
      # Without this, resolved config files (realm-resolved.json, local-resolved.json,
      # etc.) would be missing on a fresh clone where .env was transferred from
      # another server — causing service startup failures.
      # shellcheck disable=SC1090
      source "$ENV_FILE"
      resolve_realm_config
      start_stack
      exit 0
    fi
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    ok "Backed up existing .env"
  fi
}

# ─────────────────────────────────────────────
# Step 3: Gather configuration
# ─────────────────────────────────────────────
gather_config() {
  step "3/10" "Configuration"
  echo ""

  ask "Enter your domain name (e.g. docs.company.eu):"
  read -r DOMAIN
  [[ -z "$DOMAIN" ]] && fail "Domain name is required."

  ask "Enter your admin email (for Let's Encrypt & notifications):"
  read -r ACME_EMAIL
  [[ -z "$ACME_EMAIL" ]] && fail "Admin email is required."

  warn "Ensure ports 80 and 443 are open and your domain resolves to this server."
  ok "Let's Encrypt TLS will be configured for: $DOMAIN"

  ask "Data region (default: EU-DE):"
  read -r DATA_REGION
  DATA_REGION="${DATA_REGION:-EU-DE}"

  ok "Domain: $DOMAIN"
  ok "Admin email: $ACME_EMAIL"
  ok "Data region: $DATA_REGION"
}

# ─────────────────────────────────────────────
# Step 4: Generate passwords
# ─────────────────────────────────────────────
generate_secrets() {
  step "4/10" "Generating cryptographic secrets..."

  gen_password() { openssl rand -base64 32 | tr -d '/+=\n'; }
  gen_hex()      { openssl rand -hex 32; }

  POSTGRES_PASSWORD=$(gen_password)
  SOVEREIGN_APP_DB_PASSWORD=$(gen_password)
  REDIS_PASSWORD=$(gen_password)
  MINIO_ROOT_PASSWORD=$(gen_password)
  KEYCLOAK_ADMIN_PASSWORD=$(gen_password)
  KEYCLOAK_DB_PASSWORD=$(gen_password)
  KEYCLOAK_CLIENT_SECRET=$(gen_hex)
  ONLYOFFICE_DB_PASSWORD=$(gen_password)
  ONLYOFFICE_JWT_SECRET=$(gen_hex)
  # Dedicated MinIO service account for the web app (least-privilege: sovereign-documents only)
  MINIO_APP_SECRET_KEY=$(gen_hex)

  ok "All passwords generated (64-bit entropy minimum)"
}

# ─────────────────────────────────────────────
# Step 5: Write .env file
# ─────────────────────────────────────────────
write_env() {
  step "5/10" "Writing .env file..."

  cat > "$ENV_FILE" <<EOF
# Sovereign Deploy — Environment Variables
# Generated by setup.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ⚠️  Do not commit this file to version control.

DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
ENVIRONMENT=production
DATA_REGION=${DATA_REGION}

# PostgreSQL
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
# Non-superuser application role for the web app (see config/postgres/init.sh)
SOVEREIGN_APP_DB_PASSWORD=${SOVEREIGN_APP_DB_PASSWORD}

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}

# MinIO
MINIO_ROOT_USER=sovereign
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_REGION=eu-central-1

# Keycloak
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD}
KEYCLOAK_DB_PASSWORD=${KEYCLOAK_DB_PASSWORD}
# OIDC client secret for sovereign-web. Generated on first setup.
KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}

# OnlyOffice
ONLYOFFICE_DB_PASSWORD=${ONLYOFFICE_DB_PASSWORD}
ONLYOFFICE_JWT_SECRET=${ONLYOFFICE_JWT_SECRET}

# MinIO app service account (least-privilege: read/write sovereign-documents bucket only)
# The web app uses these credentials instead of the root MinIO credentials.
MINIO_APP_ACCESS_KEY=sovereign-app
MINIO_APP_SECRET_KEY=${MINIO_APP_SECRET_KEY}

# Web app image
WEB_IMAGE_TAG=latest

# Email (configure after setup)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@${DOMAIN}
SMTP_TLS_MODE=STARTTLS

# Backup (configure after setup)
BACKUP_S3_ENDPOINT=
BACKUP_S3_BUCKET=sovereign-backups
BACKUP_S3_ACCESS_KEY=
BACKUP_S3_SECRET_KEY=
BACKUP_S3_REGION=eu-central-1
BACKUP_RETENTION_DAYS=30
EOF

  chmod 600 "$ENV_FILE"
  ok ".env written and permissions set to 600 (owner-only)"
}

# ─────────────────────────────────────────────
# Step 6: Resolve service configuration templates
# Substitutes secrets and domain into config files that cannot use env vars
# natively (JSON configs, Traefik dynamic files, Redis conf).
# Generated files are .gitignore'd — never committed.
# ─────────────────────────────────────────────
resolve_realm_config() {
  step "6/10" "Resolving service configuration templates..."

  local REALM_TEMPLATE="$COMPOSE_DIR/config/keycloak/realm-export.json"
  local REALM_RESOLVED="$COMPOSE_DIR/config/keycloak/realm-resolved.json"

  export DOMAIN KEYCLOAK_CLIENT_SECRET
  # Pass an explicit variable list to envsubst so that Keycloak's own
  # placeholder syntax (e.g. "${role_default-roles}" in role descriptions)
  # is left untouched. Without the list, envsubst would replace every
  # ${…} pattern — even ones Keycloak expects to see at import time.
  envsubst '${DOMAIN} ${KEYCLOAK_CLIENT_SECRET}' < "$REALM_TEMPLATE" > "$REALM_RESOLVED"
  chmod 600 "$REALM_RESOLVED"
  ok "Keycloak realm config → config/keycloak/realm-resolved.json"

  # OnlyOffice local.json — inject DB password and JWT secret.
  # Mounted as :ro so the entrypoint cannot patch it; we pre-populate the values.
  local OO_TEMPLATE="$COMPOSE_DIR/config/onlyoffice/local.json"
  local OO_RESOLVED="$COMPOSE_DIR/config/onlyoffice/local-resolved.json"

  export ONLYOFFICE_DB_PASSWORD ONLYOFFICE_JWT_SECRET REDIS_PASSWORD DOMAIN
  envsubst '${ONLYOFFICE_DB_PASSWORD} ${ONLYOFFICE_JWT_SECRET} ${REDIS_PASSWORD} ${DOMAIN}' < "$OO_TEMPLATE" > "$OO_RESOLVED"
  chmod 600 "$OO_RESOLVED"
  ok "OnlyOffice config → config/onlyoffice/local-resolved.json"

  # Traefik dynamic routes — Traefik file provider does not support Go template
  # or env var interpolation, so we generate routes.yml from routes.yml.tmpl.
  local ROUTES_TEMPLATE="$COMPOSE_DIR/config/traefik/dynamic/routes.yml.tmpl"
  local ROUTES_RESOLVED="$COMPOSE_DIR/config/traefik/dynamic/routes.yml"

  export DOMAIN
  envsubst '${DOMAIN}' < "$ROUTES_TEMPLATE" > "$ROUTES_RESOLVED"
  ok "Traefik routes → config/traefik/dynamic/routes.yml"

  # Redis config — password in redis-server command is visible in process list
  # and docker inspect. Use a config file instead.
  local REDIS_TEMPLATE="$COMPOSE_DIR/config/redis/redis.conf"
  local REDIS_RESOLVED="$COMPOSE_DIR/config/redis/redis-resolved.conf"

  export REDIS_PASSWORD
  envsubst '${REDIS_PASSWORD}' < "$REDIS_TEMPLATE" > "$REDIS_RESOLVED"
  chmod 600 "$REDIS_RESOLVED"
  ok "Redis config → config/redis/redis-resolved.conf"

  # Traefik static config — Traefik does NOT expand env vars in YAML files,
  # so we pre-process the template here to substitute ${ACME_EMAIL}.
  local TRAEFIK_TEMPLATE="$COMPOSE_DIR/config/traefik/traefik.yml.tmpl"
  local TRAEFIK_RESOLVED="$COMPOSE_DIR/config/traefik/traefik-resolved.yml"

  export ACME_EMAIL
  envsubst '${ACME_EMAIL}' < "$TRAEFIK_TEMPLATE" > "$TRAEFIK_RESOLVED"
  chmod 600 "$TRAEFIK_RESOLVED"
  ok "Traefik static config → config/traefik/traefik-resolved.yml"
}

# ─────────────────────────────────────────────
# Step 7: Pull images
# ─────────────────────────────────────────────
pull_images() {
  step "7/10" "Pulling Docker images (this may take a few minutes)..."
  cd "$COMPOSE_DIR"
  docker compose pull --quiet
  ok "All images pulled"
}

# ─────────────────────────────────────────────
# Step 8: Start the stack
# ─────────────────────────────────────────────
start_stack() {
  step "8/10" "Starting the stack..."
  cd "$COMPOSE_DIR"
  docker compose up -d --remove-orphans
  ok "Stack started"
}

# ─────────────────────────────────────────────
# Step 9: Wait for health checks
# ─────────────────────────────────────────────
wait_healthy() {
  step "9/10" "Waiting for services to become healthy..."
  cd "$COMPOSE_DIR"

  local SERVICES=("sovereign-postgres" "sovereign-redis" "sovereign-minio" "sovereign-keycloak" "sovereign-onlyoffice" "sovereign-web")
  local TIMEOUT=180
  local ELAPSED=0
  local INTERVAL=5

  while true; do
    local ALL_HEALTHY=true

    for SERVICE in "${SERVICES[@]}"; do
      STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$SERVICE" 2>/dev/null || echo "not_found")
      if [[ "$STATUS" != "healthy" ]]; then
        ALL_HEALTHY=false
        break
      fi
    done

    if $ALL_HEALTHY; then
      ok "All services healthy!"
      break
    fi

    if [[ $ELAPSED -ge $TIMEOUT ]]; then
      warn "Timeout waiting for health checks. Services may still be starting."
      warn "Run: docker compose ps  to check service status."
      break
    fi

    echo -n "  Waiting... (${ELAPSED}s / ${TIMEOUT}s)"$'\r'
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
  done
}

# ─────────────────────────────────────────────
# Step 10: Print success summary
# ─────────────────────────────────────────────
print_summary() {
  step "10/10" "Setup complete!"
  echo ""
  echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║           Sovereign is running!                    ║${NC}"
  echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Application:${NC}     https://${DOMAIN}"
  echo -e "  ${BOLD}Auth Console:${NC}    https://auth.${DOMAIN}"
  echo -e "  ${BOLD}Storage Console:${NC} https://storage.${DOMAIN}"
  echo -e "  ${BOLD}Document Server:${NC} https://docs.${DOMAIN}"
  echo ""
  echo -e "  ${BOLD}Keycloak admin:${NC}  admin"
  # NOTE (security tradeoff): The admin password is printed here for first-run
  # convenience. It is also persisted in .env (mode 600). In sensitive
  # environments, omit this line and retrieve the password from .env directly.
  echo -e "  ${BOLD}Keycloak password:${NC} ${KEYCLOAK_ADMIN_PASSWORD:-<see .env>}"
  echo ""
  echo -e "  ${RED}${BOLD}⚠  IMPORTANT: Change the Keycloak admin password immediately!${NC}"
  echo -e "  Login at https://auth.${DOMAIN}/admin and change your credentials."
  echo ""
  echo -e "  ${BOLD}Credentials file:${NC} $ENV_FILE"
  echo -e "  ${YELLOW}⚠  Back up this file securely — it contains all your secrets.${NC}"
  echo ""
  echo -e "  ${BOLD}Next steps:${NC}"
  echo -e "  1. Configure SMTP in .env for email notifications"
  echo -e "  2. Configure backup target in .env and test: scripts/backup.sh"
  echo -e "  3. Run health checks: scripts/test-stack.sh"
  echo -e "  4. Review NIS2/DORA checklist: docs/COMPLIANCE.md"
  echo ""
}

# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
main() {
  banner
  check_dependencies
  check_existing_env
  gather_config
  generate_secrets
  write_env
  resolve_realm_config
  pull_images
  start_stack
  wait_healthy
  print_summary
}

main "$@"
