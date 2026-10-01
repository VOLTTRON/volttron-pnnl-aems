# stack

**State:** unbuilt
**Contract:** partial — how `.env.secrets` reaches compose interpolation is pending the port from the
secrets branch.

## Contract

The Docker Compose deployment: which containers run, in what order, how they are reached, and how
their secrets are created and rotated. It guarantees every other unit a running database, a TLS
front door on one hostname, and a configuration that boots from a fresh checkout. It does not own any
application behaviour behind the proxy.

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
- A fresh checkout with no `.env.secrets` boots: the sentinels in `.env` are valid runtime defaults.
- `secrets.sh` creates a complete `.env.secrets` on a first run.
- `secrets.sh` rotates a changed credential into the running services, and refuses when the affected
  container is down unless `--force` is given; `--dry-run` changes nothing.
- `check-env` reports an incomplete or placeholder `.env.secrets` and does not block startup.
- `readSecret` reads a plain environment variable with a default.

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
