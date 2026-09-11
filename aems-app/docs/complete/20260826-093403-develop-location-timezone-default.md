# develop: `location` sentinel + AEMS date-field refactor

Feature: extend the timezone preference (recently merged from Skeleton) with a new sentinel value `"location"` that resolves at render time to the Volttron-configured site timezone. Flip the default so fresh users see site-local time OOB. Refactor AEMS-added client date fields to consume the shared timezone plumbing (including ECharts axes).

No design doc existed for this slug; plan lives at `~/.claude/plans/the-latest-pull-from-noble-reddy.md`. Decision log kept inline below.

## Timeline

### 2026-08-26 09:34 UTC — start

Plan approved. Beginning with the server layer (Prisma layer has no changes — `Preferences.timezone` string field already exists).

### 2026-08-26 09:45 UTC — server layer complete

Files:
- `aems-app/server/src/app.config.ts` — added `timezone: string` to the `volttron` block (both the interface declaration and the constructor assignment), parsed from `VOLTTRON_TIMEZONE` env var (default `""`).
- `aems-app/server/src/graphql/config/query.service.ts` — extended `ServerConfigRef` with `location: string`; resolver returns `configService.volttron.timezone`.

Ran:
- `yarn compile:schema` in `server/` — regenerated `server/schema.graphql`; `ServerConfig` now has `location: String` field.
- `yarn check` in `server/` — clean.

### 2026-08-26 10:15 UTC — client layer complete

**Design decision (mid-flight, per user):** the new `location` value is *not* a
separate preference key merged into localStorage. It's a **sentinel value** for
the existing `timezone` preference — `preferences.timezone === "location"`
resolves at render time (via a shared hook) to `ConfigContext.config.location`,
the Volttron-configured site timezone. This eliminates the drift risk of
having a stored user copy of a server-owned value: nothing gets stored
client-side beyond the sentinel string; every render reads the current server
value. `DefaultPreferences.timezone` was flipped from `"browser"` to
`"location"` so fresh users see site-local time OOB.

Files:
- `aems-app/client/src/queries/config.graphql` — added `location` to `readConfig`. Regenerated Apollo hooks via `yarn compile:graphql`.
- `aems-app/client/src/app/components/providers/preferences.tsx` — added `TIMEZONE_LOCATION`/`TIMEZONE_BROWSER`/`TIMEZONE_NONE` sentinel constants and the `useResolvedTimezone()` hook that reads `PreferencesContext` + `ConfigContext` and returns an IANA name or `undefined`. Flipped `DefaultPreferences.timezone` from `"browser"` to `"location"`. Falls back to browser tz when Volttron config is empty.
- `aems-app/client/src/app/components/providers/config.tsx` — no code change needed; `ServerConfig` type is derived from the codegen'd `ReadConfigQuery` so `location` came in automatically.
- `aems-app/client/src/utils/date.ts` — extended `formatDate` with an optional `Intl.DateTimeFormatOptions` bag so callers can request date-only formatting; dropped the old sentinel handling inside the helper (callers resolve first via `useResolvedTimezone()`).
- `aems-app/client/src/app/components/common/preferences.tsx` — added the top-of-list "Site (⟨IANA⟩)" option to the timezone picker; label shows the resolved server location when known.
- `aems-app/client/src/app/banners/dialog.tsx` — deleted the local `useTimezoneForPicker` helper; now uses the shared `useResolvedTimezone()`.
- `aems-app/client/src/app/components/common/table.tsx`, `aems-app/client/src/app/backups/dialog.tsx`, `aems-app/client/src/app/feedback/dialog.tsx` — Skeleton consumers migrated from raw `preferences?.timezone` to `useResolvedTimezone()` (required because `formatDate` no longer interprets the `"location"` sentinel).

AEMS-specific refactor targets:
- `aems-app/client/src/app/dashboards/components/TimeRangeSelector.tsx` — replaced local `toLocaleString()` formatter with the shared `formatDate` + resolved tz; added `timezone={resolvedTz}` to both `<DateInput3>`s.
- `aems-app/client/src/app/dashboards/components/SiteDashboard.tsx` — timeline tooltip formatter uses shared `formatDate`; time-axis ticks use the new `makeTimeAxisFormatter` on all four ECharts time axes.
- `aems-app/client/src/app/dashboards/components/UnitDashboard.tsx` — same axis formatter wired into the two visible ECharts time axes (four hidden axes left as-is).
- `aems-app/client/src/app/components/common/echarts.tsx` — exported `makeTimeAxisFormatter(timezone)` factory.
- `aems-app/client/src/app/occupancies/page.tsx` — replaced hardcoded `timeZone: "UTC"` with the resolved tz.
- `aems-app/client/src/app/setup/components/Occupancies.tsx` — replaced `new Date(...).toLocaleDateString()` with `timeZone: resolvedTz`.
- `aems-app/client/src/app/setup/components/Holidays.tsx`, `aems-app/client/src/app/setup/components/Holiday.tsx` — inline calendar-only formatters routed through shared `formatDate` (undefined tz, options-only path) for a single code path.

Ran:
- `yarn compile:graphql` in `client/` — regenerated `graphql-codegen/{graphql,gql}.ts`; `ReadConfigQuery` now includes `location`.
- `yarn check` in `client/` — clean.

### 2026-08-26 10:20 UTC — final check

- `yarn check` in `prisma/` — clean (no changes; ran for completeness).
- `yarn check` in `common/` — clean.
- `yarn check` in `server/` — clean.
- `yarn check` in `client/` — clean.

Implementation complete. `useResolvedTimezone()` is now the canonical way to consume the timezone preference — no caller passes raw `preferences?.timezone` to `formatDate` anymore.
