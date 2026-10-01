# Develop: Server Test Coverage (P1–P3)

**Started:** 2026-06-11 10:40:14  
**Design doc:** `docs/in-progress/20260611-093449-assessment-tests-server.md`

## Goal

Add unit tests for the highest-risk untested server files, raising statement coverage from ~16% toward ~25–30%.

## Target files

- `src/utils/readSecret.ts` → P1
- `src/auth/roles.guard.ts` → P1
- `src/worker/token.guard.ts` → P1
- `src/auth/local/local.service.ts` → P2
- `src/auth/bearer/bearer.service.ts` → P2
- `src/graphql/log/query.service.ts` → P3
- `src/graphql/banner/query.service.ts` → P3
- `src/graphql/banner/mutate.service.ts` → P3

---

## Progress log

### [10:40] Setup
- Moved design doc to `docs/in-progress/`
- Created this progress log

### [10:52] Implementation complete — 8 suites, 49 tests, all passing

Created test files:
- `src/utils/readSecret.test.ts` — 6 tests covering all fallback paths
- `src/auth/roles.guard.test.ts` — 7 tests covering role grant logic
- `src/worker/token.guard.test.ts` — 7 tests covering token comparison / error paths
- `src/auth/local/local.service.test.ts` — 5 tests (mocked passport-local + @auth/express ESM)
- `src/auth/bearer/bearer.service.test.ts` — 6 tests (mocked passport-http-bearer)
- `src/graphql/log/query.service.test.ts` — 6 tests extracting inline resolvers via builder mock
- `src/graphql/banner/query.service.test.ts` — 7 tests
- `src/graphql/banner/mutate.service.test.ts` — 5 tests verifying mutation + subscription publish

Notable fix: `@auth/express/providers/credentials` is ESM-only — required explicit jest.mock() to prevent parse error.
Notable design: bearer `validate()` has no try/catch, so invalid JWT causes a thrown rejection (not null return) — test updated to expect rejection.

**Moved docs to `docs/complete/`.**
