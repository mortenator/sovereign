# Sovereign Deploy — Compliance Checklist

EU regulatory compliance reference for NIS2 and DORA.
Last reviewed: 2026-02-27

> **Note:** This checklist covers the *deployment* layer. Your organisation's processes, policies, and governance structures are equally important for full compliance. Consult qualified legal and cybersecurity counsel.

---

## NIS2 Compliance Checklist

The EU Network and Information Security Directive 2 (NIS2/EU 2022/2555) applies to essential and important entities in the EU. Self-hosting Sovereign addresses several key requirements.

### Article 21 — Cybersecurity Risk Management Measures

#### a) Policies on Risk Analysis and Security

- [ ] Security policy document created and approved by management
- [ ] Annual risk assessment conducted and documented
- [ ] Sovereign deployment included in asset inventory
- [ ] All software components listed with versions (see **Software Bill of Materials** below)

#### b) Incident Handling

- [ ] Incident response procedure documented
- [ ] Audit logging enabled — verify in Keycloak Admin Console → Events
- [ ] OnlyOffice access logs reviewed monthly (`docker compose logs onlyoffice`)
- [ ] Contact information for national CERT/CSIRT recorded
- [ ] Significant incident reporting process established (72-hour reporting requirement)

To export audit logs for incident investigation:
```bash
docker exec sovereign-postgres psql -U sovereign -c \
  "COPY (SELECT * FROM audit_log WHERE created_at > NOW() - INTERVAL '30 days') TO STDOUT CSV HEADER" \
  > audit-export-$(date +%Y%m%d).csv
```

#### c) Business Continuity

- [ ] `scripts/backup.sh` configured and tested — document test date: ___________
- [ ] Backup restoration tested (restore procedure in `docs/INSTALL.md#restore`)
- [ ] Recovery Time Objective (RTO) defined: ___________
- [ ] Recovery Point Objective (RPO) defined: ___________
- [ ] Backup stored in separate physical location from primary

#### d) Supply Chain Security

- [ ] All components are open-source with known licenses (see table below)
- [ ] No US-origin proprietary SaaS in this deployment
- [ ] Docker image digests pinned in `docker-compose.yml` (optional but recommended)
- [ ] Container image vulnerability scanning performed: `docker scout cves`

#### e) Network Security

- [ ] Only Traefik exposed externally (ports 80, 443)
- [ ] All inter-service communication on private `sovereign-net` bridge
- [ ] TLS 1.2+ enforced (configured in `config/traefik/dynamic/routes.yml`)
- [ ] Firewall rules restrict inbound traffic to 80, 443, and SSH only
- [ ] `ufw allow 22,80,443/tcp` applied

```bash
# Verify firewall
sudo ufw status
# Verify only Traefik ports exposed
docker compose ps --format "table {{.Name}}\t{{.Ports}}"
```

#### f) Authentication and Access Control

- [ ] Multi-factor authentication enabled in Keycloak (Realm Settings → Authentication)
- [ ] Brute-force protection enabled (configured in `realm-export.json`)
- [ ] Session timeout set to 8 hours maximum (configured in realm)
- [ ] Password policy enforced: min 12 chars, upper/lower/digit/special
- [ ] Role-based access: admin / editor / viewer
- [ ] Admin accounts reviewed quarterly

#### g) Cryptography

- [ ] TLS certificates via Let's Encrypt (free, auto-renewing)
- [ ] OnlyOffice JWT enabled (`JWT_ENABLED=true` in `.env`)
- [ ] Passwords generated with `openssl rand` (64-bit entropy)
- [ ] `.env` file permissions set to `600` (owner-only)

#### h) Human Resources Security

- [ ] Staff with access to admin credentials identified
- [ ] Access revoked immediately upon staff departure
- [ ] Security awareness training for all platform users

#### i) Asset Management

- [ ] Server hardware included in asset register
- [ ] Docker host OS patching schedule defined: ___________

#### j) Monitoring and Logging

- [ ] Traefik access logs enabled (configured in `config/traefik/traefik.yml`)
- [ ] Keycloak audit events enabled (configured in `realm-export.json`)
- [ ] Log retention policy defined (default: 30 days in containers)
- [ ] Alerting configured for failed logins (via Keycloak events → SMTP)

---

## DORA Compliance Checklist

The EU Digital Operational Resilience Act (DORA/EU 2022/2554) applies primarily to financial entities. If your organisation is subject to DORA, self-hosting Sovereign addresses the following:

### Article 6 — ICT Risk Management Framework

- [ ] Sovereign included in ICT risk register
- [ ] Risk owner assigned for this deployment
- [ ] ICT-related incident classification criteria defined

### Article 8 — Identification

- [ ] ICT asset inventory includes: server, Docker host, all containers (listed below)
- [ ] Data flows mapped: document storage path (user → web → MinIO → postgres)
- [ ] Dependencies mapped (see Software Bill of Materials)

### Article 9 — Protection

- [ ] Access controls implemented (Keycloak RBAC)
- [ ] Data encrypted in transit (TLS via Traefik)
- [ ] Data at rest encryption: configure LUKS on server disk (OS-level)
- [ ] Network segmentation: private bridge network in place

### Article 10 — Detection

- [ ] Anomaly detection: review Keycloak login failure events weekly
- [ ] Security event log aggregation: consider shipping to SIEM (optional)

### Article 11 — Response and Recovery

- [ ] ICT-related incident response plan documented
- [ ] Backup and recovery tested — test date: ___________
- [ ] Communication plan for incidents affecting clients

### Article 12 — Backup Policies

- [ ] `scripts/backup.sh` scheduled (daily recommended)
- [ ] Backup integrity verified: `tar -tzf backup-file.tar.gz`
- [ ] Backup stored off-site or in separate data centre
- [ ] Backup retention period documented: 30 days (configurable via `BACKUP_RETENTION_DAYS`)

### Article 17 — ICT-Related Incident Management

- [ ] Incident classification scheme defined
- [ ] Internal escalation process documented
- [ ] External reporting obligations to supervisory authority noted

### Article 28 — ICT Third-Party Risk

- [ ] Vendor register includes all open-source components (see table below)
- [ ] Exit strategy documented: all documents in DOCX (ISO 29500) format
- [ ] Data portability: bulk export available via MinIO S3 API
- [ ] Concentration risk: no single US cloud provider dependency

Exit procedure:
```bash
# Export all documents from MinIO to local filesystem
docker run --rm --network sovereign-net \
  -v /tmp/export:/export \
  minio/mc:RELEASE.2024-03-13T23-51-57Z \
  mc mirror sovereign/sovereign-documents /export/
```

---

## Software Bill of Materials (SBOM)

| Component | Version | License | Purpose | EU/Non-EU |
|-----------|---------|---------|---------|-----------|
| Traefik | v3.0.4 | MIT | Reverse proxy | EU (Containous, FR) |
| PostgreSQL | 16.2 | PostgreSQL License | Database | EU/US OSS |
| Redis | 7.2.4 | BSD 3-Clause | Cache | US OSS |
| MinIO | RELEASE.2024-03-15 | AGPL-3.0 | Object storage | US OSS |
| Keycloak | 23.0.7 | Apache 2.0 | Identity management | EU/US OSS |
| OnlyOffice Document Server | 8.0.1 | AGPL-3.0 | Document editor | EU (Ascensio, LV) |
| Ubuntu / Debian | 22.04 / 12 | Various | Host OS | EU/US OSS |
| Docker Engine | ≥ 24.0 | Apache 2.0 | Container runtime | US OSS |

> All components are open-source. No proprietary US SaaS or closed telemetry in production configuration.

---

## Data Residency Declaration

```
Data controller: [Your Organisation Name]
Data processor:  Self-hosted (no third-party processor)
Data location:   [EU Data Centre Name, Country]
Data region:     ${DATA_REGION} (set in .env)

Document data:   Stored in MinIO (sovereign-net, local volumes)
User data:       Stored in PostgreSQL (sovereign-net, local volumes)
Auth tokens:     Stored in Redis (sovereign-net, local volumes, TTL: 8h)
TLS certs:       Stored in Traefik volume (Let's Encrypt, EU-CA acceptable)

No data is transmitted to:
  - US cloud providers (AWS, Azure, GCP, etc.)
  - OnlyOffice telemetry servers (disabled in local.json)
  - Keycloak analytics (disabled)
  - Traefik telemetry (disabled: sendAnonymousUsage: false)
```

---

## Annual Review Checklist

Complete this review annually or after any significant change:

- [ ] All software versions updated (check for CVEs)
- [ ] SSL certificates valid and auto-renewing (check Traefik logs)
- [ ] Backup restoration test performed and documented
- [ ] Access control review: remove departed users
- [ ] Password rotation for service accounts (update `.env`, restart services)
- [ ] Penetration test or vulnerability scan performed
- [ ] SBOM updated with current versions
- [ ] Incident log reviewed for patterns
- [ ] Compliance documentation updated

---

## Useful Commands for Compliance Evidence

```bash
# Show all running containers with versions
docker compose images

# Show all open ports (verify only 80/443 exposed)
docker compose ps --format "table {{.Name}}\t{{.Ports}}"

# Export Keycloak audit log
docker exec sovereign-keycloak \
  curl -s http://localhost:8080/admin/realms/sovereign/events \
  -H "Authorization: Bearer <admin-token>" > keycloak-audit.json

# Verify TLS certificate
echo | openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null \
  | openssl x509 -noout -dates -subject -issuer

# Verify JWT is enabled in OnlyOffice
docker exec sovereign-onlyoffice sh -c 'echo "JWT_ENABLED=$JWT_ENABLED"'

# Check no external connections from containers
docker exec sovereign-onlyoffice ss -tn | grep ESTABLISHED
```
