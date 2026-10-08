# Roster

Foundations first. The build command takes the earliest unbuilt unit whose dependencies are all built.

| Unit | State | Depends on |
|---|---|---|
| `stack` | built | — |
| `secrets` | built | stack |
| `auth` | built | stack |
| `graphql` | built | auth |
| `upgrade` | built | secrets, stack |
| `shell` | unbuilt | auth, graphql |
| `keycloak-admin` | unbuilt | auth, graphql |
| `background` | built | stack |
| `logging` | built | background |
| `backup` | built | background |
| `ext-geography` | built | auth |
| `content-admin` | built | graphql |
| `site-model` | built | graphql, background |
| `setpoints-schedules` | built | site-model |
| `controls-ilc` | built | site-model |
| `volttron-sync` | built | site-model, background |
| `historian-dashboards` | built | site-model, stack |
| `grafana-access` | built | site-model, keycloak-admin |
| `synthetic-setup` | unbuilt | site-model, background |
