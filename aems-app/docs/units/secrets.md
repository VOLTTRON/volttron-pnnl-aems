# secrets

**State:** unbuilt

## Contract

How credentials reach the running stack and how they change. `.env` is the single input compose
reads; `.env.secrets` is an optional, gitignored store the operator edits; `secrets.sh` / `secrets.ps1`
carry one into the other and apply the change to whatever already holds the old value. It guarantees
every other unit that a credential in its environment is the one its peers accept. It does not own
which services use which credential.

## Claims

- A fresh checkout with no `.env.secrets` boots: the sentinels in `.env` are valid runtime defaults.
- With no `.env.secrets`, `secrets.sh` writes a stub seeded from every sentinel key in `.env`, and
  exits for the operator to fill it in.
- `secrets.sh` overlays every non-blank, non-placeholder value from `.env.secrets` onto `.env` in
  place, and does nothing when the two already agree.
- A value that differs between `.env.secrets` and `.env` is applied to the running service with the
  old value (`ALTER ROLE`, `kcadm`, `grafana-cli`) and the service recreated with `up -d --no-deps`;
  when the affected container is down the script refuses unless `--force`, and `--dry-run` changes
  nothing.
- A Postgres role whose stored password matches the sentinel rather than `.env.secrets` is rotated to
  the `.env.secrets` value without operator action.
- After any `HISTORIAN_*_PASSWORD` rotation, and after every `start-services`, the VOLTTRON
  SQLHistorian agent's install-time config matches `historian.config`.
- When `docker compose up -d` fails inside `start-services`, `secrets.sh` runs before the script
  gives up.
- `check-env` reports an incomplete or placeholder `.env.secrets`, and a sentinel still in `.env`,
  without blocking startup.
- `readSecret` reads a plain environment variable with a default.

## Dependencies

stack

## Scenarios

| Name | Proves |
|---|---|
| `fresh-checkout-boots` | sentinels are valid defaults |
| `secrets-bootstrap` | the stub on a first run |
| `secrets-overlay-idempotent` | overlay onto `.env`, no-op when equal |
| `secrets-rotate-live` | live rotation, refusal when down, `--dry-run` |
| `pg-shadow-drift-healed` | sentinel-initialised role rotated |
| `historian-config-reconciled` | SQLHistorian config matches after rotation and deploy |
| `start-services-self-heals` | `secrets.sh` runs after a failed `up` |
| `check-env-warns` | reports without blocking |
| `read-secret-env` | `readSecret` reads the variable |
