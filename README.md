# Project Sovereign

> EU-sovereign, open-source document suite — MS Word equivalent with modern UX.

Built on OnlyOffice Document Server with a custom React shell. 100% EU-hostable, no US cloud dependencies, GDPR/NIS2/DORA compliant by design.

## Architecture

```
apps/web/          React + TypeScript frontend shell (custom toolbar, ribbon, UX)
services/collab/   HocusPocus real-time collaboration server (Yjs CRDT)
deploy/            Docker Compose stack (full sovereign deployment)
tests/docx-compat/ DOCX compatibility test suite
```

## Quick Start (Dev)

```bash
# Start OnlyOffice + all services
docker compose -f deploy/docker-compose/docker-compose.yml up -d

# Start frontend
cd apps/web && npm install && npm run dev
```

## Stack

- **Editor engine:** OnlyOffice Document Server (MPL-2.0)
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Collaboration:** Yjs + HocusPocus
- **Auth:** Keycloak (SAML/OIDC/LDAP)
- **Storage:** MinIO (S3-compatible)
- **Database:** PostgreSQL 16
- **Proxy:** Traefik v3
- **Deployment:** Docker Compose (small org) / Helm (enterprise)

## License

Apache 2.0
