# Develop log: secrets-fresh-deploy

## Problem

`.\secrets.ps1` (and `./secrets.sh`) misclassifies "clean instantiation with residual `docker/secrets/*.txt` files from a prior run" as a rotation, then aborts because the target container (e.g. `aems-keycloak`) isn't running yet. See user-reported output — `KEYCLOAK_ADMIN_PASSWORD` rotation failed because `aems-keycloak` was not up, aborting the whole write pass.

Root cause: the classifier at `secrets.ps1:281-308` treats presence of `docker/secrets/<key>.txt` as evidence that a deployment exists. That's not true — those files can be residue.

## Approach

Probe Docker directly (`docker ps -a` + `docker volume ls`) for `${PROJECT}-*` containers or `${PROJECT}_*` volumes as the source-of-truth "is a deployment present" signal. When no deployment exists AND `docker/secrets/*.txt` residue differs from `.env.secrets`, warn the user, prompt for confirmation, then overwrite as a fresh write.

New `-Yes` / `--yes` flag for non-interactive confirmation. Existing `-Force` extended to also auto-confirm (it already means "just write, skip rotation").

## Progress

- 2026-07-28 09:07 — plan approved, progress log started.
- 2026-07-28 09:14 — implemented in `secrets.ps1` (added `Test-ProjectHasContainers`, `Test-ProjectHasVolumes`, `Test-DeploymentExists`; `-Yes` flag; residue branch inserted between key enumeration and classification; header comment extended with lane 5).
- 2026-07-28 09:20 — mirrored in `secrets.sh` (`project_has_containers`, `project_has_volumes`, `deployment_exists`; `--yes` flag; matching residue branch).
- 2026-07-28 09:22 — both scripts pass syntax check (`bash -n`, PowerShell tokenizer).
- 2026-07-28 09:26 — end-to-end verification on scratch copies:
  - **Scenario A** (residue + `-Yes`/`--yes`): residue detected, auto-confirmed, files overwritten, classifier sees all `unchanged`, `All secrets are up to date.` exit 0. Verified in both `secrets.sh` and `secrets.ps1`.
  - **Scenario C** (residue, no auto-confirm, `< /dev/null`): prompt refuses without answer, exits 1, files unchanged.
  - **Scenario F** (`aems_*` volumes present in real repo state): residue branch does NOT fire — `deployment_exists` returns true because named volumes exist. Falls through to existing classification/rotation flow, which correctly aborts on a downed Keycloak container. This is the intended safety behavior.

## Applying to the user's real repo

The user's local state has `aems_*` volumes (nominatim, grafana, volttron) but no `aems-*` containers. My detection returns true (deployment exists), so the residue branch will not run automatically. Options for the user:

1. **`docker compose down -v`** to wipe volumes (destroys nominatim / grafana state), then re-run `.\secrets.ps1` — the residue branch will fire and offer to overwrite.
2. **Manually delete the two residue files** `docker/secrets/worker_token.txt` and `docker/secrets/keycloak_admin_password.txt`, then re-run `.\secrets.ps1` — classifier will FreshWrite those two, everything else Noop.
3. **Bring the stack up with `--profile sso`** first (`docker compose up -d --profile sso`), then `.\secrets.ps1` — rotations will apply against the live containers.

- 2026-07-28 09:35 — followup: user noted that the rotation-abort path still required a `-Force` re-run when the target container wasn't up (this is the code path that hits when volumes are present, i.e. the user's real repo state). Replaced the hard abort with an interactive prompt: `Overwrite anyway (skip rotation)? [y/N]`. `-Yes` / `--yes` and `-Force` / `--force` auto-confirm. On decline, exits 1 with a shortened message (no more "OR pass -Force"). Verified end-to-end on scratch copies in both PowerShell and shell.
- 2026-07-28 09:50 — user pointed out that the "deployment exists" check was firing against **orphan `aems_*` volumes** (`aems_volttron-*`, `aems_grafana-config`, `aems_certs-data-test`) that are not declared in the current `docker-compose.yml` and don't hold credentials. This meant the residue branch never fired even when all changed keys had no live state to protect. Narrowed the volume check to a **per-secret mapping** of volume names that actually persist credentials:
  - `DATABASE_PASSWORD` → `database-data`
  - `KEYCLOAK_ADMIN_PASSWORD` / `KEYCLOAK_DATABASE_PASSWORD` / `KEYCLOAK_CLIENT_SECRET` / `BOOKSTACK_KEYCLOAK_CLIENT_SECRET` → `keycloak-data`
  - `NOMINATIM_DATABASE_PASSWORD` → `nominatim-data`
  - `BOOKSTACK_ROOT_PASSWORD` / `BOOKSTACK_DATABASE_PASSWORD` → `wiki-data`

  The residue check now runs **per-key**: a changed key falls into the residue lane iff neither `${PROJECT}-*` containers exist AND its specific data volume is absent. Verified against the user's actual repo state (`aems_nominatim-data` present, `keycloak-data` absent): `WORKER_TOKEN` and `KEYCLOAK_ADMIN_PASSWORD` go through the residue path; if `NOMINATIM_DATABASE_PASSWORD` had changed, it would correctly route to the rotation prompt because its data volume exists.

## Files changed

- [aems-app/secrets.ps1](../../secrets.ps1)
- [aems-app/secrets.sh](../../secrets.sh)
