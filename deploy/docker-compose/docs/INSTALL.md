# Sovereign Deploy — Installation Guide

Step-by-step installation for **Ubuntu 22.04 LTS** and **Debian 12 (Bookworm)**.

---

## Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Disk | 50 GB SSD | 200 GB SSD |
| OS | Ubuntu 22.04 / Debian 12 | Ubuntu 22.04 LTS |
| Docker Engine | ≥ 24.0 | latest stable |
| Docker Compose plugin | ≥ 2.20 | latest stable |
| Open ports | 80, 443 | — |
| Domain | A DNS record pointing to server IP | Wildcard DNS |

> **EU Sovereignty Note:** Deploy in an EU data centre (e.g. Hetzner DE, OVH FR, IONOS DE) to ensure GDPR compliance and NIS2 data residency requirements.

---

## 1. Server Preparation

### 1.1 Update system packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git openssl ca-certificates gnupg lsb-release
```

### 1.2 Create a dedicated user (recommended)

```bash
sudo useradd -m -s /bin/bash sovereign
sudo usermod -aG docker sovereign
su - sovereign
```

---

## 2. Install Docker Engine

**Ubuntu 22.04:**

```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**Debian 12:**

```bash
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

### Verify installation

```bash
docker --version          # Docker version 24.x.x or later
docker compose version    # Docker Compose version v2.x.x or later
```

---

## 3. Configure DNS

Create the following DNS A records pointing to your server's public IP:

| Record | Type | Value |
|--------|------|-------|
| `sovereign.example.com` | A | `<server-ip>` |
| `auth.sovereign.example.com` | A | `<server-ip>` |
| `docs.sovereign.example.com` | A | `<server-ip>` |
| `storage.sovereign.example.com` | A | `<server-ip>` |

**Or** use a wildcard record (simpler):

```
*.sovereign.example.com  A  <server-ip>
```

DNS propagation can take up to 24 hours. Verify with:

```bash
dig +short sovereign.example.com
dig +short auth.sovereign.example.com
```

---

## 4. Clone the Repository

```bash
git clone https://github.com/sovereign-eu/sovereign.git /opt/sovereign
cd /opt/sovereign/deploy/docker-compose
```

---

## 5. Run the Setup Wizard

The setup wizard handles everything: password generation, `.env` creation, image pulling, and stack startup.

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The wizard will:
1. Check Docker and Docker Compose are installed
2. Ask for your domain name and admin email
3. Ask whether to use Let's Encrypt TLS (say **Y** for production)
4. Generate all passwords automatically using `openssl rand`
5. Write a `.env` file (permissions: `600`)
6. Pull all Docker images
7. Start the stack with `docker compose up -d`
8. Wait for health checks to pass
9. Print URLs and initial credentials

> **First run time:** Pulling images takes 5–15 minutes depending on bandwidth. Starting all services takes 2–3 minutes.

---

## 6. Manual Setup (Alternative to Wizard)

If you prefer full control:

```bash
# Copy and edit environment file
cp .env.example .env
nano .env   # Fill in all values — see .env.example for documentation

# Pull images
docker compose pull

# Start the stack
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

---

## 7. Verify the Installation

Run the health check script:

```bash
chmod +x scripts/test-stack.sh
./scripts/test-stack.sh
```

Expected output:
```
  [PASS] Traefik (reverse proxy) (healthy)
  [PASS] PostgreSQL (healthy)
  [PASS] Redis (healthy)
  [PASS] MinIO (healthy)
  [PASS] Keycloak (healthy)
  [PASS] OnlyOffice Document Server (healthy)
  [PASS] Sovereign Web App (healthy)

  Overall: PASS ✓
```

---

## 8. First Login

1. Open `https://your-domain.com` in your browser
2. You will be redirected to Keycloak for login
3. Go to `https://auth.your-domain.com/admin` to access the Keycloak admin console
4. Log in with username `admin` and the password shown by the setup wizard (also in `.env`)
5. **Change your admin password immediately**

### Create your first user

In Keycloak admin:
1. Navigate to **Users** → **Add User**
2. Enter email address (used as username)
3. Set **Email Verified: On**
4. Under **Credentials**, set a temporary password
5. Assign roles: `admin`, `editor`, or `viewer`

---

## 9. Configure Email (SMTP)

Edit `.env` and set the SMTP variables, then restart:

```bash
nano .env
# Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

docker compose up -d keycloak
```

In the Keycloak admin console, go to **Realm Settings** → **Email** and configure the SMTP settings there too.

---

## 10. Set Up Automated Backups

```bash
chmod +x scripts/backup.sh

# Test a manual backup
./scripts/backup.sh

# Schedule daily backups at 02:00 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/sovereign/deploy/docker-compose/scripts/backup.sh >> /var/log/sovereign-backup.log 2>&1") | crontab -
```

Configure remote backup storage in `.env`:

```bash
BACKUP_S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com
# Or use Hetzner Object Storage, Scaleway, etc.
```

---

## 11. Updates

To update to a newer version:

```bash
cd /opt/sovereign/deploy/docker-compose

# Pull latest images (update versions in docker-compose.yml first)
docker compose pull

# Restart with new images (zero-downtime rolling update)
docker compose up -d --remove-orphans

# Verify
./scripts/test-stack.sh
```

Always back up before updating:

```bash
./scripts/backup.sh
```

---

## 12. Development Mode

For local development without TLS:

```bash
# Copy and edit dev environment
cp .env.example .env
# Set DOMAIN=localhost in .env

# Start with dev overrides
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Services available at:
# Web:           http://localhost:3000
# Keycloak:      http://localhost:8081
# OnlyOffice:    http://localhost:8082
# MinIO console: http://localhost:9001
```

---

## 13. Air-Gap / Offline Deployment

For environments without internet access:

### Pre-pull images on a connected machine

```bash
# Save all images to a tar archive
docker compose pull
docker save \
  traefik:v3.0.4 \
  postgres:16.2-alpine \
  redis:7.2.4-alpine \
  minio/minio:RELEASE.2024-03-15T01-07-19Z \
  minio/mc:RELEASE.2024-03-13T23-51-57Z \
  quay.io/keycloak/keycloak:23.0.7 \
  onlyoffice/documentserver:8.0.1 \
  ghcr.io/sovereign-eu/sovereign-web:latest \
  | gzip > sovereign-images.tar.gz
```

### Transfer to air-gapped server

```bash
scp sovereign-images.tar.gz user@airgap-server:/opt/
```

### Load images on air-gapped server

```bash
gunzip -c /opt/sovereign-images.tar.gz | docker load
```

Then proceed with normal setup (no `docker compose pull` needed).

---

## Troubleshooting

### Container fails to start

```bash
docker compose logs <service-name>
docker compose ps
```

### Keycloak takes too long to start

Keycloak can take 60–120 seconds on first boot (building the optimised image). Wait and check:

```bash
docker compose logs -f keycloak
```

### TLS certificate not issued

1. Verify DNS is pointing to your server: `dig +short your-domain.com`
2. Verify ports 80 and 443 are open: `curl -v http://your-domain.com`
3. Check Traefik logs: `docker compose logs traefik`
4. Check Let's Encrypt rate limits (5 certs per domain per week)

### PostgreSQL init fails

Check that the init script is executable:

```bash
ls -la config/postgres/init.sh
# Should show: -rwxr-xr-x
chmod +x config/postgres/init.sh
```

### Reset everything (destructive)

```bash
docker compose down -v   # ⚠️ Deletes ALL data
docker compose up -d
```

---

## Support

- Documentation: `docs/`
- Issues: https://github.com/sovereign-eu/sovereign/issues
- Security: See `docs/SECURITY.md`
- Compliance: See `docs/COMPLIANCE.md`
