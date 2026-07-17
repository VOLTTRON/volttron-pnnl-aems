# develop: server tests — object.service + non-GraphQL gaps

**Started**: 2026-06-16 09:03

**Design doc**: `docs/proposed/20260616-071218-assessment-tests-server.md`

## Goal

Add missing test files for:
1. 9 GraphQL `object.service.ts` files (account, banner, comment, feedback, file, geography, log, user, backup)
2. `subscription.service.ts`
3. `event.service.ts`
4. `throttled.service.ts` (stretch)

## Progress

### 2026-06-16 09:03 — Start
- Reading object service sources to understand constructors and mock requirements

### 2026-06-16 09:15 — Layer 1 complete: 9 object.service.test.ts files written
- account, banner, comment, feedback, file, geography, log, user: smoke test + prismaObject/enumType call assertions
- backup: additionally tests 13 enum types, 6 prismaObject calls, 5 objectRef calls, and 24 exported properties

### 2026-06-16 09:20 — Layer 2-4 complete
- subscription.service.test.ts: 11 tests covering all 4 pubsub provider branches + delegation methods
- event.service.test.ts: schedule() flag, task() prisma call, error handling
- throttled.service.test.ts: throttle window, duplicate suppression, timer-based re-allow, disabled mode, all log levels, getStats/clearCache/onModuleDestroy

### 2026-06-16 09:25 — Verification
- Fixed unsubscribe test (subscribe first to get valid ID)
- `yarn test`: 48 suites, 502 passed, 4 skipped, 0 failed ✓
- `yarn check`: clean ✓
