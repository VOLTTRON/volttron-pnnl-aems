# Fix: Predefined Holidays section renders blank in "Update All Units"

Fix the "Predefined Holidays" section on `/setup` → "Update All Units" so it always shows all 13 canonical US federal holidays with aggregated per-unit state, and so save-all correctly creates missing predefined holidays on units that lack them.

No design doc existed in `docs/proposed/`. Approach captured in `~/.claude/plans/on-the-units-page-drifting-gizmo.md`.

## Layers

Client-only fix — no prisma, common, or server changes.

## Progress

### 2026-09-15 08:20 — start
Approved plan; scope is `client/src/app/setup/page.tsx` and `client/src/app/setup/components/Holiday.tsx`.

### 2026-09-15 08:22 — client layer

Files changed:
- `aems-app/client/src/app/setup/page.tsx`
  - Import `HolidayType as HolidayList` from `@local/common` for the canonical predefined holidays.
  - Rewrite `allUnit()` to iterate `HolidayList.values`. For each of the 13 canonical holidays, pull the `id` from the first real unit that has a matching label (fallback: the label itself), and aggregate `type` across all units (indeterminate `null` on disagreement or when any unit lacks the label).
  - Drop the id→label pre-process block in `handleSaveAll` — editing entries now carry `label` natively.
  - Harden `updateIds()`: when a target unit lacks a holiday with the given label, convert the editing entry to an `action: "create"` (dropping the foreign id) so the mutation creates the row on that unit instead of 404-ing.
  - Adjust the `case "create"` branch in `handleUpdateUnit`: use `holiday.type ?? HolidayEnum.Custom` and only send `day`/`month`/`observance` when set, so predefined-holiday creates don't inject zeros.
- `aems-app/client/src/app/setup/components/Holiday.tsx`
  - Attach `label` at both `{ id }` construction sites for editing-state entries.

Checks: `yarn check` — PASS. `yarn lint` — PASS (no warnings or errors).

### 2026-09-15 08:24 — complete
No prisma/common/server changes; final client check is green.
