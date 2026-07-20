# Develop: Fix "Participate in Grid Services" tri-state

Approved plan: `C:/Users/d3x573/.claude/plans/participate-in-grid-services-generic-piglet.md`

No matching design doc existed under `docs/proposed/` — proceeding without one.

## Layers touched

- **prisma**: no change (field `Unit.peakLoadExclude` already exists).
- **common**: no change.
- **server**: no change (per-unit `updateUnit` already wired).
- **client**: fix tri-state derivation, HTMLSelect onChange, and per-unit hidden logic in `aems-app/client/src/app/ilc/page.tsx`.

## Progress

### 2026-07-20 09:02:58 — client layer

Files changed:
- `aems-app/client/src/app/ilc/page.tsx`
  - Added `mixedOverrides` state at the top of `ILCPage` to remember when a user has explicitly chosen "Mixed" while all units still agree.
  - Fixed derivation (was inverted): now `every === false → "yes"`, `every === true → "no"`, else `"mixed"`.
  - Rewrote the HTMLSelect `onChange`: Yes → sets every unit's `peakLoadExclude = false`; No → sets every unit's `peakLoadExclude = true`; Mixed → UI-only, does not touch unit values so users can flip individual units via the per-unit toggle.
  - Option values changed from `"true"/"false"/"mixed"` to `"yes"/"no"/"mixed"` for readability.
  - Cleared the mixed override for a control on `handleEdit` (fresh session), `handleCancel`, and after successful `handleSave`.
  - Updated the `Unit` `hidden` prop: no longer unconditionally hides `peakLoadExclude` — hides only when parent select is Yes or No; when Mixed, per-unit toggle is visible so users can flip individual units.

No changes to `Unit.tsx` (its per-unit Yes/No popover was already correct).
No prisma, common, or server changes required.

Result: `yarn check` in `aems-app/client/` — PASS.

### 2026-07-20 — final

Ran `yarn check` in `aems-app/client/` — PASS.
