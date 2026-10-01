# Walkthroughs

Ordered. The top entry is the active one. A verified walkthrough is **deleted**, not archived — git
history is the record.

Each entry is one sentence describing a cold start, and it is done when that sentence happens on a real
build with no developer shortcuts. A walkthrough is named by its sentence, never by its number or its
place in the list.

## 1. On a fresh host, `secrets.sh` then `start-services` brings the app up at `https://<host>`, a real browser opens it with no certificate warning, and an operator logs in through Keycloak to the dashboard.

**Needs:** `fresh-checkout-boots` `secrets-bootstrap` `certs-before-proxy` `tls-cert-names-hostname`
`cold-init-migrates` `cold-seed-system-user` `session-cookie-attributes` `first-load-no-console-errors`
