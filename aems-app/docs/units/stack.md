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
- Every file Traefik is given under `docker/proxy/` is loaded; none is shadowed by another provider
  flag.
- Traefik routes `/authjs`, `/graphql`, `/api` and `/ext` to server, `/auth/sso/` to Keycloak,
  `/grafana` to Grafana, and everything else on the host to client.
- Responses carry HSTS, X-Frame-Options and X-Content-Type-Options.
  **Open:** the tracked `.env:25` sets `STS_SECONDS=` with the stated reason "0 = disabled (dev default; browsers delete any cached policy)", and every router sends `stsSeconds=${STS_SECONDS:-0}` (`docker/docker-compose.yml:96,154`), so a deployment from the tracked `.env` sends no `Strict-Transport-Security` header at all (measured on `aems.local`: absent on `/` and `/graphql`).
- The certs service completes before the proxy starts.
- The init service migrates an empty database and exits 0.
- The seeders service creates the system user on a cold database.
- Before `reset-service` removes `historian-data`, it says that every remote subscriber must drop and
  re-create its subscription.
- The profiles are exactly proxy, sso, map, nom, wiki, redis, grafana, historian, volttron, fastapi,
  fastapi-agents and synth; a service in a profile does not start unless that profile is selected.

## Dependencies

None.

## Scenarios

| Name | Proves |
|---|---|
| `http-redirects-to-https` | :80 redirects to HTTPS |
| `tls-cert-names-hostname` | the served certificate names `APP_HOSTNAME` |
| `proxy-config-all-loaded` | no Traefik config file under `docker/proxy/` is shadowed |
| `proxy-routes-by-path` | the path routing table |
| `security-headers-present` | HSTS, X-Frame-Options, X-Content-Type-Options |
| `certs-before-proxy` | the certs service completes before the proxy |
| `cold-init-migrates` | init migrates an empty database |
| `cold-seed-system-user` | seeders create the system user |
| `profiles-gate-services` | the profile list and its gating |
| `reset-warns-subscribers` | the warning precedes removing `historian-data` |
