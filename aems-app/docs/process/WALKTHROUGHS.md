# Walkthroughs

## 1. On an existing deployment of `main` whose historian logins fail and whose VOLTTRON configuration is stale, the README's one-time command brings it to the current release with no hand edits: every historian login succeeds, every VOLTTRON agent runs on the current configuration, and the dashboards show new data. `update` then takes it to a release that changes the tracked `.env`, again with no hand edits.

**Needs:** `historian-logins-verified` `volttron-setup-rerenders` `volttron-store-reconciled` `startup-repushes-controls` `deploy-report` `upgrade-from-broken-fixture` `historian-config-reconciled` `update-pulls-changed-env` `update-keeps-env-only-values` `main-reaches-release` `volttron-config-through-directory` `pg-probe-admitted-login`
**Open:** On a `main` deployment whose historian role is on a stale password, the README's command prints `pg_shadow does not accept either the sentinel or the .env.secrets value for historian — manual reconciliation required` (`secrets.sh:933`), and `reconcile-historian-logins.sh`, later in the same `start-services`, repairs that role with no hand edit, so the report reads `OK`. No claim says whether `secrets.sh` warns about a role `start-services` goes on to repair.
**Open:** `platform.emailer` reads GOOD after the README's command, then goes BAD 48 s after `update` restarts the historian and stays BAD, health context `SMTP configuration or authentication issue`, so the deployment report reads `NOT HEALTHY` and ends `names something unhealthy`. Its rendered `emailer.config` has `smtp.gmail.com`, a blank `smtp-username` and no `to-addresses`, with no hand edits. No claim says what the report reads for an emailer nobody has configured.

**On deck.**

## 2. On a fresh host, `secrets.sh`, `start-services` then `trust-ca` bring the app up at `https://<host>`, a real browser on that host opens it with no certificate warning, and an operator logs in through Keycloak to the dashboard.

**Needs:** `fresh-checkout-boots` `secrets-bootstrap` `certs-before-proxy` `tls-cert-names-hostname`
`trust-ca-installs-issuer` `cold-init-migrates` `cold-seed-system-user` `session-cookie-attributes`
`first-load-no-console-errors`
