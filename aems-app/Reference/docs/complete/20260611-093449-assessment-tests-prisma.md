# Test Coverage Assessment: prisma

**Date:** 2026-06-11  
**Run:** `yarn test:cov` (no tests found — `--passWithNoTests`)

---

## Coverage summary

| Metric     | % |
|------------|---|
| Statements | 0 |
| Branches   | 0 |
| Functions  | 0 |
| Lines      | 0 |

Jest is configured with `--passWithNoTests`, so the suite exits cleanly with 0% coverage. No test files exist in `prisma/src/`.

---

## Uncovered files

| File | Lines | Notes |
|------|-------|-------|
| `src/index.ts` | 114 | PrismaClient factory, singleton, connection helpers |
| `src/pothos.ts` | 429 | Pothos type builders, model type adapters |

---

## Partial coverage

None — no tests exist at all.

---

## Recommended next tests

**Priority: Low.** The prisma module is primarily generated client code (`@prisma/client`) plus type-mapping for Pothos. There is little business logic to break, and the existing `PrismaService` tests in `server/` cover the integration points. However, two areas merit tests:

1. **`src/index.ts` — PrismaClient factory** (medium effort)  
   The module exports a `createPrismaClient` factory and a module-level singleton. Unit test the factory's configuration logic (connection URL assembly, log levels) with a mocked `PrismaClient` constructor, matching the pattern in `server/src/prisma/prisma.service.test.ts`.

2. **`src/pothos.ts` — Pothos builder helpers** (low effort)  
   Pothos builder init and scalar registration are type-level-heavy but include runtime calls (e.g. `builder.addScalarType`). Smoke tests that the builder initialises without throwing would catch regressions in scalar/plugin setup. Use direct instantiation; no NestJS TestingModule needed.

**Defer**: Do not test generated `@prisma/client` types — they are compiled artifacts, not source code.
