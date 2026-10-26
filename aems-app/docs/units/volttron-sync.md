# volttron-sync

**State:** built

## Contract

Carrying each unit's configuration to the VOLTTRON edge platform, and the stages a push moves a unit
or control through. What a unit's configuration says, and the form it takes, belong to
setpoints-schedules; the ILC configuration a control sends, to controls-ilc; how a call reaches
VOLTTRON, to volttron-client; recording who changed what, to change-log.

## Claims

- The server reads ILC templates from the volttron-setup image every 10 seconds, and on demand for
  the Admin → Templates preview, so an edited template appears after re-running `start-services`.
- Every 10 seconds the services process pushes each unit marked Update or Process. The unit moves to
  Process, then the server calls `manager.<system>` with `set_temperature_setpoints`,
  `set_occupancy_override`, `set_holidays`, `set_schedule`, `set_service_schedule`,
  `set_optimal_start`, `set_configurations` and `set_location`, in that order. The unit then moves to
  Complete.
- Against the platform the `volttron` profile deploys, through whichever API it serves, a pushed unit
  reaches Complete and its `manager.<system>` agent's configuration store then holds what was sent;
  a pushed control reaches Complete through `agent.ilc`.
**Open:** on tier E's platform a unit's push cannot reach Complete. What answers the RTU writes a `manager.<system>` makes inside `set_temperature_setpoints`? Measured 2026-10-26 on aems-test, unmocked, through VUI. Every `set_temperature_setpoints`, rtu01–05, answered HTTP 500 after 5.00 s, because VUI's `_rpc` waits `.get(timeout=5)` (`volttron/platform/web/vui_endpoints.py:1008` in the image). Every unit went to Fail. Meanwhile the agent's `rpc_set_point` (`aems-edge/Manager/manager/main_manager.py:408-416`) tries each write 4 times, waiting 10 s for each and sleeping 30±5 s between them. Every write failed `BACnet Proxy WRITE_PROPERTY failed: ValueError('unrecognized format')`, which comes from bacpypes3's address parser. The rendered rtu01–05 `device_address` is `":1"`–`":5"`: `aems-edge/configurations/docker/config.ini:10` sets `bacnet-address =`, which reaches `generate_configs.py:1085` as `""` rather than None, so `--gateway-address 172.31.32.1` is never used. No device listens on tier E's host at any address. After VUI gave up, the agent still stored what was sent (`set_points` held `OccupiedSetPoint` 71, the row's value). Control `Pnnl-Rob` reached Complete. No archive record decides it. 510a34ab added a `sim-rtu` service "for dev/testing", and it is no longer in `docker-compose.yml`.
- Any failed call on a unit's push moves the unit to Fail instead, with the error as its message, cut
  to 1024 characters. A failed `set_service_schedule` is the exception: it is logged and the push
  carries on.
- A platform that refuses the connection or the login moves nothing to Fail: every unit and control
  marked for a push stays marked, with the error as its message, and is pushed once the platform answers.
- A unit or control in Fail stays there until someone edits it or pushes it again. Nothing retries it.
- An edit saved while its unit or control is being pushed is pushed afterward. A push marks Complete
  only the state it sent, and leaves anything edited during it marked for another push.
- With `SERVICE_CONFIG_STARTUP` on, every unit and every control is marked for a push when the
  services process starts.

## Dependencies

site-model, background, volttron-client

## Scenarios

| Name | Proves |
|---|---|
| `ilc-templates-reread` | templates re-read on the cron and on preview |
| `unit-push-sequence` | Process, the eight calls in order, then Complete |
| `push-reaches-platform` | *(owed)* on the deployed `volttron` container, unmocked: a unit pushed to Complete, its agent's store holding the values sent; a control pushed to Complete |
| `unit-push-fail-message` | a failed call gives Fail with the cut message; service schedule alone does not |
| `unreachable-platform-waits` | connection or login refused: no unit or control moves to Fail, each marked one stays marked with the error as its message, then reaches Complete once the login succeeds |
| `fail-not-retried` | a Fail unit or control is not pushed again without an edit or push |
| `edit-during-push-repushed` | an edit saved mid-push is pushed after; the push does not mark it Complete |
| `startup-repush` | the startup flag marks every unit |
| `startup-repushes-controls` | the startup re-push marks every unit and control |
