# Develop: Quiet Excessive Logging and Fix Test Warnings/Errors

## Summary

Suppress NestJS ConsoleLogger output during server tests, fix any remaining warnings/errors across all workspaces.

---

## 2026-06-15 09:02:33 — Started

**Design doc:** None found in docs/proposed/.

**Problem identified:**
- `server/src/logging/logging.test.ts` — 14+ `InfoLogger` test cases each invoke `infoLogger.info(...)`, which flows through NestJS `ConsoleLogger.printMessages()` → stdout. This is the primary noise source.
- `server/src/app.config.test.ts` — Logger spy tests already use `mockImplementation()`, no fix needed.
- Client: Blueprint 5 Icon warnings already suppressed in `client/jest.setup.ts`.
- Common/Prisma: No console output in tests.

**Decision:** Create `server/jest.setup.ts` that mocks `ConsoleLogger.prototype.printMessages`. Wire via `setupFilesAfterEnv` in `server/package.json`.

---

## 2026-06-15 09:10:00 — Implementation

**Files created:**
- `server/jest.setup.ts` — overrides `ConsoleLogger.prototype.printMessages` via `unknown` cast (method is `protected` so `jest.spyOn` overloads reject it)

**Files modified:**
- `server/package.json` — added `"setupFilesAfterEnv": ["<rootDir>/../jest.setup.ts"]` to jest config

**Checks passed:** `yarn check` (tsc --noEmit) and `yarn lint` clean across all four workspaces.

**Test result:** 20 suites, 311 passed, 4 skipped — zero logger noise.

---

## Status: COMPLETE
