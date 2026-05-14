# Backup & Restore

This directory contains the implementation of the daily backup pipeline
for the Docker Compose deployment.

All configuration — policy, destinations, encryption keys, schedule, and
run history — is managed through the **Backups admin UI** at `/backups`.
There is no env-file config surface; everything is stored in the database
(`BackupPolicy`, `BackupDestination`, `BackupRun`, `BackupKey`).

## Architecture

```
┌──────────────────────┐     GraphQL mutations     ┌────────────────────┐
│  client/src/app/     │ ────────────────────────▶ │ BackupPolicy       │
│  backups/page.tsx    │                           │ BackupDestination  │
│  (Admin UI)          │ ◀──────── subscriptions ─ │ BackupRun          │
└──────────────────────┘                           │ BackupKey (Prisma) │
                                                   └──────────┬─────────┘
                                                              │ reads policy.cron
                                                              ▼
                              ┌──────────────────────────────────┐
                              │ server/src/services/backup/      │
                              │ backup.service.ts (NestJS)       │
                              │ - registers CronJob              │
                              │ - enqueues BackupRun rows        │
                              │ - enforces retention             │
                              └────────────────┬─────────────────┘
                                               │ INSERT BackupRun (Queued)
                                               ▼
                              ┌──────────────────────────────────┐
                              │ docker/backup (sidecar)          │
                              │ - entrypoint.sh → init-keys.sh   │
                              │ - worker/index.js claims runs,   │
                              │   spawns backup.sh with DB-      │
                              │   derived CLI flags, streams     │
                              │   NDJSON events back into        │
                              │   BackupComponent /              │
                              │   BackupRunDestination rows      │
                              └────────────────┬─────────────────┘
                                               │ spawns
                                               ▼
                              ┌──────────────────────────────────┐
                              │ backup.sh (repo root)            │
                              │ - discover → stage → archive →   │
                              │   encrypt → upload → prune       │
                              └──────────────────────────────────┘
```

Operators never invoke `backup.sh` directly; it is an executor driven by
the sidecar worker. The only CLI in this system is `backup-restore.sh`,
which exists as a break-glass recovery tool for when the app may be down.

## Directory layout

```
docker/backup/
├── README.md          (this file)
├── Dockerfile         sidecar image
├── entrypoint.sh      calls init-keys.sh, then runs the worker
├── init-keys.sh       generates age keypair on first boot, writes BackupKey row
├── worker/
│   └── index.js       polls BackupRun queue, spawns backup.sh, updates DB
└── lib/
    ├── discover.sh              resolve compose config into a backup plan
    ├── encrypt.sh               age (preferred) / gpg encrypt & decrypt
    ├── backup-postgres.sh       pg_dump wrapper
    ├── backup-mariadb.sh        mariadb-dump wrapper
    ├── backup-volume.sh         tar a named docker volume
    ├── backup-path.sh           tar a host bind-mount source
    ├── destination-local.sh     copy + prune on the default local volume
    └── destination-s3.sh        upload + prune to AWS S3
```

## Pipeline

1. **Discover** — `discover.sh` runs `docker compose config --format json`
   and classifies every service, volume, and bind mount. Every service
   with a volume or bind is considered backup-capable; databases are
   detected by image name (postgres, postgis, mariadb, mysql) for the
   engine-specific dump path. `BackupPolicy.excludeServices` drops entire
   services (and their volumes/binds) from the plan;
   `BackupPolicy.excludeVolumes` and `BackupPolicy.excludePaths` remove
   individual items.
2. **Stage** — Each component is dumped into a per-run staging directory
   (`./backups/staging/<project>-<timestamp>/`) under `databases/`,
   `volumes/`, `paths/`, and `includes/`.
3. **Manifest** — A `manifest.json` is written next to the staged files
   recording project name, run id, UTC timestamp, git SHA, and a
   SHA-256 for every file.
4. **Archive** — The staging directory is tarred and gzipped into a single
   `<project>-<timestamp>.tar.gz`.
5. **Encrypt** — Encryption is mandatory. `encrypt.sh` prefers `age` using
   the public key from the active `BackupKey` row; if unavailable it falls
   back to symmetric `gpg`. The plaintext archive is deleted immediately
   after encryption.
6. **Upload** — For each enabled `BackupDestination` row, the matching
   `destination-*.sh` script copies or uploads the encrypted archive.
7. **Prune** — Per destination, archives older than
   `BackupPolicy.retentionDays` are removed.
8. **Record** — Every step emits NDJSON progress events which the worker
   translates into `BackupComponent` and `BackupRunDestination` rows;
   the final `BackupRun` row captures the archive path, size, SHA-256,
   and manifest. The Runs tab in the admin UI shows the live feed.

Failures abort the run, mark the `BackupRun` row as `Failed`, and leave
the staging directory in place for debugging.

## Data captured

| Category   | Source                                 | Format                 |
| ---------- | -------------------------------------- | ---------------------- |
| Databases  | `pg_dump` / `mariadb-dump` via compose | `<service>.sql.gz`     |
| Volumes    | Named docker volumes                   | `<volume>.tar.gz`      |
| Paths      | Bind-mount source directories          | `<encoded>.tar.gz`     |
| Includes   | Dynamic `.env*` scan + `extraEnvFiles` − `excludeEnvFiles` | `<encoded>.tar.gz` |
| Metadata   | Manifest                               | `manifest.json`        |

Compose-managed metadata (project name, service list, image tags) is
captured in the manifest. Container images themselves are NOT archived —
they are reproducible from the git-tracked compose files.

## Encryption keys

Keys are managed by the sidecar, not by operators. On first boot,
`init-keys.sh` generates an `age` keypair, writes the public key and
fingerprint to a new `BackupKey` row, and stores the private key at
`/host-secrets/age.key` (a bind-mounted path on the host).

Key management actions live in the **Keys** tab of the admin UI:

- View the active key and its fingerprint.
- Rotate to a new key (archives the old one — old backups remain
  restorable with the corresponding old private key).
- Acknowledge the current key (required before the UI reports the policy
  as fully configured).
- Download the private key for offline safekeeping. **Store this
  download somewhere safe and offline** — it is required to decrypt
  backups.

Backups refuse to run if no active key is registered.

## Destinations

Destinations are rows in the `BackupDestination` table managed via the
**Destinations** tab of the admin UI. Each destination has:

- `type`: `local` or `s3`
- `output`: `s3://bucket/prefix/` URL for S3; unused (null) for Local
- `enabled`: toggle without deletion
- `sseMode` / `sseKmsKeyId`: S3 server-side encryption options
- `order`: deterministic upload order

`local` destinations write to the `backup-archives` docker volume mounted
into the sidecar at `/var/lib/backup/archives`. The path is fixed — there
is no per-destination configuration and no host-side mount for operators
to maintain. Inspect the volume contents with
`docker run --rm -v <project>_backup-archives:/d alpine ls /d`.

Retention is applied independently per destination according to
`BackupPolicy.retentionDays`.

## Scheduling

Scheduling is owned by the NestJS `BackupService`
(`server/src/services/backup/backup.service.ts`). It reads
`BackupPolicy.cron` and registers a CronJob that enqueues a new
`BackupRun` row at each fire time. The sidecar worker picks up the
queued row and runs the pipeline.

Update `BackupPolicy.cron` via the **Policy** tab in the admin UI. There
is no host-level cron or Task Scheduler configuration to maintain.

On-demand runs are triggered from the **Runs** tab ("Trigger Backup"),
which inserts a `BackupRun` row with trigger `Manual`.

## Restore

`backup-restore.sh` / `backup-restore.ps1` at the repo root are the
CLI break-glass entry points. They work when the app is down or the UI
is unreachable.

```
./backup-restore.sh \
    --archive ./backups/<project>-<ts>.tar.gz.age \
    --identity /host-secrets/age.key
```

The script:

1. Downloads the archive if it is an `s3://` URL.
2. Decrypts with `age`/`gpg` (chosen by file extension). The decryption
   key comes from `--identity` / `--gpg-key-file` (preferred) or the
   pre-exported `BACKUP_AGE_IDENTITY` / `BACKUP_GPG_KEY_FILE` env vars
   when run from inside the sidecar container.
3. Extracts into a temporary directory and verifies every file against
   `manifest.json`.
4. Prompts for confirmation (skippable with `--force`).
5. Restores the selected components:
   - Databases: streams the dump back into the service via
     `docker compose exec -T <svc> psql` or `mariadb`.
   - Volumes: recreates the named volume if missing, extracts contents
     via a throwaway `alpine:3` container.
   - Paths: extracts at the original absolute path.
   - Includes: extracts relative to the repo root (so a captured `.env`
     lands back at `./.env`).

Restrict scope with `--components databases,volumes` or
`--only servicename1,servicename2`.

The private key needed for decryption lives at `/host-secrets/age.key`
in the sidecar container (bind-mounted to the host so it survives
container restarts) and is also downloadable from the Keys tab of the
admin UI.

## Operational notes

- Every completed run has a row in `BackupRun` with status, duration,
  archive size, SHA-256, per-component breakdown, and per-destination
  upload results. The Runs tab is the canonical monitoring surface.
  Wire alerts off the database (or GraphQL subscription) rather than a
  log file.
- Databases are dumped from a running container via
  `docker compose exec`. The target service must be healthy at backup
  time; if it is not, the component is marked `Failed` on the run.
- Large volumes that are regenerable caches (tile caches, upstream data
  mirrors) should be added to `BackupPolicy.excludeVolumes` so they
  don't bloat archives.
- The backup sidecar is a core service (no compose profile gate), so a
  standard `docker compose up -d` from the repo root starts it along
  with everything else.
