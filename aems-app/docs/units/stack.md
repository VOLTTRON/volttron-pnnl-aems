# stack

**State:** unbuilt

## Contract

The Docker Compose deployment: which containers run, in what order, and how they are reached. It
guarantees every other unit a running database and a TLS front door on one hostname. It does not own
credentials — that is `secrets` — or any application behaviour behind the proxy.

## Claims

- Traefik answers on :443 and redirects :80 to HTTPS.
- The certificate Traefik serves for `APP_HOSTNAME` names `APP_HOSTNAME`, issued by the mkcert CA the
  certs service created.
- Traefik routes `/authjs`, `/graphql`, `/api` and `/ext` to server, `/auth/sso/` to Keycloak,
  `/grafana` to Grafana, and everything else on the host to client.
- Responses carry HSTS, X-Frame-Options and X-Content-Type-Options.
- The certs service completes before the proxy starts.
- The init service migrates an empty database and exits 0.
- The seeders service creates the system user on a cold database.
- The profiles are exactly proxy, sso, map, nom, wiki, redis, grafana, historian, volttron, fastapi,
  fastapi-agents and synth; a service in a profile does not start unless that profile is selected.

## Dependencies

None.

## Scenarios

| Name | Proves |
|---|---|
| `http-redirects-to-https` | :80 redirects to HTTPS |
| `tls-cert-names-hostname` | the served certificate names `APP_HOSTNAME` |
| `proxy-routes-by-path` | the path routing table |
| `security-headers-present` | HSTS, X-Frame-Options, X-Content-Type-Options |
| `certs-before-proxy` | the certs service completes before the proxy |
| `cold-init-migrates` | init migrates an empty database |
| `cold-seed-system-user` | seeders create the system user |
| `profiles-gate-services` | the profile list and its gating |
| `fresh-checkout-boots` | sentinels are valid defaults |
| `secrets-bootstrap` | a first `secrets.sh` writes a complete file |
| `secrets-rotate-live` | rotation, refusal when down, `--dry-run` |
| `check-env-warns` | `check-env` reports without blocking |
| `read-secret-env` | `readSecret` reads the variable |
