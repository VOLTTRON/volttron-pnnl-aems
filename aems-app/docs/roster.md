# Roster

Foundations first. The build command takes the earliest unbuilt unit whose dependencies are all built.

| Unit | State | Depends on |
|---|---|---|
| `stack` | built | — |
| `secrets` | built | stack |
| `auth` | unbuilt | stack |
| `graphql` | built | auth |
| `shell` | unbuilt | auth, graphql |
| `keycloak-admin` | unbuilt | auth, graphql |
| `background` | built | stack |
| `logging` | unbuilt | background |
| `backup` | unbuilt | background |
| `ext-geography` | unbuilt | auth |
| `content-admin` | unbuilt | graphql |
| `site-model` | unbuilt | graphql |
| `setpoints-schedules` | unbuilt | site-model |
| `controls-ilc` | unbuilt | site-model |
| `volttron-sync` | unbuilt | site-model, background |
| `historian-dashboards` | unbuilt | site-model, stack |
| `synthetic-setup` | unbuilt | site-model, background |
