# Fix failing tests

## Context

Follow-up on the `develop` workflow with argument "Fix any failing tests." No design doc exists — this is a mechanical clean-up pass on branch `feature/building-power`.

Recent work on this branch: building-power dashboard visualization overhaul, historian-data migration script updates, and Schema-instance historian gating. Any of those could have knocked over tests.

## Plan

1. Run `yarn test` in each workspace in build order (prisma → common → server → client).
2. Triage each failure — is it a real regression, a snapshot drift, or an environmental issue?
3. Fix real issues, log any that need user judgment.
4. Re-run to confirm green.
5. Run `yarn check` across all workspaces to confirm typing still passes.

## Progress log

### 20260821-085900 — audit results

Ran `yarn test` in each workspace on branch `feature/building-power`.

| Workspace | tests | notes |
| --------- | ----- | ----- |
| prisma    | no tests configured | `--passWithNoTests` |
| common    | 792 / 792 pass (16 suites) | clean |
| server    | 1144 / 1148 pass, 4 skipped (120 suites) | clean |
| client    | 412 / 413 pass, 1 failed (56 suites) | `src/app/layout.test.tsx` |

### 20260821-090100 — root cause

`aems-app/client/src/app/layout.test.tsx:18` uses `jest.mock("./components/providers", () => ({...}))` to replace the whole module. When `ConfigProvider` was added to `layout.tsx` (part of the building-power visualization work), the mock was not updated to include it, so `ConfigProvider` resolved to `undefined` and React reported `Element type is invalid`.

The mock is the source-of-truth issue — every provider used by `RootLayout` has to be listed. This is a fragile pattern (silently drifts whenever a new provider is added) but not something to refactor as part of "fix any failing tests."

### 20260821-090200 — fix

Added `ConfigProvider` to the mock in `aems-app/client/src/app/layout.test.tsx` (alphabetical position, above `CurrentProvider`).

- Files changed: `aems-app/client/src/app/layout.test.tsx` (1 line added)
- Layer: client
- Result: pass

### 20260821-090400 — verification

- `yarn test` in `aems-app/client/`: 413 / 413 pass (56 suites)
- `yarn check` in each workspace (prisma → common → server → client): all clean

No other layers touched.
