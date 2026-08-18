# Integration Tests — Docker Compose Stack

**Started:** 2026-08-12 08:10

## Goal

Add black-box Playwright integration tests to `scripts/` that run against the full Docker Compose stack as deployed. Tests use browser, GraphQL API, and existing management scripts — no white-box access to containers.

## Design decisions

- Lives in `scripts/` (npm-managed, already has Playwright); no Yarn workspace changes
- Keycloak test users created via admin REST API in `globalSetup`, deleted in `globalTeardown`
- Role assignment via `update-user-role.sh` (existing repo script)
- Session state saved after first OAuth flow and reused by all test projects
- Stack started via `./start-services.sh`; profiles controlled by `COMPOSE_PROFILES` in `.env`

## Progress

### 2026-08-12 08:10 — Started
- Created progress log

### 2026-08-12 08:30 — Complete

All files created. No schema, common, server, or client layers needed — pure addition to `scripts/`.

**Files created/modified:**
- `scripts/package.json` — added `@playwright/test` devDep + `test`/`test:ui`/`verify` scripts
- `scripts/playwright.config.ts` — 4 projects: `setup`, `unauthenticated`, `as-user`, `as-admin`
- `scripts/tests/global-setup.ts` — creates 2 test users in Keycloak via admin REST API
- `scripts/tests/global-teardown.ts` — deletes test users after run
- `scripts/tests/auth.setup.ts` — browser OAuth flow for each test user; calls `update-user-role.sh` for admin elevation
- `scripts/tests/smoke.spec.ts` — 6 unauthenticated checks (HTTP, headers, console errors, Keycloak OIDC, GraphQL probe)
- `scripts/tests/auth.spec.ts` — auth flow tests (redirect, Keycloak handoff, bad credentials, sign-out)
- `scripts/tests/graphql.spec.ts` — `__typename`, `readCurrent`, `readLogs` (user rejected, admin accepted)
- `scripts/tests/ui.spec.ts` — page load, navigation, route access control, user identity display
- `.gitignore` — added `scripts/.auth/`, `scripts/playwright-report/`, `scripts/test-results/`
