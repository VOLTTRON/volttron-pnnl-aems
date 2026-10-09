# keycloak-admin

**State:** built

## Contract

Administration of Keycloak users and roles from inside the app, separate from Keycloak as a login
strategy. It guarantees that a user's app role and their Keycloak admin rights stay in step. It does
not authenticate anyone.

## Claims

- The admin client authenticates to the master realm with a password grant using `KEYCLOAK_ADMIN` and
  `KEYCLOAK_ADMIN_PASSWORD`.
- When `KEYCLOAK_ADMIN_INTERNAL_URL` is set, admin calls go to it directly rather than through Traefik.
- Granting or revoking the `keycloak` role on a user grants or revokes the `realm-admin` client role in
  Keycloak.
- Every operation of the keycloak aggregate requires the `keycloak` scope.
- The `/keycloak` page is shown only to users with the `keycloak` role.
- Whether Keycloak is enabled is fetched from `/api/auth` once per session.

## Dependencies

auth, graphql

## Scenarios

| Name | Proves |
|---|---|
| `admin-password-grant` | master-realm authentication |
| `admin-internal-url` | the internal URL bypass |
| `keycloak-role-mirrors-realm-admin` | grant and revoke mirroring |
| `aggregate-requires-keycloak-scope` | scope on every operation |
| `keycloak-page-gated` | *(owed)* page visibility |
| `keycloak-enabled-cached` | *(owed)* one fetch per session |
