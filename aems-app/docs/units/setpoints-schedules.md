# setpoints-schedules

**State:** built

## Contract

What a unit should be doing and when: its configuration's setpoint, weekday and holiday schedules,
holidays and dated occupancy overrides. This unit owns their rules and the form each takes for
VOLTTRON. Carrying that form to the edge, and handling failure, belongs to volttron-sync.

Implemented today in `server/src/graphql/{setpoint,schedule,occupancy,holiday,configuration}/`, `server/src/services/config/config.occupancy.ts`, `server/src/services/cleanup/`, `common/src/constants/{validate,holiday,observance}.ts` and `client/src/app/{setpoints,schedules,occupancies,holidays}/`.

## Claims

- Temperatures are °F. setpoint, overrideSetpoint, heating and cooling lie in 55–85. deadband lies in
  2–6 and overrideDeadband in 2–10. standbyTime lies in 5–60 minutes and standbyOffset in 0–5. Also
  heating + 2 + deadband/2 ≤ setpoint ≤ cooling − 2 − deadband/2.
- These rules are one function in `common`, which `client/src/utils/setpoint.ts` calls rather than
  restates. The server runs it on the row as every setpoint write would leave it, nested writes in a
  schedule or configuration included, and refuses one it fails. Both deadbands are sent halved.
  **Open:** the validator (`getSetpointMessage`, `isSetpointValid`) and the `HH:mm` parser (`parseTimeToMinutes`) live in `client/src/utils/{setpoint,schedule}.ts`, not `common/src` (`common` has no such function; the client restates ranges from `Validate.*.options`). `server/src/graphql/{setpoint,schedule}/mutate.service.ts` write unchecked — no range or format guard on `createSetpoint`/`updateSetpoint`/`createSchedule`/`updateSchedule` or nested writes. Does the function move to `common` and the server start refusing, or does the server-refuses half of these two claims drop? (Blocks `schedule-time-refused` under the same answer.)
- A schedule time is `HH:mm` from 00:00 to 24:00, read by one parser in `common` the client also uses.
  The server refuses any schedule write, nested ones included, giving another start, end or window
  time. An end time of 00:00 means midnight at the day's end, and no other end time moves.
- A schedule that is not occupied is sent as `always_off`. An occupied schedule whose start and end
  are each 00:00 or 24:00 is sent as `always_on`. An end time of 24:00 is sent as 23:59.
- The pre- and post-occupancy service windows are sent only while `SERVICE_CONFIG_SERVICE_OVERRIDE`
  is on. An empty window is sent as `always_off` and 00:00–24:00 as `always_on`. `override` is only
  the editor's switch, and is never sent.
- An occupancy overrides one date with its own schedule. Only occupancies dated today or later are
  sent, and those sharing a date go together. "Today" is in the unit's timezone, or in
  `VOLTTRON_TIMEZONE` when the unit has none.
- Each night, cleanup deletes the occupancies dated before today.
- A new unit has the thirteen holidays in `common/src/constants/holiday.ts`. Every one is enabled
  except Martin Luther King Jr. Day, Presidents' Day, Columbus Day and Veterans Day. A disabled
  holiday is not sent. An enabled one is sent by its label. A custom one is sent with its month, day
  and observance, and VOLTTRON computes the dates.
- A custom holiday's observance is sent as its name (`nearest_workday`), whether it is stored as the
  name or the label. The holiday schedule is sent only while `SERVICE_CONFIG_HOLIDAY_SCHEDULE` is on.
- Saving a configuration, or any setpoint, schedule, occupancy or holiday in one, marks every unit
  using that configuration for a push. A change to `stage`, `message` or `correlation` alone marks
  none.

## Dependencies

site-model

## Scenarios

| Name | Proves |
|---|---|
| `setpoint-rules-refused` | each limit and spacing break refused, by a partial update and a nested write too; deadbands sent halved |
| `schedule-time-refused` | a malformed or out-of-range start, end or window time refused, nested too; 00:00 alone becomes the day's end |
| `schedule-range-forms` | always_off, always_on and 24:00 → 23:59 |
| `service-windows-gated` | windows sent only under the flag; empty and full-day forms; `override` never sent |
| `occupancies-from-today` | past dates dropped by the unit's timezone; one date's occupancies together |
| `occupancy-cleanup-deletes-past` | the nightly run deletes past occupancies and keeps today's |
| `holiday-defaults-and-forms` | new-unit defaults; disabled omitted, enabled by label, custom with its fields |
| `observance-sent-as-name` | a label-stored observance is sent as its name; holiday schedule only under the flag |
| `edit-marks-every-unit` | any edit marks every unit on the configuration; metadata alone marks none |
