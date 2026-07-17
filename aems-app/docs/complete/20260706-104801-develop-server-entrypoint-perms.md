# Fix: server container `Permission denied` on `/usr/local/bin/docker-entrypoint.sh`

## Problem

Production Linux host (`aems2`) shows a boot loop on the `server` service:

```
aems-server  | /bin/sh: can't open '/usr/local/bin/docker-entrypoint.sh': Permission denied
```

`can't open ... Permission denied` (as opposed to "not found") means `/bin/sh` resolved the path but could not read the file as the running user (`node`, uid 1000). The container is restarting under `restart: unless-stopped`, which is why the message repeats.

## Root cause

[server/Dockerfile:96-98](../../server/Dockerfile) does `COPY … && RUN chmod +x`. On paper that works, but it is fragile:

- If a prior build cached the layer with a bad mode (e.g. source file was `0600` at the time, or came in via a Windows path with no exec bit), later builds can reuse that broken cached layer.
- The `chmod` runs in a separate layer, so its effect depends on the previous layer's file mode remaining correct across cache reuses.

`COPY --chmod=0755` sets the mode atomically inside the same layer and is independent of the source-tree mode.

## Layer log

### Server layer — 2026-07-06 10:48 PDT

**File changed**: [server/Dockerfile](../../server/Dockerfile)

Replaced:
```dockerfile
COPY server/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
```
with:
```dockerfile
COPY --chmod=0755 server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
```

No Prisma / common / client / GraphQL changes. Schema unchanged. `yarn compile:schema` not needed.

## Deployment on `aems2`

From the repo root:

```bash
cd ~/volttron-pnnl-aems/aems-app
git pull
docker compose build --no-cache server
docker compose up -d server
docker compose logs -f server
```

`--no-cache` is required — a plain rebuild may reuse the poisoned cached layer.

## Verification

- `docker run --rm --entrypoint sh <server-image> -c 'ls -l /usr/local/bin/docker-entrypoint.sh'` → `-rwxr-xr-x`.
- `docker compose logs server` shows the entrypoint banner (`Setting up CA certificates for Node.js...`, `Starting application...`) then Nest bootstrap, ending with the app listening on :3000.
- `docker compose ps server` reports `healthy` within ~2 min (graphql healthcheck at retries=120, interval=10s).
