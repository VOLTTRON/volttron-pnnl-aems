# Develop: keycloak role

Feature: Add `keycloak` role with Keycloak Admin Console integration.

No design doc found — decisions documented inline.

---

## 2026-07-13 07:40 — Starting Layer 1 (Common)

### Layer 1 — Common (PASS)
- `common/src/constants/index.ts`: added `Keycloak = "keycloak"` to `RoleEnum`
- `common/src/constants/role.ts`: added keycloak entry in Role constructor, added `Keycloak`/`KeycloakType` static refs
- `yarn build && yarn check` — pass

### Layer 2a — Server Config (PASS)
- `server/src/app.config.ts`: added `admin: string` and `adminPassword: string` to keycloak config type and constructor
- Reads from `KEYCLOAK_ADMIN` (default `"admin"`) and `readSecret("KEYCLOAK_ADMIN_PASSWORD", "")`

### Layer 2b — Server GraphQL Aggregate (PASS)
- New files: `server/src/graphql/keycloak/keycloak-admin.service.ts`, `object.service.ts`, `query.service.ts`, `mutate.service.ts`
- KeycloakAdminService: token acquisition from master realm, list/assign/revoke realm roles, user lookup via account.providerAccountId
- KeycloakObject: `KeycloakRole { id, name }` Pothos ref
- KeycloakQuery: `readAvailableKeycloakRoles`, `readKeycloakRoles(userId)` — scoped `keycloak: true`
- KeycloakMutation: `assignKeycloakRoles(userId, roles)`, `revokeKeycloakRoles(userId, roles)` — scoped `keycloak: true`

### Layer 2c — Schema module (PASS)
- `server/src/graphql/schema.module.ts`: wired KeycloakAdminService, KeycloakObject, KeycloakQuery, KeycloakMutation into both `@Module` providers and `register()` dynamic providers

### Layer 2d — Env docs (PASS)
- `server/.env`: documented `KEYCLOAK_ADMIN=admin` and `KEYCLOAK_ADMIN_PASSWORD=`

### Server compile:schema + check (PASS)
- Schema regenerated — new queries/mutations appear in schema.graphql and client/schema.graphql
- Fixed `server/src/auth/auth.test.ts` hardcoded `AuthRoles` objects to include `keycloak: false`
- `yarn check` — pass

### Layer 3 — Docker (PASS)
- `docker/docker-compose.yml`: added `keycloak_admin_password` secret to `server` and `services` container secret mounts

### Layer 4a — Client GraphQL (PASS)
- New file: `client/src/queries/keycloak.graphql` with four operations
- `yarn compile:graphql` — pass; hooks generated

### Layer 4b — Hook (PASS)
- New file: `client/src/app/components/hooks/useIsKeycloakEnabled.ts`
- Fetches `/api/auth` once (module-level cache), returns `true` if `keycloak` is in the provider list

### Layer 4c — Route (PASS)
- `client/src/app/routes.ts`: added `keycloak` route under `admin` parentId, `display: "keycloak"`, `scope: "keycloak"`

### Layer 4d — Page (PASS)
- New files: `client/src/app/keycloak/page.tsx`, `page.module.scss`
- Three sections: Keycloak Admin Console link, documentation links, realm role management UI (user-select + assign/revoke)
- `NEXT_PUBLIC_KEYCLOAK_ADMIN_URL` env var (default `/auth/sso/admin`)

### Layer 4e — User Dialog (PASS)
- `client/src/app/users/dialog.tsx`: added `useIsKeycloakEnabled` import and usage in both `CreateUser` and `UpdateUser`
- Password field: conditional helper note with link to Keycloak Admin Console when Keycloak is enabled
- Role checkboxes: filter out `keycloak` role when Keycloak is not enabled
- New file: `client/src/app/users/dialog.module.scss` (helper text style)

### Final full workspace check (PASS)
- prisma → common → server → client: all `yarn check` pass
