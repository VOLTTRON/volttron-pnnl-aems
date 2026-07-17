# Coverage Assessment: server

**Date**: 2026-06-16  
**Run**: `yarn test:cov` — 20 suites, 311 passed / 4 skipped, 0 failed

---

## Coverage summary

Overall figures (from test run — "All files" row not emitted by Jest text reporter but calculated from per-file data):

| Area | Approx. Stmts % | Notes |
|------|-----------------|-------|
| `src/auth` | ~15–48% | Controllers 0%, services partially tested |
| `src/graphql` | ~27% | banner well-tested; account/backup/comment/current/feedback/file/geography/user all 0% |
| `src/logging` | ~16% | logger.service and logging.service both 0% |
| `src/services` | ~21–100% | log.service 100%; backup/event/seed mostly 0% |
| `src/utils` | ~87% | json.ts has branch gaps; readSecret near-complete |
| `src/worker` | ~11% | backup.controller and backup.service 0%; token.guard 96% |

**Estimated overall: ~25–30% statement coverage** (weighted by file sizes).

---

## Uncovered files (0% statement coverage)

### Auth
| File | Size (lines) | Risk |
|------|-------------|------|
| `src/auth/authjs/authjs.middleware.ts` | 59 | High — authentication middleware |
| `src/auth/authjs/authjs.module.ts` | 13 | Low — module wiring |
| `src/auth/bearer/bearer.controller.ts` | 20 | Medium — token endpoint |
| `src/auth/bearer/bearer.module.ts` | 45 | Low |
| `src/auth/keycloak/keycloak.controller.ts` | 36 | High — SSO flow |
| `src/auth/keycloak/keycloak.module.ts` | 150 | Medium |
| `src/auth/keycloak/keycloak.service.ts` | 193 | High — token exchange logic |
| `src/auth/local/local.controller.ts` | 20 | Medium |
| `src/auth/local/local.module.ts` | 29 | Low |
| `src/auth/passport/passport.middleware.ts` | 100 | High — session middleware |
| `src/auth/passport/session.service.ts` | 41 | High — session management |
| `src/auth/super/super.controller.ts` | 23 | Medium |
| `src/auth/super/super.service.ts` | 76 | Medium |

### GraphQL services
| File | Lines | Risk |
|------|-------|------|
| `src/graphql/account/mutate.service.ts` | 159 | High — account mutation logic |
| `src/graphql/account/query.service.ts` | 206 | High |
| `src/graphql/backup/mutate.service.ts` | 369 | High — complex backup flow |
| `src/graphql/backup/query.service.ts` | 728 | High — largest file in module |
| `src/graphql/backup/object.service.ts` | 358 | Medium |
| `src/graphql/comment/mutate.service.ts` | 156 | High |
| `src/graphql/comment/query.service.ts` | 179 | High |
| `src/graphql/current/mutate.service.ts` | 136 | High |
| `src/graphql/current/query.service.ts` | 25 | Medium |
| `src/graphql/feedback/mutate.service.ts` | 147 | High |
| `src/graphql/feedback/query.service.ts` | 193 | High |
| `src/graphql/file/mutate.service.ts` | 155 | High |
| `src/graphql/file/query.service.ts` | 188 | High |
| `src/graphql/geography/query.service.ts` | 210 | Medium |
| `src/graphql/log/mutate.service.ts` | 118 | Medium |
| `src/graphql/user/mutate.service.ts` | 172 | High |
| `src/graphql/pothos.driver.ts` | 99 | Medium |
| `src/graphql/pothos.module.ts` | 172 | Low |
| `src/graphql/schema.module.ts` | 109 | Low |

### Logging
| File | Lines | Risk |
|------|-------|------|
| `src/logging/logger.service.ts` | 80 | Medium — log formatting |
| `src/logging/logging.service.ts` | 88 | Medium |
| `src/logging/throttled.service.ts` | ~281 | Medium — throttle logic |

### Services
| File | Lines | Risk |
|------|-------|------|
| `src/services/backup/backup-discovery.service.ts` | 604 | High — file discovery logic |
| `src/services/backup/backup.service.ts` | 191 | High |
| `src/services/event/event.service.ts` | 53 | Medium |
| `src/services/seed/seed.service.ts` | 214 | Low — dev-only seeding |

### Worker / core
| File | Lines | Risk |
|------|-------|------|
| `src/worker/backup.controller.ts` | 138 | High — worker endpoints |
| `src/worker/backup.service.ts` | 572 | High — largest worker file |
| `src/ext/ext.middleware.ts` | 66 | Medium |
| `src/subscription/subscription.service.ts` | ~88 | Medium |

---

## Partial coverage

Files with tests but significant gaps:

| File | Stmts | Branch | Funcs | Key gaps |
|------|-------|--------|-------|----------|
| `src/graphql/builder.service.ts` | 80.7 | 50 | 58.33 | Schema registration paths (lines 58-74, 144-153) |
| `src/graphql/log/query.service.ts` | 81.57 | 81.25 | 56.25 | Pagination/filter variants (lines 56, 84, 102-105, 126, 150, 172) |
| `src/auth/local/local.service.ts` | 64.44 | 40 | 40 | Login error paths (lines 47-81) |
| `src/auth/bearer/bearer.service.ts` | 100 | 71.42 | 100 | Branch gaps (lines 26, 32) — token validation edge cases |
| `src/utils/json.ts` | 85.4 | 80 | 89.28 | JSON parse error paths |
| `src/services/backup/backup-archive.service.ts` | 90.19 | 73.17 | 100 | Error branches (lines 106, 109-111, 174) |
| `src/graphql/user/query.service.ts` | 24.32 | 0 | 0 | Mostly untested — needs work |
| `src/prisma/prisma.service.ts` | 44 | 17.39 | 33.33 | Connection/retry logic |

---

## Recommended next tests

Priority ordered by risk × lines uncovered:

### High priority

1. **`src/graphql/account/` — query + mutate services**  
   Account management is core to the app. Mock `PrismaService` with `jest.Mocked<PrismaService>`, test happy-path CRUD plus not-found and permission-denied error paths. Existing pattern: `graphql/banner/query.service.test.ts`.

2. **`src/worker/backup.service.ts` (572 lines) + `backup.controller.ts`**  
   Largest untested file. Mock `PrismaService`, `BackupArchiveService`, and file-system calls. Test job dispatch, error propagation, and status reporting.

3. **`src/services/backup/backup-discovery.service.ts` (604 lines)**  
   Discovery logic with file-system and DB calls — high risk for silent regressions. Mock `fs` module + `PrismaService`. Test glob patterns, filtering, and pagination.

4. **`src/auth/keycloak/keycloak.service.ts` (193 lines)**  
   Token exchange, introspection, and role mapping — security-critical. Mock HTTP client (axios or fetch). Test valid token, expired token, introspection failure, and role-parsing paths.

5. **`src/auth/passport/passport.middleware.ts` + `session.service.ts`**  
   Session middleware is on every request path. Test session creation, validation, and expiry.

### Medium priority

6. **`src/graphql/feedback/` + `src/graphql/comment/` services**  
   Similar pattern to banner (already tested). Mock Prisma, test list/get/create/update/delete plus auth guard paths.

7. **`src/graphql/file/` + `src/graphql/backup/` services**  
   File and backup mutation services — mock `PrismaService` + storage clients.

8. **`src/logging/throttled.service.ts`**  
   Throttle logic has an independent algorithmic core — test throttle window, burst behaviour, and reset without real infrastructure.

9. **`src/utils/json.ts` — error branches**  
   JSON parse/validate failures, malformed input, and schema mismatch paths. Pure unit tests, no mocking.

10. **`src/graphql/builder.service.ts` — schema registration paths (lines 58-74, 144-153)**  
    Extend existing `builder.service.test.ts` with tests for plugin registration and schema-build edge cases.

### Low priority

11. **`src/services/seed/seed.service.ts`** — dev-only seeding, low production risk.
12. Module files (`*.module.ts`) — NestJS wiring; typically not unit-tested.
