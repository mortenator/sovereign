# Tech Plan: EU Sovereign Deployment Kit (deploy/)

## Goal
Build the `deploy/docker-compose/` directory — a complete, production-ready Docker Compose stack for self-hosting the Sovereign document suite. One command to go from zero to a fully working, EU-sovereign document platform.

## Stack to Wire Up

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| onlyoffice | onlyoffice/documentserver:latest | 8080 | Document editor engine |
| web | sovereign-web (built from apps/web) | 3000 | Frontend React app |
| collab | sovereign-collab (future) | 3001 | HocusPocus collab server |
| postgres | postgres:16-alpine | 5432 | Database |
| redis | redis:7-alpine | 6379 | Cache + session store |
| minio | minio/minio:latest | 9000/9001 | S3-compatible object storage for docs |
| keycloak | quay.io/keycloak/keycloak:23 | 8081 | Auth (SSO, SAML, OIDC, LDAP) |
| traefik | traefik:v3 | 80/443 | Reverse proxy + TLS termination |

## File Structure to Build

```
deploy/docker-compose/
├── docker-compose.yml           # Main compose file
├── docker-compose.dev.yml       # Dev overrides (no TLS, ports exposed)
├── .env.example                 # All env vars documented
├── config/
│   ├── traefik/
│   │   ├── traefik.yml          # Static config
│   │   └── dynamic/
│   │       └── routes.yml       # Dynamic routing rules
│   ├── keycloak/
│   │   └── realm-export.json    # Pre-configured Sovereign realm
│   ├── postgres/
│   │   └── init.sql             # Initial DB schema
│   └── onlyoffice/
│       └── local.json           # OnlyOffice Document Server config
├── scripts/
│   ├── setup.sh                 # First-run wizard
│   ├── backup.sh                # Backup all data to S3-compatible target
│   ├── restore.sh               # Restore from backup
│   └── update.sh                # Pull latest images + run migrations
└── docs/
    ├── INSTALL.md               # Step-by-step installation guide
    ├── SECURITY.md              # Security hardening guide
    └── COMPLIANCE.md            # NIS2/DORA compliance checklist
```

## docker-compose.yml Key Requirements

### General
- All services on a private `sovereign-net` bridge network
- Only Traefik exposed to external traffic (ports 80, 443)
- Health checks on all services
- Restart policy: `unless-stopped` on all services
- Named volumes for all persistent data

### OnlyOffice Document Server
```yaml
onlyoffice:
  image: onlyoffice/documentserver:latest
  environment:
    - DB_TYPE=postgres
    - DB_HOST=postgres
    - DB_PORT=5432
    - DB_NAME=onlyoffice
    - DB_USER=onlyoffice
    - DB_PWD=${ONLYOFFICE_DB_PASSWORD}
    - REDIS_SERVER_HOST=redis
    - JWT_ENABLED=true
    - JWT_SECRET=${ONLYOFFICE_JWT_SECRET}
    - JWT_HEADER=Authorization
    - JWT_IN_BODY=true
  volumes:
    - onlyoffice-data:/var/www/onlyoffice/Data
    - onlyoffice-logs:/var/log/onlyoffice
    - onlyoffice-fonts:/usr/share/fonts/truetype/onlyoffice
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
```

**Important:** OnlyOffice requires JWT_ENABLED=true for production. The JWT secret must match what the frontend uses to sign document tokens.

### MinIO (Object Storage)
```yaml
minio:
  image: minio/minio:latest
  command: server /data --console-address ":9001"
  environment:
    - MINIO_ROOT_USER=${MINIO_ROOT_USER}
    - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    - MINIO_REGION=eu-central-1
  volumes:
    - minio-data:/data
```

Create a `sovereign-documents` bucket on startup using MinIO mc client in an init container.

### Keycloak
```yaml
keycloak:
  image: quay.io/keycloak/keycloak:23
  command: start-dev --import-realm   # use 'start' for production
  environment:
    - KEYCLOAK_ADMIN=${KEYCLOAK_ADMIN_USER}
    - KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD}
    - KC_DB=postgres
    - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
    - KC_DB_USERNAME=keycloak
    - KC_DB_PASSWORD=${KEYCLOAK_DB_PASSWORD}
    - KC_HOSTNAME=${DOMAIN}
  volumes:
    - ./config/keycloak/realm-export.json:/opt/keycloak/data/import/realm.json
```

### Traefik
```yaml
traefik:
  image: traefik:v3
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./config/traefik/traefik.yml:/etc/traefik/traefik.yml:ro
    - ./config/traefik/dynamic:/etc/traefik/dynamic:ro
    - traefik-certs:/letsencrypt
    - /var/run/docker.sock:/var/run/docker.sock:ro
```

Routing rules:
- `${DOMAIN}` → web frontend (port 3000)
- `docs.${DOMAIN}` → OnlyOffice Document Server (port 8080)
- `auth.${DOMAIN}` → Keycloak (port 8081)
- `storage.${DOMAIN}` → MinIO console (port 9001)

### PostgreSQL
Multiple databases in one instance (for MVP simplicity):
- `sovereign` (main app DB)
- `onlyoffice` (OO document server)
- `keycloak` (Keycloak auth)

Use init.sql to create all three databases and users.

## .env.example
Document every variable with description and safe default:
```
# Domain (set to your domain for production, localhost for dev)
DOMAIN=sovereign.example.com

# Postgres
POSTGRES_PASSWORD=changeme_strong_password

# OnlyOffice
ONLYOFFICE_DB_PASSWORD=changeme
ONLYOFFICE_JWT_SECRET=changeme_jwt_secret_32chars_minimum

# MinIO object storage
MINIO_ROOT_USER=sovereign
MINIO_ROOT_PASSWORD=changeme_minio_password

# Keycloak
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=changeme_admin_password
KEYCLOAK_DB_PASSWORD=changeme

# Email (for notifications, optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@sovereign.example.com

# Let's Encrypt (for TLS)
ACME_EMAIL=admin@sovereign.example.com

# Data residency (informational, for audit reports)
DATA_REGION=EU-DE
```

## config/keycloak/realm-export.json
Pre-configure a `sovereign` realm with:
- Realm name: `sovereign`
- Client: `sovereign-web` (OIDC, confidential)
- Default roles: `admin`, `editor`, `viewer`
- Email login enabled
- Brute force protection enabled
- Session timeout: 8 hours (configurable)

## config/onlyoffice/local.json
Configure OnlyOffice for production use:
- Force JWT auth
- Set storage path
- Configure font list
- Disable telemetry (important for EU sovereignty)
- Set document server URL

## scripts/setup.sh
Interactive first-run wizard:
1. Check Docker + Docker Compose installed
2. Prompt for domain name
3. Prompt for admin email
4. Generate all passwords automatically (openssl rand)
5. Write `.env` file
6. Ask: "Use Let's Encrypt TLS? (y/n)"
7. `docker compose pull` (pull all images)
8. `docker compose up -d`
9. Wait for health checks
10. Print success message with:
    - App URL
    - Admin console URL
    - Default admin credentials
    - "Change your password immediately!" warning
11. Optional: create initial demo document

## docs/COMPLIANCE.md
Checklist format, copy of key requirements from PRD-4:

### NIS2 Checklist
- [ ] All software components listed with versions (see Software Bill of Materials)
- [ ] Audit logging enabled (verify in Admin Console > Audit)
- [ ] Incident reporting: export audit log for any security events
- [ ] Supply chain: all components are open-source (see licenses below)
- [ ] No external US-origin services in this deployment

### DORA Checklist
- [ ] ICT vendor inventory: Sovereign + its open-source dependencies (list provided)
- [ ] Audit rights: self-hosted deployment = you have full access
- [ ] Exit strategy: all documents in DOCX format (open standard), exportable via API
- [ ] Business continuity: backup.sh tested (document test date)
- [ ] Concentration risk: no single US cloud provider dependency

## What to Deliver

1. Complete `docker-compose.yml` with all 8 services, health checks, volumes
2. `docker-compose.dev.yml` override for local development
3. `.env.example` with all variables documented
4. `config/traefik/traefik.yml` and dynamic routes config
5. `config/keycloak/realm-export.json` pre-configured realm
6. `config/postgres/init.sql` creating all 3 databases
7. `config/onlyoffice/local.json` production config
8. `scripts/setup.sh` first-run wizard (interactive, generates .env)
9. `scripts/backup.sh` that backs up postgres + minio to S3-compatible target
10. `docs/INSTALL.md` step-by-step guide (Ubuntu 22.04 + Debian 12)
11. `docs/COMPLIANCE.md` NIS2/DORA checklist

## Testing the Stack
Include a `test-stack.sh` script that:
1. Runs `docker compose up -d`
2. Waits for all health checks to pass
3. Curls the web frontend → expects 200
4. Curls the OO Document Server `/healthcheck` → expects 200
5. Prints PASS/FAIL for each service

## Constraints
- No hardcoded passwords anywhere (all from .env)
- All images pinned to specific versions (not `latest` in production)
- No US-origin telemetry (OO telemetry disabled, Keycloak tracking disabled)
- Air-gap note in INSTALL.md: how to pre-pull images for offline deployment
