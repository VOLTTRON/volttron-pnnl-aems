# secrets

**State:** built

## Contract

How credentials reach the stack's input. `.env` is the single input compose reads, tracked with a
sentinel for every secret; `.env.secrets` is an optional, gitignored store the operator edits;
`secrets.sh` / `secrets.ps1` carry one into the other. It guarantees every other unit that `.env`
holds the operator's values whatever git has done to the checkout, and that no container prints one
once it is there; applying a changed value to the services holding the old one is `rotation`, and
which services use which is no unit's.

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
- Every script that runs `docker compose` to create containers — `start-services`, `reset-service`,
  `restart-service` — syncs `.env` first; `start-services` syncs before `check-env` judges it, and
  again when `up -d` fails. Nothing exports `.env` into the shell, where it would outrank `.env`.
- `check-env.sh` and `check-env.ps1` report the same findings — an incomplete `.env.secrets`, a
  sentinel `.env` beside a real `.env.secrets` — without blocking startup.
- `readSecret` reads a plain environment variable with a default.
- No container prints a credential: after `start-services`, no service's `docker logs` and no file
  under `docker/volttron/logs/` holds the value any key `.env` tracks as the sentinel is deployed
  with, whichever image the service runs.

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
| `compose-paths-sync-first` | each script syncs first, before `check-env`, after a failed `up` |
| `no-env-export` | no `env.sh`, and no script exports `.env` into the shell |
| `check-env-warns` | reports without blocking, `.sh` and `.ps1` alike |
| `read-secret-env` | `readSecret` reads the variable |
| `no-secret-in-logs` | *(owed)* the value each sentinel key is deployed with, read from the running containers, is found in no service's `docker logs` and no file under `docker/volttron/logs/` after `start-services` |
