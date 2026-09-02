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
- Not re-run: `./test.sh` (with coverage) — coverage output was explicitly kept as-is per user's design choice; the coverage tables (4 of them) are the same size they were before and are the only substantial remaining output when coverage is on. `.\test.ps1` on native PowerShell — script logic is unchanged; the reporter/setup changes are in the workspace `package.json` + `jest.setup.ts` files that PowerShell invokes identically.
- Status: PASS.
