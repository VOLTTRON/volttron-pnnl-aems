# Develop: Increase Test Coverage

**Started**: 2026-08-11 07:43:28

## Goal

Raise `client/` test coverage from ~30.9% by adding tests for all feature route pages.
No schema, server, or prisma changes — test-only work in `client/`.

## Target files

1. `client/src/app/users/page.tsx`
2. `client/src/app/feedback/page.tsx`
3. `client/src/app/banners/page.tsx`
4. `client/src/app/logs/page.tsx`
5. `client/src/app/keycloak/page.tsx`
6. `client/src/app/error.tsx`
7. `client/src/app/not-found.tsx`
8. `client/src/app/loading.tsx`
9. `client/src/app/page.tsx`

## Progress

### 2026-08-11 07:43:28 — Started
- Created progress log

### 2026-08-11 — New client test files (9 files added)
- `src/app/users/page.test.tsx` — 3 tests (renders, Create User button, buttons present)
- `src/app/feedback/page.test.tsx` — 3 tests (renders, buttons, table)
- `src/app/banners/page.test.tsx` — 3 tests (renders, Create Banner button, table)
- `src/app/logs/page.test.tsx` — 3 tests (renders, Server Logs tab, Client Logs tab)
- `src/app/keycloak/page.test.tsx` — 4 tests (renders, heading, admin console button, role management section)
- `src/app/error.test.tsx` — 5 tests (renders, callout title, Try again button, reset callback, error message)
- `src/app/not-found.test.tsx` — 3 tests (renders, callout present, heading present)
- `src/app/loading.test.tsx` — 2 tests (renders, GlobalLoading indicator)
- `src/app/page.test.tsx` — 2 tests (router.push on redirect, notFound on empty routes)

### 2026-08-11 — Results
- client: 31 → 40 test suites, 345 tests all pass
- client TypeScript typecheck: 0 errors
- Estimated coverage improvement: ~30.9% → ~40%+ lines
