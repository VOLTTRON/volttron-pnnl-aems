# Refactor: replace `lodash` with `@local/common` drop-ins

## Context

The base skeleton project was updated to remove `lodash` in favor of
implementations living in `@local/common` (specifically
`common/src/utils/lodash.ts` — deliberately not re-exported from the barrel so
it doesn't pollute the default namespace). The `aems-app` fork was merged
without refactoring the consumers, so `client/` and `server/` still
`import ... from "lodash"` in ~25 source files and still list `lodash` as a
runtime dep.

Goal: move every consumer over to
`import ... from "@local/common/dist/utils/lodash"` (the pattern already used
by [client/src/utils/palette.ts](../../aems-app/client/src/utils/palette.ts)),
remove `lodash` from `client/package.json` and `server/package.json`, and get
`yarn check` + `yarn test` clean across the build chain.

No design doc existed for this in `docs/proposed/`.

## Master set of consumed lodash functions

From the audit — 21 distinct names, in 25 source files:

`clamp, cloneDeep, difference, flatten, get, isArray, isEmpty, isEqual, isNumber, isObject, isString, merge, omit, orderBy, pick, set, snakeCase, sortBy, sum, uniqWith, upperFirst`

Missing from `common/src/utils/lodash.ts` today: `cloneDeep, merge, uniqWith,
upperFirst, clamp, isArray, isNumber, isString`.

- `clamp` already exists in `common/src/utils/math.ts` and is re-exported from
  the common barrel, but we'll also re-export it from `lodash.ts` for
  drop-in symmetry.
- `merge` semantics: consumers all use the `merge({}, a, b)` shape (no target
  mutation intended); a deep-merge that returns a new object is the correct
  drop-in. `common/src/utils/util.ts` already has `deepMerge` — we'll expose
  it as `merge` from the lodash module (its signature is compatible).

## Plan

1. Extend `common/src/utils/lodash.ts` with the missing functions:
   `cloneDeep`, `merge`, `uniqWith`, `upperFirst`, `clamp`, `isArray`,
   `isNumber`, `isString`.
2. Extend `common/src/utils/lodash.test.ts` with tests for the new functions.
3. Rebuild common (`yarn build`).
4. Refactor every `from "lodash"` import in `client/src/` and `server/src/`
   to `from "@local/common/dist/utils/lodash"`.
5. Drop `"lodash": "^4.18.1"` from `client/package.json` and
   `server/package.json`.
6. Run `yarn check` in server → client. Fix any type errors.
7. Run `yarn test` for common, server, client. Fix failures.

## Progress log

### 20260710-094500 — common layer (extend lodash drop-ins)

- Added to `aems-app/common/src/utils/lodash.ts`: `clamp`, `isArray`,
  `isNumber`, `isString`, `upperFirst`, `cloneDeep`, `merge`, `uniqWith`.
- Added tests for all 8 new functions to
  `aems-app/common/src/utils/lodash.test.ts`.
- `yarn test` → 777 pass, 0 fail (16 suites).
- `yarn build` and `yarn check` → clean.

### 20260710-100000 — server layer (refactor imports)

- Rewrote lodash imports in 10 server files to
  `@local/common/dist/utils/lodash`: `services/config/config.service.ts`,
  `services/setup/setup.service.ts`, `utils/template.ts`, and every
  `graphql/*/mutate.service.ts` that used `omit` / `isEqual`.
- `yarn check` initially surfaced strictness gaps between my drop-ins and
  lodash's own permissive types (`omit(null, ...)`, string-keyed pick/omit
  keys, loose `merge` target). Widened `pick` / `omit` / `merge` in
  `lodash.ts` to accept `null`/`undefined` and looser key sets. Rebuilt
  common.
- `yarn check` → clean.

### 20260710-101500 — client layer (refactor imports)

- Rewrote lodash imports in 15 client files. All now use
  `@local/common/dist/utils/lodash`.
- Fixed pre-existing bug: `client/src/app/users/dialog.tsx` referenced an
  undefined `xor` on line 194 (only `xorPrimitive` was imported); swapped
  to `xorPrimitive`, which fits the primitive `unitIds` array.
- `yarn check` surfaced three more drop-in gaps vs lodash:
  1. `merge({}, a, b)` — lodash returns `T & S1 & S2`; my version returned
     `T`. Added overloads.
  2. `sortBy(arr, ["k1", "k2"])` and `orderBy(arr, ["k"], ["asc"])` —
     lodash accepts property-name strings as iteratee shortcuts.
     Added a `SortIteratee<T>` union.
  3. `sum(Object.values(possiblyEmpty))` — lodash skips non-numbers; my
     version required `number[]`. Widened to `(number | null | undefined)[]`.
- `yarn check` → clean.

### 20260710-102500 — server tests (uncovered runtime gaps)

Running `yarn test` in server surfaced two more drop-in bugs that pure type
checking couldn't catch:

1. **`set` / `get` path parsing.** `transformTemplate` in
   `server/src/utils/template.ts` walks arrays with paths like
   `"operation_args.[0]"`. My parser turned `[0]` into `.0` producing a
   double-dot → empty-key segment (`"operation_args", "", "0"`), which set
   `object.operation_args[""][0]` instead of `object.operation_args[0]`.
   Added a `parsePath` helper that filters empty segments — matches lodash.
2. **`snakeCase` word splitting.** `setup.service.ts` builds unit names via
   `upperFirst(snakeCase(v))`. Lodash splits `"Ahu1"` into `["Ahu","1"]`
   → `"ahu_1"`, giving `"Ahu_1"`. My implementation did no
   letter/digit split → `"ahu1"` → `"Ahu1"` → wrong unit name. Rewrote
   `camelCase`, `snakeCase`, `kebabCase`, and `startCase` around a shared
   `words()` helper that mirrors lodash's ASCII behaviour.

- Rebuilt common; existing lodash tests still pass (777).
- Server tests → 996 pass, 4 skipped, 0 fail (115 suites).

### 20260710-103000 — client tests

- Client tests → 278 pass, 0 fail (22 suites).

### 20260710-103100 — final check

- `common` / `server` / `client` — `yarn check` all exit 0.
- No `from "lodash"` imports remain under any `src/`.
- `lodash` in `client/package.json` and `server/package.json` is in the
  `resolutions` block only (transitive-dep pin) — leaving as-is since it
  no longer resolves any direct import.
