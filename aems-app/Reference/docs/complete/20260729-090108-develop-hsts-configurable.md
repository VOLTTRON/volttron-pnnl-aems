# hsts-configurable

## 2026-07-29 09:01:08 — Complete

### Change

Made HSTS `stsSeconds` configurable via `STS_SECONDS` env var, defaulting to `0` (dev-safe).

### Files changed

| File | Change |
|---|---|
| `docker/docker-compose.yml` | `stsSeconds=31536000` → `stsSeconds=${STS_SECONDS:-0}` in `client-security`, `server-security`, `keycloak-security` middlewares (lines 128, 191, 506) |
| `.env` | Added `STS_SECONDS=` with comment after `HOST_IP=` in Traefik section |

### To clear the existing lockout in Edge

1. `edge://net-internals/#hsts` → Delete domain policy for `test.local`
2. `docker compose down && docker compose --profile proxy up -d` from repo root
3. Run `docker/proxy/trust-ca.ps1` to install the mkcert CA permanently

### Production

Set `STS_SECONDS=31536000` in `.env` alongside `CERT_RESOLVER=letsencrypt`.
