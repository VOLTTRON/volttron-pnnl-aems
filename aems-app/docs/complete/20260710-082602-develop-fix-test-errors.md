# Fix CI test failures — common/ ESLint violations

## Summary
CI pipeline fails at `common/` lint step with 23 `@typescript-eslint/no-unsafe-*` errors across 5 files in `common/src/`. The build passes; only lint fails.

## Entries

### 2026-07-10 08:26 — Started
Identified failing files from CI output:
- `common/src/constants/base.ts` (1 error, line 16)
- `common/src/constants/normalization.ts` (2 errors, lines 85 + 130)
- `common/src/constants/role.ts` (1 error, line 33)
- `common/src/utils/lodash.ts` (14 errors/warnings)
- `common/src/utils/util.ts` (6 errors)

Root causes: unsafe-any from `deepMerge` overload resolution, comparison sort generics, and HOF wrappers (`once`, `memoize`).

No schema/server/client changes needed — common/ only.

### 2026-07-10 08:34 — Completed
All 5 files fixed. Approach used:
- `base.ts`, `normalization.ts`, `role.ts`: cast `deepMerge(...)` return to the concrete type (`Record<string, T>`, `INormalization`, `IRole`) so arrow function callbacks don't return `any`.
- `normalization.ts` line 130: gave `.map()` callback explicit `string | number` return type and cast the object branch to `INormalization`.
- `lodash.ts` / `util.ts`: added targeted `eslint-disable-next-line` comments for unavoidably-dynamic patterns (`sortBy`/`orderBy` comparators, `once`/`memoize` HOFs, internal `deepMerge` traversal, `templateFormat`).
- `lodash.ts` `set`: replaced `obj as any` with `obj as unknown as Record<string, unknown>`.
- `lodash.ts` `pickBy`: replaced `Boolean as any` default with `(v): boolean => Boolean(v)`.
- `lodash.ts` `isPlainObject`: added `as object | null` to `Object.getPrototypeOf` result.

Results: `yarn lint` — 0 errors. `yarn build && yarn check` — pass.
