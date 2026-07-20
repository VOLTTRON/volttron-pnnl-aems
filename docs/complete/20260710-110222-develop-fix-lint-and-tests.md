# Fix compile / style errors, warnings, and failing tests

## Context

Follow-up to [20260710-093625-develop-lodash-refactor.md](../complete/20260710-093625-develop-lodash-refactor.md). The lodash refactor
brought all workspaces to a clean `yarn check` and 100% test pass, but the
project also has `yarn lint` (ESLint) and `yarn build` to satisfy. This pass
sweeps every workspace's lint + build output and fixes any remaining
compile / style issues and test failures.

No design doc — this is a mechanical clean-up pass.

## Plan

1. `yarn lint` and `yarn build` in each workspace in build order:
   prisma → common → server → client.
2. Fix real issues (errors, warnings), skipping ESLint noise that can't be
   satisfied without churn.
3. Re-run `yarn test` in each workspace to confirm nothing regressed.

## Progress log

### 20260710-110300 — audit results

Ran `yarn lint`, `yarn build`, and `yarn test` in every workspace. Everything
already passes:

| Workspace | lint | build | tests |
| --------- | ---- | ----- | ----- |
| prisma    | ✓ 0  | ✓ 0   | no tests configured |
| common    | ✓ 0  | ✓ 0   | 777 / 777 pass (16 suites) |
| server    | ✓ 0  | ✓ 0   | 996 / 996 pass, 4 skipped (115 suites) |
| client    | ✓ 0  | ✓ 0   | 278 / 278 pass (22 suites) |

No compile errors, no ESLint warnings, no failing tests. The lodash refactor
finish-up covered every gap that had been outstanding — this pass had
nothing to fix.
