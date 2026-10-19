# Walkthroughs

## 1. On an existing deployment of `main` whose historian logins fail and whose VOLTTRON configuration is stale, the README's one-time command brings it to the current release with no hand edits: every historian login succeeds, every VOLTTRON agent runs on the current configuration, and the dashboards show new data. `update` then takes it to a release that changes the tracked `.env`, again with no hand edits.

**Needs:** `historian-logins-verified` `volttron-setup-rerenders` `volttron-store-reconciled`
`startup-repushes-controls` `deploy-report` `upgrade-from-broken-fixture` `historian-config-reconciled`
`update-pulls-changed-env` `update-keeps-env-only-values` `main-reaches-release`

## 2. On a fresh host, `secrets.sh`, `start-services` then `trust-ca` bring the app up at `https://<host>`, a real browser on that host opens it with no certificate warning, and an operator logs in through Keycloak to the dashboard.

**Needs:** `fresh-checkout-boots` `secrets-bootstrap` `certs-before-proxy` `tls-cert-names-hostname`
`trust-ca-installs-issuer` `cold-init-migrates` `cold-seed-system-user` `session-cookie-attributes`
`first-load-no-console-errors`
