# Test Coverage Assessment: server

**Date:** 2026-06-11  
**Run:** `yarn test:cov --runInBand --forceExit --detectOpenHandles` — 12 test suites, 262 passed, 4 skipped

---

## Coverage summary

| Metric     | %     |
|------------|-------|
| Statements | 16.13 |
| Branches   | 23.32 |
| Functions  | 10.18 |
| Lines      | 16.05 |

Overall coverage is low because the large untested surface (GraphQL aggregates, auth strategies, workers) dwarfs the well-tested core. The tested areas score well individually; the gap is breadth, not quality.

---

## Uncovered files (0% statements)

### GraphQL aggregates — entire business logic layer

| Aggregate | Files | Approx. lines |
|-----------|-------|---------------|
| `src/graphql/account/` | mutate, object, query | ~408 |
| `src/graphql/backup/` | mutate, object, query | ~1,455 |
| `src/graphql/banner/` | mutate, object, query | ~343 |
| `src/graphql/comment/` | mutate, object, query | ~368 |
| `src/graphql/current/` | mutate, query | ~161 |
| `src/graphql/feedback/` | mutate, object, query | ~380 |
| `src/graphql/file/` | mutate, object, query | ~377 |
| `src/graphql/geography/` | object, query | ~252 |
| `src/graphql/log/` | mutate, object, query | ~329 |
| `src/graphql/user/` | mutate, object, query | ~397 |

Also untested GraphQL infrastructure:
- `src/graphql/pothos.driver.ts` (99 lines)
- `src/graphql/pothos.module.ts` (172 lines)
- `src/graphql/schema.module.ts` (109 lines)

### Auth sub-strategies

| Directory | Files |
|-----------|-------|
| `src/auth/authjs/` | config, controller, middleware, module |
| `src/auth/bearer/` | controller, service, module |
| `src/auth/keycloak/` | controller, service (~193 lines), module (~150 lines) |
| `src/auth/local/` | controller, service (~81 lines), module |
| `src/auth/passport/` | middleware (~100 lines), session.service (~41 lines) |
| `src/auth/super/` | controller, service (~76 lines), module |

Also: `auth.controller.ts`, `auth.service.ts`, `roles.guard.ts`, `websocket.service.ts`

### Background services and workers

| File | Lines |
|------|-------|
| `src/services/backup/backup-discovery.service.ts` | 604 |
| `src/services/backup/backup.service.ts` | 191 |
| `src/worker/backup.service.ts` | 572 |
| `src/worker/backup.controller.ts` | 138 |
| `src/worker/token.guard.ts` | 51 |
| `src/services/seed/seed.service.ts` | 214 |
| `src/services/event/event.service.ts` | 53 |
| `src/api/file.controller.ts` | 222 |

### Other

- `src/main.ts`, `src/schema.ts`, `src/redis.ts`
- `src/logging/logger.service.ts`, `src/logging/logging.service.ts`
- `src/ext/ext.middleware.ts`

---

## Partial coverage

| File | Stmts | Branch | Notes |
|------|-------|--------|-------|
| `src/app.config.ts` | 85.5 | 81.17 | Missing env-var edge cases (L14, 23–51, 332) |
| `src/graphql/builder.service.ts` | 80.7 | 50 | Plugin registration branches (L58–74, 144–153) |
| `src/graphql/pothos.decorator.ts` | 80.95 | 100 | 4 decorator factory functions not called |
| `src/prisma/prisma.service.ts` | 44 | 17.39 | Connection lifecycle (L11–18, 26–77, 93–105) |
| `src/utils/json.ts` | 85.4 | 80 | Edge paths in deep parsing / type guards |
| `src/utils/readSecret.ts` | 62.06 | 25 | Secret resolution fallback paths (L24–26, 39–48, 63) |
| `src/logging/throttled.service.ts` | 7.05 | 0 | Near-zero; only 4 lines covered (L22–281) |
| `src/services/backup/backup-archive.service.ts` | 90.19 | 73.17 | Error paths (L106, 109–111, 174) |
| `src/subscription/subscription.service.ts` | 28.12 | 0 | All subscription methods uncovered (L13, 22–88) |

---

## Recommended next tests

Prioritized by risk and value. Each item references the existing test pattern to follow.

### Priority 1 — GraphQL query/mutation services (highest risk, most business logic)

These are the core API surfaces. Mock `PrismaService` with `jest.fn()` / `jest.Mocked<PrismaClient>` as shown in `prisma.service.test.ts`. Use `Test.createTestingModule()` from `@nestjs/testing` as shown in `log.service.test.ts`.

Start with the simplest aggregates to establish the pattern, then scale:

1. **`src/graphql/log/query.service.ts`** — low-complexity read-only queries; good first target
2. **`src/graphql/user/query.service.ts`** — user listing, filtering — high usage path
3. **`src/graphql/banner/mutate.service.ts` + `query.service.ts`** — simple CRUD, easy to mock
4. **`src/graphql/backup/query.service.ts`** — 728 lines; highest LOC, highest risk

For each aggregate test file, cover:
- Happy path (valid input, DB returns data)
- Not-found / empty result
- Permission/role checks if the resolver uses `@Roles()` / Pothos scope-auth

### Priority 2 — Auth strategies (security-critical)

5. **`src/auth/local/local.service.ts`** — password validation; mock `PrismaService.findUser` and `bcrypt.compare`
6. **`src/auth/bearer/bearer.service.ts`** — JWT validation; mock `AppConfigService` for the JWT secret
7. **`src/auth/roles.guard.ts`** — role guard logic; pure class, testable without NestJS TestingModule
8. **`src/auth/keycloak/keycloak.service.ts`** — Keycloak token exchange; mock HTTP calls

### Priority 3 — Worker and backup services (operational risk)

9. **`src/worker/token.guard.ts`** — 51 lines, guards worker endpoints; straightforward mock of `AppConfigService`
10. **`src/services/backup/backup-discovery.service.ts`** — 604 lines; filesystem I/O; mock `fs` module

### Priority 4 — Logging and utilities

11. **`src/logging/throttled.service.ts`** — only 7% covered; add tests for debounce/throttle timing using `jest.useFakeTimers()`
12. **`src/utils/readSecret.ts`** — branch coverage 25%; test file-read success, file-read failure, env-var fallback, and missing-secret paths using `jest.mock('fs')`

### Out of scope / defer

- `src/main.ts`, `src/schema.ts` — bootstrapping code; not unit-testable without E2E harness
- `src/graphql/pothos.module.ts`, `schema.module.ts` — NestJS DI wiring; covered by integration tests
- Generated code in `prisma/` dist
