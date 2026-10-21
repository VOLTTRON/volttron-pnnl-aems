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
- A changed `VOLTTRON_PASSWORD` reaches both ends: after `secrets.sh`, the platform's `/authenticate`
  accepts the new value and refuses the old, and the server and services processes call with the new.

**Open:** `volttron-password-rotated`'s "a push then reaches Complete" cannot be observed in tier E
on this host: the services container (bridge network) cannot reach volttron (`network_mode: host`)
on port 5410. `docker exec aems-test-services nc -zv host.docker.internal 5410` is refused; port
80 is reachable, and no unit or control on the aems-test stack has ever left `Process` (every
services push loop fails with `ECONNREFUSED 192.168.65.254:5410`). The unused
`docker/bridge/volttron-socat.sh` would bridge this, but isn't wired into compose. Reboot's
`a VOLTTRON_PASSWORD rotation flips /authenticate on the platform and refreshes the services env`
proves the auth flip and that services' env now holds the new value; this one still owes the push.
`volttron-sync`'s `push-reaches-platform` is blocked by the same wall.

## Dependencies

secrets, stack

## Scenarios

| Name | Proves |
|---|---|
| `env-reset-resynced` | a reset `.env` under a running stack re-syncs without rotating |
| `secrets-rotate-live` | live rotation, refusal when down, `--dry-run` |
| `pg-shadow-drift-healed` | sentinel-initialised role rotated |
| `historian-config-reconciled` | SQLHistorian config matches after rotation and deploy |
| `volttron-password-rotated` | *(owed)* a changed `VOLTTRON_PASSWORD`: `/authenticate` takes the new, refuses the old; a push then reaches Complete |
