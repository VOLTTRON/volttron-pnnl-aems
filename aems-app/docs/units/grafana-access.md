# grafana-access

**State:** unbuilt

## Contract

Who may open which Grafana dashboard. The edge's grafana-setup builds one dashboard per unit and one
Site Overview per building, and gives each a Keycloak role. It then writes
`{campus}--{building}_dashboard_urls.json`, listing each dashboard's URL and role. The app reads those
files and grants each user the roles their units entitle them to, and Grafana enforces the roles. The
Keycloak admin client used here belongs to keycloak-admin.

Implemented today in `server/src/api/grafana.controller.ts`, `server/src/grafana/` and `server/src/keycloak/keycloak-sync.service.ts` (its Grafana roles).

## Claims

- One parser, shared by every reader, takes a dashboard config's campus and building from its
  filename. It splits `campus--building_dashboard_urls.json` at the first `--`. When there is no `--`,
  it splits `campus_building_dashboard_urls.json` at the first `_`.
- The configs under `GRAFANA_CONFIG_PATH` are re-read before each role sync and each dashboard lookup,
  so a config written after start is used without a restart.
- A user with the `user` role is granted exactly the `keycloak_role` values the configs list for two
  things: each assigned unit's dashboard, matched on campus, building and system, and the Site
  Overview of each building where they have a unit. An admin is granted every role the configs list.
- A sync removes every Grafana client role a user holds that is not granted above. A sync that read no
  config removes nothing.
- Roles sync at start, whenever a user is created or updated, and every night.
- `/api/grafana/dashboard/:campus/:building/:unit` redirects a signed-in user to that dashboard's URL,
  and Grafana decides whether they may view it. The server has no handler for `/grafana`, which the
  proxy sends to Grafana directly.

## Dependencies

site-model, keycloak-admin

## Scenarios

| Name | Proves |
|---|---|
| `dashboard-filename-parsed-once` | both formats, `-` and `_` inside names, one parser for every reader |
| `dashboard-configs-reread` | a config added after start is used by the next sync and lookup |
| `grafana-roles-from-configs` | a user gets the listed roles of their units and buildings, matching case |
| `grafana-sync-removes-safely` | ungranted roles removed; nothing removed when no config was read |
| `grafana-sync-nightly` | the nightly sync runs on consecutive nights |
| `dashboard-redirect-no-handler` | the redirect for a signed-in user; no `/grafana` handler registered |
