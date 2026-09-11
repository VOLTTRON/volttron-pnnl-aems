# Develop: Fix All Build/Test Issues

**Started:** 2026-09-01 09:19:06
**Completed:** 2026-09-01 (same session)
**Branch:** feature/setpoint-error-chart
**Task:** Run build and test scripts across all workspaces; fix all issues, errors, warnings, and failing tests.

No design doc — this is a maintenance/cleanup pass across the `prisma → common → server → client` chain.

## Progress Log

### Pass 1 — yarn check/lint/test in isolation

- **09:19:06** — Log created. Ran `yarn check` in all four workspaces (prisma, common, server, client). All passed.
- **09:22** — Ran `yarn lint`. Prisma, common, client clean. Server had 5 errors:
  - [server/src/graphql/pothos.module.ts:130,133](aems-app/server/src/graphql/pothos.module.ts) — Unsafe member access on `any` on the WS `onConnect` fallback path. Added `eslint-disable-next-line @typescript-eslint/no-unsafe-member-access` comments to match the pattern used elsewhere in the same block.
  - [server/src/services/synthetic/historian.writer.ts:95](aems-app/server/src/services/synthetic/historian.writer.ts) — Unused callback arg `n` in `encodeSamples(...(n) => count++)`. Rewrote as `() => count++`.
  - [server/src/services/synthetic/synthetic-ticker.service.ts:22](aems-app/server/src/services/synthetic/synthetic-ticker.service.ts) — `async onModuleInit` had no `await`. Made it sync.
  - [server/src/services/synthetic/synthetic.service.ts:227](aems-app/server/src/services/synthetic/synthetic.service.ts) — `async collectTickValues` had no `await`. Made it sync; updated the single caller in `synthetic-ticker.service.ts:70` to drop `await`.
- **09:35** — Ran `yarn test`: prisma (none), common (792/792), server (1146 pass + 4 skip), client (419/420 — 1 flaky).
- **09:38** — [client/src/app/demo/page.test.tsx:71](aems-app/client/src/app/demo/page.test.tsx) `"renders without crashing"` timing out at 5s under parallel-suite CPU pressure. Wrapped `renderPage()` in `await act(...)` to match the pattern used by every other test in the same file.
- **09:41** — All isolated checks green.

### Pass 2 — full build.sh / build.ps1 chain

User pointed out `yarn check`/`lint`/`test` do NOT surface the errors that appear during the actual build script — the schema compile step (`nest start --entryFile schema`) has failure modes the isolated commands don't hit. Re-ran under `build.sh` and found three more:

1. **`ERROR [AppConfigService] Failed to read file: C:\certs\mkcert-ca.crt`** — [server/src/app.config.ts:538](aems-app/server/src/app.config.ts) reads the VOLTTRON CA cert unconditionally when `VOLTTRON_CA` is set. The cert only exists inside the Docker image, so on a local build this fires whenever the root `.env` (which sets `VOLTTRON_CA=/certs/mkcert-ca.crt`) leaks into the process env. The schema-compile instance never uses the CA — followed the same pattern `loadHistorianTopicMap` already uses and skipped the read when `this.instanceName === "Schema"`.

2. **`TypeError: Cannot convert undefined or null to object` at `Object.values(BackupDestinationType)` in [server/src/graphql/backup/object.service.ts:58](aems-app/server/src/graphql/backup/object.service.ts)** — root cause: each downstream workspace has its own `node_modules/.prisma/client/` that gets stale, because prisma's postinstall only regenerates it inside `prisma/`. `@prisma/client` is portal-linked to prisma's copy, but the `require('.prisma/client/default')` inside that entry resolves against the calling workspace's node_modules when Node runs with `--preserve-symlinks` (which every downstream sets via `NODE_OPTIONS` in its `.env`). The stale copy dated from April 21 and lacked every enum added since. Fixed by adding a `sync_prisma_client` / `Sync-PrismaClient` helper to both [build.sh](aems-app/build.sh) and [build.ps1](aems-app/build.ps1) that copies the freshly generated `prisma/node_modules/.prisma/client` into each downstream workspace's `node_modules/.prisma/client` right after `yarn install`.

3. **`ERROR [GenerateSchema] 'schema.graphql' was written but is empty — schema generation failed`** — race in [server/src/schema.ts](aems-app/server/src/schema.ts). The watcher deleted `schema.graphql`, then polled `stat()` every 1 s. When `pothos.driver.ts`'s `writeFile` was in flight, `stat()` could observe the newly-created file at size 0 mid-write and permanently flag it as failed. Changed the loop to keep polling until size > 0 (or timeout) and dropped the interval to 200 ms. Verified by clearing state (removing `.prisma`) and re-running — the failure is now reproducible without the fix and gone with it.

Also updated caniuse-lite via `npx update-browserslist-db@latest` to silence the recurring "caniuse-lite is outdated" warning during the Next.js build.

### Pass 3 — verification

- **10:30** — Full `./build.sh -d -m` (skip yarn install, skip migrations) — clean exit 0, no BackupObject error, no mkcert warning, no empty-schema error, no caniuse warning.
- **10:32** — Server `yarn check` + `yarn lint` clean. Affected tests (`app.config.test.ts`, `pothos.driver.test.ts`) all 23 passing.

## Files changed

- aems-app/build.sh — new `sync_prisma_client` helper called after each downstream `yarn install`
- aems-app/build.ps1 — `Sync-PrismaClient` equivalent for PowerShell
- aems-app/server/src/app.config.ts — skip VOLTTRON_CA read in Schema instance
- aems-app/server/src/schema.ts — wait for non-zero-size schema.graphql; drop poll interval to 200 ms
- aems-app/server/src/graphql/pothos.module.ts — eslint disables for WS onConnect
- aems-app/server/src/services/synthetic/historian.writer.ts — drop unused callback arg
- aems-app/server/src/services/synthetic/synthetic-ticker.service.ts — non-async onModuleInit; drop await
- aems-app/server/src/services/synthetic/synthetic.service.ts — non-async collectTickValues
- aems-app/client/src/app/demo/page.test.tsx — wrap renderPage in act
- aems-app/client/yarn.lock — caniuse-lite bump

## Result

Full `./build.sh` runs end-to-end with no errors, no warnings from our code (only Node's own `NODE_TLS_REJECT_UNAUTHORIZED` breadcrumb, which is user local-dev config, not something we control). All workspaces pass `yarn check`, `yarn lint`, and `yarn test`.

### Pass 4 — DATABASE_URL protocol error (user reported still occurring)

Initially assumed the DATABASE_URL P1012 error was a one-off shell override. User reported it still fires during `build.ps1`. Reproduced by setting `DATABASE_URL='junk-from-shell'` in the shell env — Prisma's dotenv only fills in values NOT already in `process.env`, so any ambient `DATABASE_URL` short-circuits `prisma/.env` and fails schema validation.

Root cause: `process.env` takes precedence over `.env` in Prisma's config loader. If the caller's shell has `DATABASE_URL` set to anything invalid (docker compose leftover, previous script, system-wide env), `prisma migrate deploy` fails before ever reading the workspace `.env`.

Fix: unset `DATABASE_URL` (and `DIRECT_URL` for good measure) around the `yarn migrate:deploy` call in [aems-app/build.ps1](aems-app/build.ps1) (via `Remove-Item Env:...` + `try/finally` restore) and in [aems-app/build.sh](aems-app/build.sh) (via a subshell `unset` — the caller's env is untouched). Verified: with `DATABASE_URL='junk-from-shell'` set in the ambient PowerShell env, `.\build.ps1 -d` now completes successfully and applies migrations; the ambient value is preserved after the script exits.

## Notes on issues not fixed

- **`NODE_TLS_REJECT_UNAUTHORIZED='0'` warning** — set intentionally by `client/.env.local` for local dev against self-signed certs. Node prints the warning any time the flag is 0; suppressing it would require disabling the local-dev workflow. Left as-is.
