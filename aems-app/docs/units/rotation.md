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
  accepts the new value and refuses the old, and the services process calls with the new: a control's
  push reaches Complete.
**Open:** after `secrets.sh`, setup-platform answers `/authenticate` with the new value about a second before it shuts the platform down to start it for real (container log 10:15:25 local, `SHUTTING DOWN FROM SETUP-PLATFORM.PY`). On tier E on 2026-10-27, twice, a control marked in that second logged in, met `ECONNREFUSED 192.168.65.254:5410` on `update_configurations` after three tries (1 s, 2 s), and went to Fail with `fetch failed` (`control.service.ts:147-155`). Does a push that logs in and then meets a refused connection leave the row marked, as volttron-sync's refused-connection claim reads, or move it to Fail, as its failed-call claim reads for a unit? 04f74bec ruled only on a refusal at the login. A mark made after the container logs `Setup of Volttron platform is complete.` reached Complete (`reboot.spec.ts`, unmarked, 8.9 min).

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
| `volttron-password-rotated` | *(owed)* a changed `VOLTTRON_PASSWORD`: `/authenticate` takes the new, refuses the old; a control's push then reaches Complete |
