# rotation

**State:** built

## Contract

How a changed credential reaches the services already holding the old one. The value a service is
deployed with is read from its running container, and where `.env.secrets` differs it is applied there
and the service recreated. It guarantees every other unit that a credential in its environment is the
one its peers accept; how the value reaches `.env` is `secrets`.

## Claims

- The deployed value of a credential is read from the running container, never from `.env`, so a
  `.env` reset to its sentinels under a running stack is re-synced with no rotation and no recreate.
- A value differing between `.env.secrets` and the running container is applied to the service with
  the old value (`ALTER ROLE`, `kcadm`, `grafana-cli`) and that service recreated with `up -d
  --no-deps`; when its container is down the script refuses unless `--force`; `--dry-run` changes nothing.
- A Postgres role whose stored password matches the sentinel rather than `.env.secrets` is rotated to
  the `.env.secrets` value without operator action.
- After any `HISTORIAN_*_PASSWORD` rotation, and after every `start-services`, the VOLTTRON
  SQLHistorian agent's install-time config matches `historian.config`.
- That check waits up to 600 seconds for the platform to answer and the SQLHistorian agent to run
  before giving up, from `start-services` and `secrets.sh`, in `.sh` and `.ps1` alike.
- A changed `VOLTTRON_PASSWORD` reaches both ends: after `secrets.sh`, the platform's `/authenticate`
  accepts the new value and refuses the old, and the server and services processes call with the new.
**Open:** after a rotation on tier E, what push reaching Complete proves the new value is called with, when no unit's push there can reach Complete? `volttron-password-rotated` ends with one. volttron-sync's Open line under its platform claim, measured 2026-10-26, has the numbers. `set_temperature_setpoints` answers HTTP 500 after VUI's 5 s wait, while the agent retries BACnet writes to `device_address` `":1"`. A control's push reached Complete on the same run. `reboot.spec.ts`'s unmarked rotation test already holds the `/authenticate` half. The claim names the server process, but `server` runs `INSTANCE_TYPE=none` and carries no VOLTTRON credential (`docker/.env.server:3`).

## Dependencies

secrets, stack

## Scenarios

| Name | Proves |
|---|---|
| `env-reset-resynced` | a reset `.env` under a running stack re-syncs without rotating |
| `secrets-rotate-live` | live rotation, refusal when down, `--dry-run` |
| `pg-shadow-drift-healed` | sentinel-initialised role rotated |
| `historian-config-reconciled` | SQLHistorian config matches after rotation and deploy |
| `historian-sync-waits-600` | the SQLHistorian check, `.sh` and `.ps1`, waits 600 seconds before giving up |
| `volttron-password-rotated` | *(owed)* a changed `VOLTTRON_PASSWORD`: `/authenticate` takes the new, refuses the old; a push then reaches Complete |
