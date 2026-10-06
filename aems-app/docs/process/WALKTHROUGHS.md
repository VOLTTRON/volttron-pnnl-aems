# Walkthroughs

Ordered; the top one is active, and a verified one is **deleted**. Each is one sentence about a start
from a stated host, done when it happens on a real build with no shortcuts, and named by its sentence.

## 1. On an existing deployment whose historian logins fail and whose VOLTTRON configuration is stale, `git pull` then `start-services` brings it back with no hand edits: every historian login succeeds, every VOLTTRON agent runs on the current configuration, and the dashboards show new data.

**Needs:** `historian-logins-verified` `volttron-setup-rerenders` `volttron-store-reconciled`
`startup-repushes-controls` `deploy-report` `upgrade-from-broken-fixture` `historian-config-reconciled`

## 2. On a fresh host, `secrets.sh` then `start-services` brings the app up at `https://<host>`, a real browser opens it with no certificate warning, and an operator logs in through Keycloak to the dashboard.

**Needs:** `fresh-checkout-boots` `secrets-bootstrap` `certs-before-proxy` `tls-cert-names-hostname`
`cold-init-migrates` `cold-seed-system-user` `session-cookie-attributes` `first-load-no-console-errors`
