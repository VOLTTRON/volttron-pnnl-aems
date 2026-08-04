# Develop: Document Keycloak Admin Features

**Started:** 2026-07-22 07:47

## Goal
Document the Keycloak admin management features (added July 13–22, 2026) across architecture docs and README. No code changes — documentation only.

## Files to update
1. `.claude/architecture/auth.md` — Keycloak Admin API section + env vars
2. `.claude/architecture/server.md` — graphql/keycloak/ layout + env vars + operations
3. `.claude/architecture/client.md` — /keycloak route + display mode + hooks + env vars
4. `README.md` — env vars table + post-setup user management section
5. `.claude/architecture/docker.md` — keycloak_admin_password secret + KEYCLOAK_ADMIN_INTERNAL_URL

---

## Log

### 2026-07-22 07:47 — All documentation updated

Files modified:

| File | Changes |
|------|---------|
| `.claude/architecture/auth.md` | Added "Keycloak Admin API" subsection under Keycloak section: KeycloakAdminService, syncAdminRole, scope-auth gating, new env vars table (KEYCLOAK_ADMIN, KEYCLOAK_ADMIN_PASSWORD, KEYCLOAK_ADMIN_INTERNAL_URL, KEYCLOAK_ADMIN_ROLE). Fixed profile name from `keycloak` to `sso`. Added note about `keycloak` role in RoleEnum. |
| `.claude/architecture/server.md` | Added `keycloak/` to graphql aggregate list. Added inline section for the keycloak aggregate with full operations table and env vars table. |
| `.claude/architecture/client.md` | Added `keycloak/` to feature routes list. Added `display: "keycloak"` to route system table. Added `keycloak.graphql` to queries file list. Added "Keycloak-aware UI" section covering `/keycloak` page, `useIsKeycloakEnabled`, `keycloakAdminUrl()`, `users/dialog.tsx` changes, and `NEXT_PUBLIC_KEYCLOAK_ADMIN_URL`. |
| `.claude/architecture/docker.md` | Added note about `keycloak_admin_password` being mounted into `server` and `services` containers. Added `KEYCLOAK_ADMIN_INTERNAL_URL` to Environment section. |
| `README.md` | Added Keycloak server env vars table to the "Keycloak Authentication (optional)" section. Added "Managing Keycloak Users via the App" section after the Setup Keycloak walkthrough. |

No build steps required — documentation only.

### Result: PASS
