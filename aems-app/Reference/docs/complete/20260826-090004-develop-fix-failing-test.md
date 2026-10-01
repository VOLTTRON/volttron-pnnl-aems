# Fix failing test: `RootLayout` regression test

No design doc existed under `docs/proposed/` for this task — the failing
test was flagged directly by the user.

## Root cause

New test at `client/src/app/layout.test.tsx` (added on
`feature/timezone-preference`) factory-mocks `./components/providers` but
omits `ConfigProvider`. `layout.tsx` imports and renders `ConfigProvider`,
so under the mock it resolves to `undefined` and React throws
"Element type is invalid" inside `render()`, before the sole assertion
runs.

Production code is correct. Only the test's mock surface is incomplete.

## Change

Add one line to the mock factory in
`client/src/app/layout.test.tsx`:

```tsx
ConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
```

## Log

- 20260826 09:00 — progress log created, no design doc, plan approved.
- 20260826 09:01 — pre-fix `yarn test --testPathPattern=layout.test` reproduced the failure: `Element type is invalid ... got: undefined` at `layout.test.tsx:53`, "1 failed, 8 passed" across 4 suites.
- 20260826 09:02 — added `ConfigProvider: ({ children }) => <>{children}</>` to the `./components/providers` mock factory.
- 20260826 09:02 — post-fix `yarn test --testPathPattern=layout.test`: 4 suites, 9 tests, all pass.
- 20260826 09:03 — `yarn check` in `client/` — exit 0, no TypeScript errors.

## Result

Test-only fix; no production behavior changed. Prisma / common / server
workspaces untouched, so the strict build chain didn't need to be walked.
