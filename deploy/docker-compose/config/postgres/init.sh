#!/bin/bash
# Sovereign Deploy — PostgreSQL Initialization Script
# Executed by the postgres Docker entrypoint on first startup.
# Creates all required databases and users from environment variables.
# Env vars (ONLYOFFICE_DB_PASSWORD, KEYCLOAK_DB_PASSWORD) must be passed
# to the postgres service in docker-compose.yml.

set -euo pipefail

echo "==> Sovereign: Initializing PostgreSQL databases..."

# Ensure sovereign user and database exist (idempotent — postgres entrypoint may have already created them)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tc \
  "SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'sovereign'" | grep -q 1 || \
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "CREATE ROLE sovereign WITH LOGIN PASSWORD '${POSTGRES_PASSWORD}';"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'sovereign'" | grep -q 1 || \
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE sovereign
    OWNER = sovereign
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;
  GRANT ALL PRIVILEGES ON DATABASE sovereign TO sovereign;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

  -- ─────────────────────────────────────────────
  -- OnlyOffice Database & User
  -- ─────────────────────────────────────────────
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'onlyoffice') THEN
      CREATE ROLE onlyoffice WITH LOGIN PASSWORD '${ONLYOFFICE_DB_PASSWORD}';
      RAISE NOTICE 'Created onlyoffice role';
    ELSE
      ALTER ROLE onlyoffice WITH PASSWORD '${ONLYOFFICE_DB_PASSWORD}';
      RAISE NOTICE 'Updated onlyoffice role password';
    END IF;
  END
  \$\$;

  -- ─────────────────────────────────────────────
  -- Keycloak Database & User
  -- ─────────────────────────────────────────────
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'keycloak') THEN
      CREATE ROLE keycloak WITH LOGIN PASSWORD '${KEYCLOAK_DB_PASSWORD}';
      RAISE NOTICE 'Created keycloak role';
    ELSE
      ALTER ROLE keycloak WITH PASSWORD '${KEYCLOAK_DB_PASSWORD}';
      RAISE NOTICE 'Updated keycloak role password';
    END IF;
  END
  \$\$;

EOSQL

# Create onlyoffice database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'onlyoffice'" | grep -q 1 || \
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE onlyoffice
    OWNER = onlyoffice
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;
  GRANT ALL PRIVILEGES ON DATABASE onlyoffice TO onlyoffice;
EOSQL

# Create keycloak database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'keycloak'" | grep -q 1 || \
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE keycloak
    OWNER = keycloak
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;
  GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
EOSQL

# Enable extensions in sovereign DB
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "sovereign" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
  GRANT ALL ON SCHEMA public TO sovereign;
EOSQL

# Set schema permissions for onlyoffice DB
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "onlyoffice" <<-EOSQL
  GRANT ALL ON SCHEMA public TO onlyoffice;
EOSQL

# Set schema permissions for keycloak DB
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "keycloak" <<-EOSQL
  GRANT ALL ON SCHEMA public TO keycloak;
EOSQL

echo "==> Sovereign: PostgreSQL initialization complete."
echo "    Databases: sovereign, onlyoffice, keycloak"
