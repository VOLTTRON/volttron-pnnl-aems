# Documentation Reconciliation Progress Log

Started: 2026-07-10 07:35:14

## Scope

Pure documentation pass — no schema changes, no code changes, no build steps required. Reconciling README files, CLAUDE.md files, `.clinerules`, and `.claude/architecture/` docs against the actual codebase state on `feature/rotate-secrets`.

---

## Group 1 — High-severity correctness errors

### docker/CLAUDE.md + .claude/architecture/docker.md — profile names
Status: COMPLETE — Fixed `keycloak`→`sso`, `nominatim`→`nom` in docker/CLAUDE.md and architecture/docker.md. Also updated architecture doc with services/seeders/backup rows, Redis 6.2, server port 3000, worker_token secret.

### prisma/.clinerules — wrong path + npx usage
Status: COMPLETE — Fixed path to `prisma/prisma/models/`, replaced `npx prisma generate` → `yarn build`.

### server/src/auth/README.md — replace with project-specific content
Status: COMPLETE — Replaced generic NextAuth.js v4 Pages Router tutorial with project-specific strategy table and pointers to auth.md.

### client/README.md — dev script, localhost URL, gql, code examples
Status: COMPLETE — Rewrote to remove ~850 lines of code examples. Fixed dev server description (`server.cjs`), hostname requirement, gql inline usage warnings. Version badges retained (already correct).

---

## Group 2 — Architecture docs missing new infrastructure

### .claude/architecture/docker.md — services/seeders/backup, Redis image, port, worker_token
Status: COMPLETE — Done alongside Group 1 docker fix.

### .claude/architecture/common.md — add lodash.ts, math.ts
Status: COMPLETE — Added `lodash.ts` and `math.ts` to utils layout description.

### .claude/architecture/server.md — readSecret, schema-app.module.ts, start:redis
Status: COMPLETE — Added `readSecret.ts`, `schema-app.module.ts`, and `start:redis` references.

---

## Group 3 — Minor/informational fixes

### Root CLAUDE.md, client/.clinerules, prisma/README.md, server/README.md, client/src/app/api/README.md, root .clinerules, version badges
Status: COMPLETE
- Root CLAUDE.md: Added `scripts/` to monorepo layout, correct profile names in step 2.
- client/.clinerules: Fixed dev server commands, fixed `compile:schema`→`compile:graphql`.
- root .clinerules: Added `develop` PR target branch, `docker compose up -d` from repo root note.
- prisma/README.md: Fixed `prisma/models/`→`prisma/prisma/models/`, removed `--create-only`, removed `db:seed`/`studio`/`yarn generate` stale scripts.
- server/README.md: Removed Swagger references, fixed port 3001→3000, fixed testRegex `spec`→`test`.
- client/src/app/api/README.md: Expanded cryptic one-liner with full explanation.
- Version badges: NestJS 11.1.19, Apollo Server 4.13.0 updated in server/README.md.

---

## Final

All 13 files changed. `git diff --stat HEAD` confirms only `.md` and `.clinerules` files modified.

## Entries
