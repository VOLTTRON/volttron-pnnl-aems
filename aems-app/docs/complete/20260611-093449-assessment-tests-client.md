# Test Coverage Assessment: client

**Date:** 2026-06-11  
**Run:** `yarn test:cov` — 3 test suites, 96 tests, all passing

---

## Coverage summary

Coverage metrics reflect only the 2 source files that Jest collected (those with sibling test files). The ~63 React component and page files are not collected at all because `collectCoverageFrom` defaults to files under coverage scope — those without any import path exercised by a test are absent from the report.

| Metric | % (collected files only) |
|--------|--------------------------|
| Statements | 92.63 |
| Branches | 93.15 |
| Functions | 78.12 |
| Lines | 92.63 |

**Effective coverage of the full `client/src/` surface:** approximately **3%** (2 utility files out of ~65 source files).

---

## Uncovered files

### All React components (zero test files)

| Area | Files | Approx. lines |
|------|-------|---------------|
| Common UI components (`app/components/common/`) | 16 | ~3,000 |
| Context providers (`app/components/providers/`) | 8 | ~600 |
| Feature: feedback | 2 | ~200 |
| Pages: backups | 2 (`page.tsx` 887L, `dialog.tsx` 845L) | ~1,732 |
| Pages: banners | 1 (`dialog.tsx` 249L) | ~249 |
| Pages: users | 1 | ~300 |
| Pages: logs, feedback, about | 3 | ~300 |
| Auth pages (login, logout, denied, provider) | 4 | ~150 |
| Demo pages (books, locations, map, chart, palette) | 5 | ~500 |
| Layouts and shared pages | 6 | ~200 |

**Notable unprotected files by size/risk:**
- `app/backups/page.tsx` (887 lines) — backup CRUD, pagination, filtering
- `app/backups/dialog.tsx` (845 lines) — backup creation/restore workflow
- `app/components/common/map.tsx` (543 lines) — map rendering, location interaction
- `app/components/common/table.tsx` — data table with sorting/filtering
- `app/components/providers/graphql.tsx` — Apollo Client setup; broken provider affects every page

### Not applicable (skip)

- `src/graphql-codegen/graphql.ts`, `gql.ts`, `fragment-masking.ts` — generated; do not test

---

## Partial coverage (tested files with gaps)

| File | Stmts | Branch | Funcs | Uncovered |
|------|-------|--------|-------|-----------|
| `src/utils/client.tsx` | 99.01 | 96 | 100 | L95 — one branch in `ConditionalWrapper` |
| `src/utils/palette.ts` | 91.55 | 92.56 | 74.07 | L122–123, 180, 427, 441–547 (several `Color` methods: `toHsl`, `lighten`, `darken`, comparison operators) |

---

## Recommended next tests

The client has `@testing-library/react`, `jest-environment-jsdom`, and `jest-dom` already installed but unused. Introducing React component tests is medium-effort per file; the return on investment is highest at the provider and common-component level before expanding to pages.

Existing test pattern to follow: co-located `.test.ts` files in `src/utils/`, pure function style, `jest.fn()` for callbacks. For React component tests, follow the `@testing-library/react` `render` + `screen` + `userEvent` pattern that the installed packages support.

### Priority 1 — Context providers (foundational; failures propagate to all pages)

1. **`src/app/components/providers/graphql.tsx`** — test that `ApolloClient` is initialized with the correct URI, that `MockedProvider` can be substituted in tests. This provider wraps every page.
2. **`src/app/components/providers/current.tsx`** — test that current-user context is populated and that the hook returns the right shape.
3. **`src/app/components/providers/notification.tsx`** — test add/clear notification dispatch.

### Priority 2 — Common UI components (reused everywhere)

4. **`src/app/components/common/table.tsx`** — sorting, pagination, empty state
5. **`src/app/components/common/search.tsx`** — filter input, debounce, clear
6. **`src/app/components/common/notice.tsx`** — renders error/warning/info banners correctly
7. **`src/app/components/common/paging.tsx`** — page navigation, boundary conditions (first/last page)
8. **`src/app/components/common/loading.tsx`** — renders spinner vs. children based on `loading` prop

### Priority 3 — Utility gaps in existing files

9. **`src/utils/palette.ts`** — add tests for uncovered `Color` methods: `toHsl()`, `lighten()`, `darken()`, and comparison operators (lines 441–547). Follow the existing describe/it structure in `palette.test.ts`.

### Priority 4 — Page-level smoke tests

10. **`src/app/backups/page.tsx`** — render with `MockedProvider`, assert list renders, verify dialog opens on button click
11. **`src/app/users/page.tsx`** — render with mock user data, assert table rows

### Defer

- `src/app/demo/` — demo pages; low production risk
- `src/app/auth/` — auth redirect pages; thin wrappers around NextAuth; test via E2E if needed
- `src/instrumentation.ts` — Next.js instrumentation hook; not unit-testable

### Setup note

Before writing React component tests, confirm that `jest.config.ts` `setupFilesAfterFramework` includes `@testing-library/jest-dom` matchers. The jest.config.ts uses `nextJest` wrapper — check whether a `jest.setup.ts` is needed to call `import '@testing-library/jest-dom'`. Do not add new Jest plugins; only use what is already installed.
