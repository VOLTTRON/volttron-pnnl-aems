# Timezone Preference — 20260825-095515

Feature: Add timezone preference allowing users to choose browser, none, or a specific IANA timezone
for all date display and date input controls in the client.

## Decisions made inline

- `timezone` field added to server-persisted `Preferences` (not client-only) so it syncs across sessions/devices.
- No Prisma migration needed — `preferences` column is already `JSONB`.
- No server GraphQL changes needed — `UserPreferences` scalar passes arbitrary JSON.
- IANA timezone list sourced from `Intl.supportedValuesOf('timeZone')` — no third-party library.
- `"browser"` resolves to `Intl.DateTimeFormat().resolvedOptions().timeZone` at render time.
- `"none"` calls `toLocaleString()` with no options (host OS default — preserves prior behaviour).

## Progress

### Prisma layer

- `prisma/src/index.ts`: added `timezone?: string` to `Preferences` interface (optional for backward compat with existing stored records). `yarn build` PASS.

### Client layer

- `client/src/utils/date.ts`: new `formatDate(value, timezone)` utility — handles `"browser"`, `"none"`, and IANA strings.
- `client/src/app/components/providers/preferences.tsx`: added `timezone: "browser"` to `DefaultPreferences`.
- `client/src/app/components/common/preferences.tsx`: added timezone `HTMLSelect` with `Intl.supportedValuesOf("timeZone")` options prepended with `"browser"` and `"none"`. Save includes `timezone` in `compilePreferences`.
- `client/src/app/components/common/table.tsx`: added `PreferencesContext` + `formatDate`; `"date"` case now uses preference-aware formatting.
- `client/src/app/backups/dialog.tsx`: added `PreferencesContext` + `formatDate`; replaced 4 `toLocaleString()` calls in `ViewRun` component.
- `client/src/app/banners/dialog.tsx`: added `useTimezoneForPicker` hook; both `CreateBanner` and `UpdateBanner` pass resolved `timezone` to `DateInput3`.

### Type check

`prisma/ yarn check` PASS. `client/ yarn check` PASS.
