# Walkthroughs

## 1. On an existing deployment of `main` whose historian logins fail and whose VOLTTRON configuration is stale, the README's one-time command brings it to the current release with no hand edits: every historian login succeeds, every VOLTTRON agent runs on the current configuration, and the dashboards show new data. `update` then takes it to a release that changes the tracked `.env`, again with no hand edits.

**Needs:** `historian-logins-verified` `volttron-setup-rerenders` `volttron-store-reconciled` `startup-repushes-controls` `deploy-report` `upgrade-from-broken-fixture` `historian-config-reconciled` `update-pulls-changed-env` `update-keeps-env-only-values` `main-reaches-release`
**Open:** On Docker Desktop (Windows), after the README's command `volttron` restarts in a loop: setup-platform logs `Platform_config: None`, then `volttron` dies on `No module named 'wheel.tool'` (`volttron/platform/aip.py:42`), 73 restarts through `update` to the next release, so neither VOLTTRON reconcile ran and the deployment report reads `NO ANSWER`. Compose created the container at 18:41:03 and `volttron-setup` re-rendered `configs/` at 18:41:43 (`aems-edge/setup-volttron.sh:274`); a new container on the same mounts reads `/platform_config.yml` as a 3157-byte file, and this one never does.
**Open:** After the README's command on a `main` deployment, the historian's `replicator` role accepts neither `HISTORIAN_REPLICATOR_PASSWORD` from `.env.secrets` nor the sentinel, and a `replicator` login from the network gateway fails every 5 s from the historian's first start; `secrets.sh:902` prints "manual reconciliation required" for it and for `grafana` on `grafana-db`, whose only role is `historian`; the deployment report names only `role historian`.

**On deck.**

## 2. On a fresh host, `secrets.sh`, `start-services` then `trust-ca` bring the app up at `https://<host>`, a real browser on that host opens it with no certificate warning, and an operator logs in through Keycloak to the dashboard.

**Needs:** `fresh-checkout-boots` `secrets-bootstrap` `certs-before-proxy` `tls-cert-names-hostname`
`trust-ca-installs-issuer` `cold-init-migrates` `cold-seed-system-user` `session-cookie-attributes`
`first-load-no-console-errors`
