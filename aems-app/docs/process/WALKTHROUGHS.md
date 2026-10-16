# Walkthroughs

## 1. On an existing deployment whose historian logins fail, whose VOLTTRON configuration is stale and whose `.env` holds real values, `update` brings it to a release that changes the tracked `.env` with no hand edits: every historian login succeeds, every VOLTTRON agent runs on the current configuration, and the dashboards show new data.

**Needs:** `historian-logins-verified` `volttron-setup-rerenders` `volttron-store-reconciled`
`startup-repushes-controls` `deploy-report` `upgrade-from-broken-fixture` `historian-config-reconciled`
`update-pulls-changed-env` `update-keeps-env-only-values`

**Open:** no document says how a deployment on a release without `update` reaches one that has it: `main` ships neither `update.sh` nor `update.ps1` (`git ls-tree main aems-app/`), they first land on develop in `b0b4702b`, and a deployment whose historian logins fail and whose VOLTTRON configuration is stale is one on such a release.

## 2. On a fresh host, `secrets.sh`, `start-services` then `trust-ca` bring the app up at `https://<host>`, a real browser on that host opens it with no certificate warning, and an operator logs in through Keycloak to the dashboard.

**Needs:** `fresh-checkout-boots` `secrets-bootstrap` `certs-before-proxy` `tls-cert-names-hostname`
`trust-ca-installs-issuer` `cold-init-migrates` `cold-seed-system-user` `session-cookie-attributes`
`first-load-no-console-errors`
