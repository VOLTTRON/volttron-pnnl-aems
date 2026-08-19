# develop: demo route functional tests

## Summary

Create functional (component/render) tests for all 6 files in `client/src/app/demo/`:
- `layout.test.tsx`
- `page.test.tsx`
- `[isbn]/layout.test.tsx`
- `[isbn]/page.test.tsx`
- `[isbn]/[index]/layout.test.tsx`
- `[isbn]/[index]/page.test.tsx`

No design doc. No Prisma, common, or server changes required.

## Client layer

### [2026-08-12 07:10] Started

Creating test files. No source changes.

Files to create:
- `client/src/app/demo/layout.test.tsx`
- `client/src/app/demo/page.test.tsx`
- `client/src/app/demo/[isbn]/layout.test.tsx`
- `client/src/app/demo/[isbn]/page.test.tsx`
- `client/src/app/demo/[isbn]/[index]/layout.test.tsx`
- `client/src/app/demo/[isbn]/[index]/page.test.tsx`

### [2026-08-12 07:25] Completed

All 6 test files created. 24 new tests across 6 suites, all pass. Full suite: 405 tests, 54 suites, 0 regressions.

Key decisions:
- Blueprint `Collapse` renders children lazily (empty DOM when closed); tests that check collapsed content click the section header first to open it
- `@/app/components/common` alias not resolable in jest.mock path strings; avoided by not mocking the Table — let it render natively
- Async server components tested by calling the component function directly and awaiting the JSX result, then rendering with `render(element)`
- `findBook` in `books.ts` has a 2-second `delay()`; mocked in all tests to return immediately
