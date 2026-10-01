# Develop: Increase Test Coverage

**Started**: 2026-08-05 10:38:30

## Goal

Raise test coverage in `common/` (branch gaps) and `client/` (many untested components and pages).

No schema/server changes. Test-only work.

---

## Plan

### Common — branch coverage gaps
- `common/src/utils/util.ts` → lines 104, 112, 141, 149–154, 163
- `common/src/utils/color.ts` → lines 249, 613
- `common/src/constants/normalization.ts` → lines 81, 87–88
- `common/src/constants/role.ts` → line 31
- `common/src/utils/tree.ts` → line 49

### Client — new test files (priority order)
1. `src/app/routes.test.ts`
2. `src/app/components/providers/graphql.test.tsx`
3. `src/app/components/providers/logging.test.tsx`
4. `src/app/components/common/preferences.test.tsx`
5. `src/app/components/common/file.test.tsx`
6. `src/app/about/page.test.tsx`
7. `src/app/auth/login/page.test.tsx`
8. `src/app/auth/denied/page.test.tsx`

---

## Progress

### 2026-08-05 10:38:30 — Started
- Created progress log

### 2026-08-05 — Common branch coverage
- Added `deepMerge` null/undefined target tests to `util.test.ts`
- Added `printEnvironment()` no-args (console.log) test to `util.test.ts`
- Added `Color.parse("name", value)` 2-arg overload tests to `color.test.ts`
- Added HSL `l > 0.5` branch test to `color.test.ts`
- Added `isAncestor(self)` self-reference test to `tree.test.ts`
- Result: common branch coverage 85.44% → 87.32%

### 2026-08-05 — Client new test files
- `src/app/routes.test.ts` — 11 tests for staticRoutes tree
- `src/app/components/providers/graphql.test.tsx` — 2 tests (mocked Apollo + graphql-ws)
- `src/app/components/providers/logging.test.tsx` — 3 tests
- `src/app/components/common/preferences.test.tsx` — 4 tests
- `src/app/components/common/file.test.tsx` — 7 tests
- `src/app/about/page.test.tsx` — 5 tests
- `src/app/auth/login/page.test.tsx` — 1 test
- `src/app/auth/denied/page.test.tsx` — 2 tests

### 2026-08-05 — Results
- client: 23 → 31 test suites, 317 tests all pass
- client statement coverage: ~10-15% → 30.93%
- client TypeScript typecheck: 0 errors
- common: 768 tests all pass
- common branch coverage: 85.44% → 87.32%

