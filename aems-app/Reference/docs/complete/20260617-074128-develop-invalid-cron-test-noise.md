# Fix: invalid-cron test noise

## Summary
Silence the `Invalid cron expression 'not-a-cron'` stderr bleed from the backup service test and add a positive assertion that the error was actually logged.

## Changes

### 2026-06-17 07:41 — server layer
- `server/src/services/backup/backup.service.test.ts`: added `Logger` import, spied on `Logger.prototype.error`, added assertion, restored spy.
- No production code changes.
- Result: PASS — 8/8 tests pass, no logger bleed in output
