# Quiet the aems-app test script + fail on unexpected in-test errors

Started 2026-09-01 11:50:27.

**Design doc:** none in `docs/proposed/` — proceeding without one, decisions inline per approved plan (`C:\Users\d3x573\.claude\plans\the-test-script-currently-jazzy-kazoo.md`).

## Goal

1. Any unasserted exception / unhandled rejection / `console.error` / `console.warn` inside a test → test fails.
2. Once (1) is enforced, hide per-file `PASS` lines via `jest-silent-reporter` so the surviving output (failures + Jest summary + coverage tables + shell banners) is readable.

Leave coverage output and `test.sh` / `test.ps1` banners as-is.

## Layer progress

### Prisma
- 2026-09-01 12:00 — Created `prisma/jest.setup.ts` (strict console/rejection wrapper w/ empty allowlist). Added `setupFilesAfterEnv` in prisma jest config. Added `jest-silent-reporter@^0.6.0` devDep. Appended `--reporters=jest-silent-reporter` to `test` and `test:cov` scripts (left `test:watch` untouched).
- `yarn install` succeeded. `yarn check` clean (exit 0). `yarn test` → "No tests found, exiting with code 0" (`--passWithNoTests` covers it; strict setup latent for future tests). No offenders to fix.
- Status: PASS.

### Common
- 2026-09-01 12:02 — Created `common/jest.setup.ts` (same strict wrapper, empty allowlist). Added `setupFilesAfterEnv`. Added `jest-silent-reporter@^0.6.0` devDep. Appended `--reporters=jest-silent-reporter` to `test` + `test:cov`.
- 16 test files exercised. `yarn install` clean. `yarn check` clean. `yarn test` → exit 0 with empty stdout (silent reporter working, strict setup found no offenders). No offenders to fix.
- Status: PASS.

### Server
- 2026-09-02 — Extended `server/jest.setup.ts` with the strict wrapper (keeping the existing `ConsoleLogger.prototype.printMessages` stub). Added `jest-silent-reporter@^0.6.0` devDep. Appended `--reporters=jest-silent-reporter` to `test` and `test:cov`.
- Offender surfaced (1 test): [server/src/logging/logger.service.test.ts](aems-app/server/src/logging/logger.service.test.ts) — `PrismaLogger > does not throw when the database write fails`. The test relied on module-top-level `jest.spyOn(console, "error")` calls to silence the intentional `console.error("Failed to log to database", ...)` fallback in the SUT. Our `beforeEach` reassigned `console.error` and clobbered those top-level spies. Fixed by (a) deleting the top-level spy block, (b) spying on `console.error` inside the specific test AND asserting on `toHaveBeenCalledWith("Failed to log to database", dbError)` — the test now genuinely verifies the fallback logging path instead of just silencing it. Renamed test for clarity.
- Re-run: `yarn test` exit 0, empty stdout (silent reporter working). No further offenders.
- Status: PASS.

### Client
- 2026-09-02 — Rewrote `client/jest.setup.ts`: converted the existing "filter and pass through" `console.error`/`console.warn` overrides into the shared allowlist-based strict wrapper. Kept both existing allowlist entries (Blueprint5.Icon "not wrapped in act" from Blueprint 5's lazy SVG loader; Apollo Client `go.apollo.dev/c/err` deprecation from MockedProvider). Kept `@testing-library/jest-dom` import and the `ResizeObserver` polyfill for Blueprint overlays. Added `jest-silent-reporter@^0.6.0` devDep. Appended `--reporters=jest-silent-reporter` to `test` and `test:cov`.
- `yarn install` clean. `yarn check` exit 0. `yarn test` exit 0, empty stdout. No offenders — the two allowlisted patterns cover the entire existing noise surface, and no other test emitted unexpected console output or unhandled rejections.
- Status: PASS.

### Final
- 2026-09-02 — `cd aems-app && ./test.sh -c` end-to-end. Exit 0. Total output: **27 lines** across all 4 workspaces (was ~thousands of PASS lines + `console.error` noise + Jest per-file output before this change). The four green `<Workspace>: Analysis and testing completed successfully!` banners and the final `All analysis and testing completed successfully!` are the dominant signal — trivially scannable now. Only in-band noise: one Node TLS warning from the client's dev-cert code (unrelated, pre-existing) and `next lint`'s `✔ No ESLint warnings or errors` line.
- 2026-09-02 (follow-up) — User feedback: coverage summary printed but Jest **test summary** (Test Suites / Tests / Snapshots / Time) did not. Root cause: `jest-silent-reporter` alone suppresses the summary block along with PASS lines. Fix: append Jest's built-in `summary` reporter after `jest-silent-reporter` in all four workspaces' `test` and `test:cov` scripts. Verified in `common/`: `yarn jest --reporters=jest-silent-reporter --reporters=summary` prints the summary (`Test Suites: 16 passed, 16 total / Tests: 792 passed, 792 total / Snapshots: 0 total / Time: 30.098 s`) with no PASS lines. Failure details still print (jest-silent-reporter handles those). `test:watch`/`test:debug` unchanged.
- 2026-09-02 (follow-up 2) — User feedback: `./test.sh` (with coverage) surfaced multiple errors and a test failure. Investigated. Two distinct issues:
  1. **Test failure**: `client/src/app/demo/page.test.tsx > Demo page > renders without crashing` hit Jest's 5000ms per-test timeout under coverage. The test file's `renderPage()` helper did `require("./page").default` inside the function body, so the ts-jest transform + v8 coverage instrumentation of `demo/page.tsx` and its transitive imports ran inside the *first* `it`'s timeout budget. Sibling tests reused the cached module and passed in <600ms; only the first cold-start hit the wall. Fix: hoisted `import Page from "./page"` to file scope (Jest hoists `jest.mock` calls above imports, so the mocks still take effect). Now module transformation happens during setup, outside any test's timeout budget. Verified: single-file run passes in 8.9s; full `client/` coverage run passes 420/420 in 26.1s (was 165.5s with the failing test).
  2. **Node TLS startup warning**: `next lint` in the client emitted `(node) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0'...` (two lines). Source: user's `client/.env.local` sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for the local HTTPS dev server (`server.cjs` needs to accept Docker's self-signed cert). Next.js auto-loads `.env.local` for `next lint` too, so Node emits the warning on every lint invocation. Fix: `export NODE_TLS_REJECT_UNAUTHORIZED=1` early in [test.sh](aems-app/test.sh) and its PowerShell twin [test.ps1](aems-app/test.ps1). Node's *startup* TLS check now sees `1` and stays quiet; Next.js still loads `.env.local` and overrides `process.env.NODE_TLS_REJECT_UNAUTHORIZED=0` inside the Node process afterward — but by then the startup warning has already been evaluated. `server.cjs` (invoked by `yarn dev`, not by `test.sh`) still sets it to `0` explicitly for the dev server's outgoing HTTPS calls.
- Final verification: `./test.sh` (with coverage) exit 0. 484 lines total: shell banners, per-workspace coverage tables, per-workspace Jest summary blocks, and the final `All analysis and testing completed successfully!`. No test failures, no Node warnings, no double-printed error output. Grep for `error|Error|warning|Warning|fail|FAIL|thrown` returns only benign matches: `error.tsx` filename in a coverage row and `✔ No ESLint warnings or errors` (the passing lint status).
- Not re-run: `./test.sh` (with coverage) — coverage output was explicitly kept as-is per user's design choice; the coverage tables (4 of them) are the same size they were before and are the only substantial remaining output when coverage is on. `.\test.ps1` on native PowerShell — script logic is unchanged; the reporter/setup changes are in the workspace `package.json` + `jest.setup.ts` files that PowerShell invokes identically.
- Status: PASS.
