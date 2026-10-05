# secrets

**State:** unbuilt

## Contract

How credentials reach the running stack and how they change. `.env` is the single input compose
reads, tracked with a sentinel for every secret; `.env.secrets` is an optional, gitignored store the
operator edits; `secrets.sh` / `secrets.ps1` carry one into the other and apply the change to whatever
already holds the old value. It guarantees every other unit that a credential in its environment is
the one its peers accept, whatever git has done to the checkout; not which services use which.

## Claims

- A fresh checkout with no `.env.secrets` boots, and boots again: the sentinels in `.env` are valid
  runtime defaults, and a blank entry in `.env.secrets` means the sentinel.
- With no `.env.secrets`, `secrets.sh` writes a stub seeded from every sentinel key in `.env`.
- `secrets.sh` overlays every non-blank, non-placeholder value from `.env.secrets` onto `.env` in
  place, and does nothing when the two already agree. Both scripts write it UTF-8 without a BOM, with
  LF endings, each value quoted so that `$`, `#` and spaces reach the container unchanged.
- While `.env` holds a real value, git cannot see or restore it: `secrets.sh` marks it
  `skip-worktree`, so `stash`, `checkout` and `reset --hard` leave it and `add -A` does not stage it.
  `secrets.sh --scrub` writes the tracked sentinel version back and clears the mark.
- The deployed value of a credential is read from the running container, never from `.env`, so a
  `.env` reset to its sentinels under a running stack is re-synced with no rotation and no recreate.
- A value differing between `.env.secrets` and the running container is applied to the service with
  the old value (`ALTER ROLE`, `kcadm`, `grafana-cli`) and that service recreated with `up -d
  --no-deps`; when its container is down the script refuses unless `--force`; `--dry-run` changes nothing.
- A Postgres role whose stored password matches the sentinel rather than `.env.secrets` is rotated to
  the `.env.secrets` value without operator action.
- After any `HISTORIAN_*_PASSWORD` rotation, and after every `start-services`, the VOLTTRON
  SQLHistorian agent's install-time config matches `historian.config`.
- Every script that runs `docker compose` to create containers — `start-services`, `reset-service`,
  `restart-service` — syncs `.env` first; `start-services` syncs before `check-env` judges it, and
  again when `up -d` fails. Nothing exports `.env` into the shell, where it would outrank `.env`.
- `check-env.sh` and `check-env.ps1` report the same findings — an incomplete `.env.secrets`, a
  sentinel `.env` beside a real `.env.secrets` — without blocking startup.
- `readSecret` reads a plain environment variable with a default.

## Dependencies

stack

## Scenarios

| Name | Proves |
|---|---|
| `fresh-checkout-boots` | sentinels and blank entries are valid defaults, twice |
| `secrets-bootstrap` | the stub on a first run |
| `secrets-overlay-idempotent` | overlay onto `.env`, no-op when equal |
| `env-write-format` | no BOM, LF, quoting survives `$ # space`, from both scripts |
| `env-hidden-from-git` | `skip-worktree` survives stash, checkout, reset; `--scrub` restores |
| `env-reset-resynced` | a reset `.env` under a running stack re-syncs without rotating |
| `secrets-rotate-live` | live rotation, refusal when down, `--dry-run` |
| `pg-shadow-drift-healed` | sentinel-initialised role rotated |
| `historian-config-reconciled` | SQLHistorian config matches after rotation and deploy |
| `compose-paths-sync-first` | each script syncs first, before `check-env`, after a failed `up` |
| `no-env-export` | no `env.sh`, and no script exports `.env` into the shell |
| `check-env-warns` | reports without blocking, `.sh` and `.ps1` alike |
| `read-secret-env` | `readSecret` reads the variable |
