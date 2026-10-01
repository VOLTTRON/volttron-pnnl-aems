# develop: server tests

## Goal

Add tests for untested auth controllers, auth decorators, and the HTTP logging interceptor.

## Files created

- `server/src/auth/bearer/bearer.controller.test.ts`
- `server/src/auth/local/local.controller.test.ts`
- `server/src/auth/super/super.controller.test.ts`
- `server/src/auth/keycloak/keycloak.controller.test.ts`
- `server/src/auth/authjs/authjs.controller.test.ts`
- `server/src/auth/public.decorator.test.ts`
- `server/src/auth/roles.decorator.test.ts`
- `server/src/auth/user.decorator.test.ts`
- `server/src/logging/logging.interceptor.test.ts`

## Log

### 2026-06-22T08:28:26 — Started
No design doc found; proceeding from codebase exploration.
Writing 9 new test files (server layer only, no production code changes).

### 2026-06-22T08:35:00 — Complete
- 9 test suites, 29 tests — all passed
- `yarn check` in server/ — exit 0
- No production code changes made
