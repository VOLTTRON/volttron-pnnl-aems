# Server Tests — Gap Coverage

**Started:** 2026-06-22 08:51

## Scope

Adding unit tests for three identified gaps in the server module:

1. `server/src/graphql/pothos.decorator.ts` — no test file
2. `server/src/services/seed/seed.service.ts` — missing GeoJSON/batch coverage
3. `server/src/subscription/subscription.service.ts` — missing production warning + Redis options

---

## Log

### 2026-06-22 08:51 — Start

No design doc; decisions documented inline in plan.

### 2026-06-22 09:05 — Complete

All three files written and passing.

- `server/src/graphql/pothos.decorator.test.ts` — created (10 tests, all pass)
- `server/src/services/seed/seed.service.test.ts` — added 4 tests (GeoJSON feature transformation, geography id generation, batch remainder flush); all 14 tests pass
- `server/src/subscription/subscription.service.test.ts` — added 7 tests (production in-memory warning, Redis host/port/username/password/db passthrough, no-warning assertions); all pass
- `yarn check` clean

