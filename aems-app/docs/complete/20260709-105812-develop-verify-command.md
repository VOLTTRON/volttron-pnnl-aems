# Develop: /verify Command — 20260709-105812

Feature slug: verify-command

## Design doc
No prior design doc in docs/proposed/. Feature designed inline during session.

## Progress

### [20260709-105812] Setup
Explored codebase: read all 11 existing command files, docker-compose.yml, deployment.md, docker.md, auth.md, scripts/audit.sh. No existing /verify command or skill found. Identified 23 deployment edge cases from architecture docs.

### [20260709-110000] Prisma layer
No schema changes needed. Skipped.

### [20260709-110001] Common layer
No shared type changes needed. Skipped.

### [20260709-110002] Server layer
No GraphQL or NestJS changes needed. Skipped.

### [20260709-110003] Client layer
No Next.js changes needed. Skipped.

### [20260709-110004] Command implementation
Created:
- `.claude/commands/verify.md` — full command definition with mode selection prompt, all 23 edge case checks across 6 non-destructive phases and 6 additional destructive phases, remediation hints table
- `scripts/verify-browser.mjs` — Node ESM Playwright script covering EC-TLS, EC-APP-LOAD, EC-SECURITY-HEADERS, EC-COOKIE-ATTRS, EC-AUTH-PAGE, EC-NO-CONSOLE-ERRORS

### [20260709-110005] Final check
No build chain changes were made (command file + browser script only). No yarn check or schema regen needed.

## Outcome
COMPLETE — /verify skill is now active. Use `/verify` to run interactively.
