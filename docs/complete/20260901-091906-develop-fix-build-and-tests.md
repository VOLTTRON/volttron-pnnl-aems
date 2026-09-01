# Develop: Fix All Build/Test Issues

**Started:** 2026-09-01 09:19:06
**Completed:** 2026-09-01 (same session)
**Branch:** feature/setpoint-error-chart
**Task:** Run build and test scripts across all workspaces; fix all issues, errors, warnings, and failing tests.

No design doc — this is a maintenance/cleanup pass across the `prisma → common → server → client` chain.

## Progress Log

- **09:19:06** — Log created. Ran `yarn check` in all four workspaces (prisma, common, server, client). All passed.
- **09:22** — Ran `yarn lint`. Prisma, common, client clean. Server had 5 errors:
  - [server/src/graphql/pothos.module.ts:130,133](aems-app/server/src/graphql/pothos.module.ts) — Unsafe member access on `any` on the WS `onConnect` fallback path. Added `eslint-disable-next-line @typescript-eslint/no-unsafe-member-access` comments to match the pattern used elsewhere in the same block.
  - [server/src/services/synthetic/historian.writer.ts:95](aems-app/server/src/services/synthetic/historian.writer.ts) — Unused callback arg `n` in `encodeSamples(...(n) => count++)`. Rewrote as `() => count++` since the count callback signature already ignores the arg.
  - [server/src/services/synthetic/synthetic-ticker.service.ts:22](aems-app/server/src/services/synthetic/synthetic-ticker.service.ts) — `async onModuleInit` had no `await`. Made it sync (`onModuleInit(): void`). NestJS `OnModuleInit` accepts either signature.
  - [server/src/services/synthetic/synthetic.service.ts:227](aems-app/server/src/services/synthetic/synthetic.service.ts) — `async collectTickValues` had no `await`. Made it sync; updated the single caller in `synthetic-ticker.service.ts:70` to drop `await`.
- **09:32** — Re-ran server lint. Clean. Re-ran server `yarn check`. Clean.
- **09:35** — Ran `yarn test` across all workspaces:
  - prisma: no tests
  - common: 792 tests, all passing
  - server: 1146 passing, 4 skipped
  - client: 419 passing, **1 failing** — [client/src/app/demo/page.test.tsx:71](aems-app/client/src/app/demo/page.test.tsx) `"renders without crashing"` timing out at 5s under load.
- **09:38** — Reproduced in isolation: passed in ~460ms. Confirmed flake under parallel-suite CPU pressure. Fixed by wrapping `renderPage()` in `await act(async () => {...})` to match the pattern already used by every other test in the same file (they all wrap in `act` and don't hit the timeout).
- **09:40** — Re-ran full client suite: 420/420 passing.
- **09:41** — Final verification: `yarn check` chain across all four workspaces + `yarn lint` on server and client. All green.

## Files changed

- aems-app/server/src/graphql/pothos.module.ts
- aems-app/server/src/services/synthetic/historian.writer.ts
- aems-app/server/src/services/synthetic/synthetic-ticker.service.ts
- aems-app/server/src/services/synthetic/synthetic.service.ts
- aems-app/client/src/app/demo/page.test.tsx

## Result

All workspaces pass `yarn check`, `yarn lint`, and `yarn test`. No warnings, no failing tests.
