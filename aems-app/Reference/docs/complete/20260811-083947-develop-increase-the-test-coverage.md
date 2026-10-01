# develop: Increase Test Coverage

Started: 2026-08-11 08:39:47

## Goal

Add unit tests for previously untested client-side files to increase test coverage.

No design doc found — proceeding based on codebase analysis.

## Scope

Client workspace only. 8 new test files targeting:
- `src/app/dialog.tsx` (generic dialog factory)
- `src/app/banners/dialog.tsx`
- `src/app/feedback/dialog.tsx`
- `src/app/users/dialog.tsx`
- `src/app/template.tsx`
- `src/app/auth/logout/page.tsx`
- `src/app/auth/[provider]/login/page.tsx`
- `src/app/backups/page.tsx`

## Log

### 2026-08-11 08:39:47 — Starting implementation
Reading source files and existing test patterns.

### 2026-08-11 — Client layer complete
All 8 new test files written and passing.

**Files created:**
- `src/app/dialog.test.tsx` (6 tests — CreateDialog, ReadDialog, UpdateDialog, DeleteDialog, ConfirmDialog, ViewDialog)
- `src/app/banners/dialog.test.tsx` (4 tests — CreateBanner, UpdateBanner, DeleteBanner)
- `src/app/feedback/dialog.test.tsx` (4 tests — ViewFeedback)
- `src/app/users/dialog.test.tsx` (4 tests — CreateUser, UpdateUser, DeleteUser, LoginAsUser)
- `src/app/template.test.tsx` (6 tests — loading, not-found, denied redirect, login redirect, authorized, public route)
- `src/app/auth/logout/page.test.tsx` (2 tests — form render, authjs redirect)
- `src/app/auth/[provider]/login/page.test.tsx` (3 tests — initial render, disabled button, fields after load)
- `src/app/backups/page.test.tsx` (5 tests — tabs render)

**Results:** 381 tests passing (up from 345), 0 failures, `yarn check` clean.

### 2026-08-11 — COMPLETE
