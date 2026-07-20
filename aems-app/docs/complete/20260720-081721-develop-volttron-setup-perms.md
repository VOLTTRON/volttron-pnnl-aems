# Develop log — volttron-setup perms

## Problem

Linux deployment logs flood every 10s with:

```
[ControlService] Error: EACCES: permission denied, scandir '/app/volttron/templates'
  at getConfigFiles (/app/server/dist/utils/file.js:30:50)
```

`aems-services` runs as `node` (UID 1000; [aems-app/server/Dockerfile:102](aems-app/server/Dockerfile#L102)). It bind-mounts `./volttron/setup/` → `/app/volttron/:ro` ([aems-app/docker/docker-compose.yml:280](aems-app/docker/docker-compose.yml#L280)). The host tree is populated by the `volttron-setup` sidecar built from a separate repo — [aems-edge/Dockerfile](aems-edge/Dockerfile) — which uses `FROM python:3` with no `USER` directive, so it writes root-owned files.

## Related risks scanned

Same producer/consumer shape (root writer → non-root reader) for:

- `/app/volttron/templates/` (control.service:89) — the reported failure
- `/app/volttron/configs/configuration_store/` (setup.service:319)
- `/app/volttron/site.json` (setup.service:385)
- `/app/grafana/…_dashboard_urls.json` (grafana.controller:61 + keycloak-sync)

Grafana's setup writes into a named volume (`grafana-setup`), not a host bind mount — but the internal file modes still depend on the writer's umask, so it fails the same way.

## Chosen approach

`chmod -R a+rX "${OUTPUT_DIR}"` at the tail of each setup script. Rejected alternatives:

- Non-root `volttron-setup` breaks `pip install -r requirements.txt` (system site-packages).
- Two-phase root→node entrypoint on `services` can't chown a `:ro` mount.

`a+rX` (capital X) sets exec only on directories and already-exec files — exactly what UID 1000 needs to `readdir` + `readFile`.

## Layers

No prisma / common / server / client changes. Fix lives entirely in the `aems-edge/` shell scripts.

### aems-edge/setup-volttron.sh
- 20260720-081721 — inserted `chmod -R a+rX "${OUTPUT_DIR}"` after the templates copy (after line 364) and before the SSL-config rewrite / lock write. DONE.

### aems-edge/setup-grafana.sh
- 20260720-081721 — inserted `chmod -R a+rX "${OUTPUT_DIR}"` inside the `run_grafana_dashboard_generation` success branch, before the dashboard-urls check and lock write. DONE.

### Final check
- 20260720-081721 — `yarn check` in prisma / common / server / client, all clean. DONE.

## Recovery for existing deployments

Lock at `/home/user/setup/.setup_complete` lives in the `volttron-setup` named volume, so `git pull` + rebuild alone won't re-run. Two options:

**A — chmod on host, no re-run:**
```bash
sudo chmod -R a+rX aems-app/docker/volttron/setup/
docker compose restart services
docker compose run --rm --entrypoint sh grafana-setup -c 'chmod -R a+rX /home/user/setup/'
docker compose restart services server
```

**B — force re-run:**
```bash
docker compose down volttron-setup grafana-setup
docker volume rm ${COMPOSE_PROJECT_NAME}_volttron-setup ${COMPOSE_PROJECT_NAME}_grafana-setup
docker compose build volttron-setup grafana-setup
docker compose up -d volttron-setup grafana-setup
docker compose restart services server
```

## Concerns

- `a+rX` makes the config trees world-readable **inside the container** — they contain the historian DB password, Grafana admin creds, Keycloak admin creds. Same creds already reach these containers via `.env.*`, so no new exposure surface. Host files stay root-owned.
- `.setup_complete` is a boolean, not a version stamp. Future fixes that need to re-run won't auto-propagate to existing deployments — worth a follow-up ticket.
- No changes to `aems-app/server/src/utils/file.ts`. Swallowing `EACCES` there would silently mask real drift.
