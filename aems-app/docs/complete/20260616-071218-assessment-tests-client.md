# Coverage Assessment: client

**Date**: 2026-06-16  
**Run**: `yarn test:cov` — 9 suites, 145 tests, all pass

---

## Coverage summary

| Metric | % |
|--------|---|
| Statements | 10.47 |
| Branches | 75.65 |
| Functions | 40.9 |
| Lines | 10.47 |

9 test files cover 81 source files. The high branch % despite low statement % reflects that most tested files are simple (short files that happen to hit most branches once reached), while the bulk of the app (all route pages, large components) is untested entirely.

---

## Uncovered files (0% statement coverage)

### Core app shell
| File | Lines | Risk |
|------|-------|------|
| `src/app/layout.tsx` | 55 | Medium — root layout, providers |
| `src/app/template.tsx` | 91 | Medium — template wrapper |
| `src/app/dialog.tsx` | 524 | High — largest file, shared dialog system |
| `src/app/routes.ts` | 166 | High — route definitions used everywhere |
| `src/app/types.ts` | 94 | Medium — shared type definitions |
| `src/app/error.tsx` | 28 | Low |
| `src/app/not-found.tsx` | 53 | Low |
| `src/app/loading.tsx` | 7 | Low |
| `src/app/page.tsx` | 17 | Low |
| `src/instrumentation.ts` | 12 | Low |

### Route pages (all 0%)
| Area | Files |
|------|-------|
| `src/app/about/page.tsx` | Simple about page |
| `src/app/auth/*/page.tsx` + `template.tsx` | Login/logout/denied flows |
| `src/app/backups/page.tsx` + `dialog.tsx` | Backup management (large: 887 + 845 lines) |
| `src/app/banners/page.tsx` + `dialog.tsx` | Banner management |
| `src/app/demo/**` | Demo pages (low priority — not production features) |
| `src/app/feedback/page.tsx` + `dialog.tsx` | Feedback submission |
| `src/app/logs/page.tsx` | Log viewer |
| `src/app/users/page.tsx` + `dialog.tsx` | User management |

### Components/common (untested, 0%)
| File | Lines | Risk |
|------|-------|------|
| `src/app/components/common/banner.tsx` | 54 | Medium |
| `src/app/components/common/echarts.tsx` | 50 | Low — thin wrapper |
| `src/app/components/common/file.tsx` | 61 | Medium — file upload UI |
| `src/app/components/common/map.tsx` | 543 | High — complex Leaflet component |
| `src/app/components/common/navbar.tsx` | 118 | Medium |
| `src/app/components/common/navigation.tsx` | 78 | Medium |
| `src/app/components/common/notification.tsx` | 47 | Medium |
| `src/app/components/common/palette.tsx` | 239 | High — large colour picker |
| `src/app/components/common/preferences.tsx` | 38 | Low |
| `src/app/components/common/table.tsx` | 169 | High — shared data table |
| `src/app/components/common/texticon.tsx` | 24 | Low |
| `src/app/components/common/theme.tsx` | 31 | Low |

### Providers (untested, 0%)
| File | Lines | Risk |
|------|-------|------|
| `src/app/components/providers/current.tsx` | 78 | High — current user context |
| `src/app/components/providers/graphql.tsx` | 57 | High — Apollo client setup |
| `src/app/components/providers/logging.tsx` | 76 | Medium |
| `src/app/components/providers/preferences.tsx` | 88 | Medium |
| `src/app/components/providers/routing.tsx` | 210 | High — routing context |
| `src/app/components/providers/screen-size.tsx` | 159 | Medium |

### Other
| File | Lines | Risk |
|------|-------|------|
| `src/app/components/feedback/feedback.tsx` | 347 | High — feedback form |
| `src/app/components/hooks/useQueryWithCallbacks.ts` | 56 | High — shared hook used across pages |

---

## Partial coverage

Files with tests but minor gaps:

| File | Stmts | Branch | Funcs | Uncovered |
|------|-------|--------|-------|-----------|
| `src/app/components/common/search.tsx` | 100 | 95 | 100 | Line 18 — one branch (probably a null guard) |
| `src/utils/client.tsx` | 99.01 | 96 | 100 | Line 95 |
| `src/utils/palette.ts` | 95.19 | 96.94 | 77.77 | Lines 427, 468, 488-489, 495-512, 527-547 — palette edge-case paths |

### Notable partial-coverage gaps

**`src/utils/palette.ts`** — 77.77% function coverage, ~3 functions untested. Lines 488-512 and 527-547 suggest uncommon palette operations (likely specific colour-space conversions or export formats). Medium priority.

---

## Recommended next tests

Priority ordered by risk × reusability:

### High priority

1. **`src/app/components/hooks/useQueryWithCallbacks.ts`**  
   Shared hook used across most data-fetching pages. Use `renderHook()` + a mock Apollo client (or `MockedProvider` from `@apollo/client/testing`). Test loading state, success callback, error callback, and refetch trigger. Pattern: `notification.test.tsx`.

2. **`src/app/components/providers/current.tsx`**  
   Current-user context — affects auth-gated rendering across the entire app. Use `renderHook({ wrapper: CurrentProvider })`. Test authenticated user, unauthenticated (null), and role-checking helpers.

3. **`src/app/components/providers/routing.tsx` (210 lines)**  
   Routing context is used to drive navigation across all pages. Test route resolution, active-route detection, and navigation callbacks.

4. **`src/app/components/common/table.tsx` (169 lines)**  
   Shared data table used on every list page. Test column rendering, sort, pagination integration, empty state, and loading skeleton. Pattern: `paging.test.tsx` (helper function + role queries).

5. **`src/app/components/feedback/feedback.tsx` (347 lines)**  
   Feedback form — form validation, submission flow, success/error states. Use `render()` + `fireEvent` + mock Apollo `useMutation`.

### Medium priority

6. **`src/app/components/common/notification.tsx`**  
   Notification display component — distinct from the `NotificationProvider` already tested. Test rendering each notification type and dismiss action.

7. **`src/app/components/common/navbar.tsx` + `navigation.tsx`**  
   Test link rendering, active state, and role-based visibility.

8. **`src/app/components/providers/screen-size.tsx` (159 lines)**  
   Uses `ResizeObserver` (already stubbed in `jest.setup.ts`). Test breakpoint context values and resize events.

9. **`src/utils/palette.ts` — uncovered functions**  
   Extend existing `palette.test.ts` to cover the ~3 untested functions at lines 427, 468, 488-547.

10. **`src/app/routes.ts` (166 lines)**  
    Route definitions — pure data/functions, no React needed. Test route path generation, parameter substitution, and breadcrumb construction if present.

### Lower priority

11. **`src/app/components/common/banner.tsx`** — display-only, low logic density.
12. **`src/app/components/common/file.tsx`** — file upload UI; consider mocking `fetch` for upload tests.
13. Route page components (`banners/page.tsx`, `users/page.tsx`, `feedback/page.tsx`) — integration-heavy; best approached after provider and hook coverage is solid.
14. **Demo pages** — not production features, lowest priority.

### Testing notes

- The `jest.setup.ts` already stubs `ResizeObserver` and suppresses Blueprint Icon warnings — no additional setup needed for Blueprint components.
- Use `MockedProvider` from `@apollo/client/testing` for components that call GraphQL hooks.
- Next.js `useRouter`, `useParams`, `useSearchParams` should be mocked via `jest.mock('next/navigation', ...)`.
- Map component (`map.tsx`) likely requires mocking Leaflet — defer to a dedicated spike.
