# Roster

Foundations first. The build command takes the earliest unbuilt unit whose dependencies are all built.

| Unit | State | Depends on |
|---|---|---|
| `stack` | built | — |
| `secrets` | built | stack |
| `auth` | built | stack |
| `graphql` | built | auth |
| `upgrade` | unbuilt | secrets, stack |
| `shell` | unbuilt | auth, graphql |
| `keycloak-admin` | unbuilt | auth, graphql |
| `background` | built | stack |
| `logging` | built | background |
| `backup` | built | background |
| `ext-geography` | built | auth |
| `content-admin` | unbuilt | graphql |
| `site-model` | unbuilt | graphql, background |
| `setpoints-schedules` | unbuilt | site-model |
| `controls-ilc` | unbuilt | site-model |
| `volttron-sync` | unbuilt | site-model, background |
| `historian-dashboards` | unbuilt | site-model, stack |
| `grafana-access` | unbuilt | site-model, keycloak-admin |
| `synthetic-setup` | unbuilt | site-model, background |
