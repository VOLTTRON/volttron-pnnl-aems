# Develop: install-third-party-cert helper

**Started:** 2026-08-04 15:51:24 UTC
**Design doc:** none in `docs/proposed/` — plan drafted inline via `/develop` flow and approved by user.
**Plan file:** `C:\Users\d3x573\.claude\plans\i-m-walking-through-the-vectorized-wreath.md`

## Problem

`docs/proposed/aems-deployment-guide/aems-deployment-guide.md` §"Apply the TLS Strategy → Third-Party Certificate" tells operators to drop cert files into `aems-app/docker/proxy/` and edit `certs-traefik.yml`. But `docker/proxy/` is not bind-mounted into the Traefik container as a directory — only individual YAML files are. Cert files land somewhere Traefik can't see them. TLS certs actually live in the `certs-data` named Docker volume at `/etc/certs/` in the container.

## Approach

Ship a helper script pair that pushes cert files into `certs-data` via an alpine sidecar, rewrites `certs-traefik.yml` (with timestamped backup), and restarts the proxy. Fix the deployment guide and `docker/proxy/README.md` to reference it.

- New filenames (`<slug>.crt/.key/-ca.crt`, default slug `custom`) — dodges collisions with `mkcert-*.*` and `reset-service.sh certs`.
- Optional `--ca-bundle`.
- Both `.sh` (POSIX bash) and `.ps1` (PowerShell), mirroring `trust-ca.*` structure.

## Layers

This is not a code change to the monorepo build chain (prisma/common/server/client). It's shell tooling + docs, so no build layers apply.

## Progress log

- 2026-08-04 15:51:24 UTC — Plan approved, progress log created.
- 2026-08-04 15:52 UTC — Wrote `aems-app/install-third-party-cert.sh`. `bash -n` and `sh -n` pass. `--help` and preflight error paths verified interactively (missing files → exit 3, correct error text).
- 2026-08-04 15:54 UTC — Wrote `aems-app/install-third-party-cert.ps1`. `PSParser::Tokenize` returns no errors; `Get-Command -Syntax` shows the expected parameter block.
- 2026-08-04 15:55 UTC — Updated `docs/proposed/aems-deployment-guide/aems-deployment-guide.md` §"Apply the TLS Strategy → Third-Party Certificate" (~line 241) with the new script invocation (bash + PowerShell), rotation/idempotency note, and pre-launch behavior.
- 2026-08-04 15:55 UTC — Updated `aems-app/docker/proxy/README.md`: rewrote §"Custom Certificates" to reference the new script and warn against dropping cert files into `docker/proxy/`; fixed §"certs-traefik.yml" example to use the actually-shipped `mkcert-local.*` filenames (was `mkcert-hostname.*` which the current `mkcert.sh` no longer produces); rewrote §"Certificate Path Mapping" to describe the volume-backed layout accurately; replaced §"Manual Renewal (Custom Certificates)" with a one-liner using the installer's rotation mode.
- 2026-08-04 15:55 UTC — All todos complete. No monorepo build layers were touched, so no `yarn check` chain to run. Verification steps (§8 of the plan) require a live Docker daemon and are for the operator to run.

## Verification notes for reviewer

Run the eight scenarios listed in the plan under "Verification" from `aems-app/`. The load-bearing invariants:
- New filenames are used (`<slug>.crt/.key/-ca.crt`), not `mkcert-local.*`, so `reset-service.sh certs` does not clobber user-installed certs.
- YAML backup uses timestamped suffix (`.bak.<UTC-timestamp>`) so repeat `--force` runs don't clobber each other.
- YAML state machine: `pristine` → rewrite, `same-slug` → skip rewrite (idempotent rotation), `other` → refuse unless `--force`.
- Sidecar copy pattern matches `aems-app/backup-restore.sh:753-757` and `aems-app/docker/grafana/prepare-build.sh:20-24`; `MSYS_NO_PATHCONV=1` + `cygpath -w` for Git Bash on Windows.
