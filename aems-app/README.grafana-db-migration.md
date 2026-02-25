# Grafana-DB to Historian Migration Guide

This guide explains how to migrate historical data from the legacy `grafana-db` service to the new `historian` service.

## Overview

In the current feature branch, the `grafana-db` service was renamed to `historian`. To migrate existing data from the old `grafana-db` volume to the new `historian` database, use the temporary Docker Compose file and migration script provided.

## Prerequisites

- The legacy `grafana-db-data` Docker volume must exist with your historical data
- The `historian` service must be running (from main `docker-compose.yml`)
- Access to the `aems-app` directory

## Migration Workflow

### 1. Verify the Legacy Volume Exists

```bash
docker volume ls | grep grafana-db
```

You should see a volume like `aems-app_grafana-db-data`.

### 2. Start the Temporary grafana-db Service

```bash
cd aems-app
docker compose -f docker-compose.grafana-db.yml up -d
```

This starts a temporary PostgreSQL container that:
- Uses the container name `aems-app-grafana-db` (matches migration script defaults)
- Mounts the existing `grafana-db-data` volume
- Exposes port 5433 (to avoid conflicts with historian on 5432)
- Automatically picks up environment variables from the base `.env` file

### 3. Verify Both Services Are Running

```bash
docker ps | grep -E "grafana-db|historian"
```

You should see both:
- `aems-app-grafana-db` (temporary, port 5433)
- `aems-app-historian` (production, port 5432)

### 4. Run the Migration Script

```bash
./migrate-historian-data.sh
```

The script will:
- Verify both containers are accessible
- Show statistics from source and target databases
- Export data from grafana-db using `pg_dump`
- Import data to historian with conflict handling (skips duplicates)
- Verify the migration was successful
- Generate a detailed log file

#### Migration Script Options

```bash
# Verify current state without migrating
./migrate-historian-data.sh --verify-only

# Dry run to see what would happen
./migrate-historian-data.sh --dry-run

# Show help
./migrate-historian-data.sh --help
```

### 5. Verify Migration Results

The script provides a summary at the end:
```
Migration completed successfully!
  Source: X data records, Y topics
  Target before: A data records, B topics
  Target after: C data records, D topics
  Records migrated: N data records, M topics
```

### 6. Stop the Temporary Service

Once migration is complete and verified:

```bash
docker compose -f docker-compose.grafana-db.yml down
```

This stops and removes the temporary grafana-db container. **The data volume is preserved** in case you need to re-run the migration.

## Troubleshooting

### "Source container is not running"

Make sure you started the temporary service:
```bash
cd aems-app
docker compose -f docker-compose.grafana-db.yml up -d
```

### "Target container is not running"

Ensure the historian service is running:
```bash
cd aems-app/docker
docker compose up -d historian
```

### Port Conflicts

If port 5433 is already in use, you can modify `docker-compose.grafana-db.yml` to use a different port:
```yaml
ports:
  - 5434:5432  # Changed from 5433
```

### Volume Not Found

If you get a volume not found error, list available volumes:
```bash
docker volume ls
```

Then update the volume name in `docker-compose.grafana-db.yml` to match your actual volume name.

## Files

- `docker-compose.grafana-db.yml` - Temporary compose file for grafana-db service (in aems-app directory)
- `migrate-historian-data.sh` - Migration script (in aems-app directory)
- `docker/README.grafana-db-migration.md` - This guide

## Clean Up

After successful migration, you can optionally remove the legacy volume (only if you're certain you won't need it):

```bash
# CAUTION: This permanently deletes the old data
docker volume rm aems-app_grafana-db-data
```

## Technical Details

- **Database**: Both services use the same database name (`historian`) and credentials
- **Schema**: The migration uses `topics` and `data` tables with identical structures
- **Conflict Handling**: INSERT statements use `ON CONFLICT DO NOTHING` to skip duplicates
- **Data Preservation**: Existing data in the target database is never overwritten
- **Idempotent**: Safe to run multiple times - only new data will be inserted

## Support

For issues or questions, refer to the migration script's log file (created in the aems-app directory with timestamp) for detailed information about the migration process.
