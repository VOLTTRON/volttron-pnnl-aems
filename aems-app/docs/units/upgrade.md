# upgrade

**State:** built

## Contract

Bringing an existing deployment to the current release with `git pull` and `start-services`, with no
hand edits, whatever state its historian logins and VOLTTRON configuration were left in. It guarantees
the operator that a release repairs what earlier releases left broken. What each credential is belongs
to secrets, and what the app sends VOLTTRON belongs to volttron-sync and controls-ilc.

## Claims

- After `start-services`, every historian role a service logs in as accepts the password `.env`
  holds. A role that does not is reset to that value, whatever it was before.
- `volttron-setup` re-renders whenever any input it renders from changes: every `VOLTTRON_*` and
  `HISTORIAN_DB_*` value, `generate_configs.py`, which holds the config templates, and the contents
  of the registry file `VOLTTRON_REGISTRY_FILE_PATH` names. The thermostat configs and `site.json` are
  what it renders, never inputs. The ILC templates are copied afresh on every run.
- After `start-services`, VOLTTRON's config store and each agent's install-time config match the
  rendered configs for every agent. The app then re-pushes what it owns, so its values win there.
- The startup re-push marks every control as well as every unit.
- `start-services` ends by reporting each historian login and each VOLTTRON agent's health.
- A deployment in both broken states at once comes up working after one `start-services`. The broken
  states are a historian role on a stale password, and a VOLTTRON store holding configs older than
  the rendered ones.

## Dependencies

secrets, stack

## Scenarios

| Name | Proves |
|---|---|
| `historian-logins-verified` | a role on a stale non-sentinel password is reset and logs in |
| `volttron-setup-rerenders` | a changed `VOLTTRON_*` value, `generate_configs.py` or registry file re-renders; unchanged inputs do not |
| `volttron-store-reconciled` | a stale store entry is replaced; app-owned entries end with the app's values |
| `startup-repushes-controls` | the startup re-push marks every unit and control |
| `deploy-report` | the report names each historian login and agent, healthy or not |
| `upgrade-from-broken-fixture` | both broken states repaired by one `start-services` |
