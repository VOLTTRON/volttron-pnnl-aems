# site-model

**State:** unbuilt
**Contract:** partial — locations, a unit's tunable settings and configurations are still to be derived with the owner.

## Contract

What every AEMS control acts on. A **site** is a whole campus, such as a college or a hospital, and the
code calls it `campus`. A **building** is one building within it, and may be the site's only one. A
**unit** is one thermostat and the heating and cooling equipment it drives, and its `system` is that
thermostat's own ID. Elsewhere the code says "site" for a building — Grafana's `grafana-view-site-*`
roles and VOLTTRON's `site.json` — and those names stay as they are.

VOLTTRON's configuration files decide which units and controls exist; this unit holds them in the
database. One building is supported today, and nothing here assumes only one.

Implemented today in `server/src/services/setup/`, `server/src/graphql/{unit,configuration,location,config}/` and `client/src/app/{units,configurations,locations,templates}/`.

## Claims

- Setup makes one unit for each thermostat `.config` file under `SERVICE_SETUP_THERMOSTAT_PATHS`. The
  file's `campus`, `building` and `system` identify the unit and name it `campus-building-system`. The
  unit starts with default setpoints and schedules, and takes the file's `local_tz` as its timezone.
  **Open:** is the name `campus-building-system` verbatim? `server/src/services/setup/setup.service.ts:53,335` names it from `upperFirst(snakeCase(...))` of each part, so `PNNL`/`B1`/`Ahu1` gives `Pnnl-B_1-Ahu_1`, and existing units are found by that name: a different name would make setup delete each existing unit and create it anew.
- Setup never changes a unit that already exists. The file gives the unit its identity; the timezone
  and every other setting belong to the app once the unit is made.
- A unit whose file is gone is deleted on the next run, except demo units (`SYNTHETIC_CAMPUS_PREFIX`).
- Each ILC file under `SERVICE_SETUP_ILC_PATHS` makes one control for its campus and building. That
  control is assigned exactly the units its `systems` name, and a unit the file stops naming is
  unassigned. A control whose file is gone is deleted.
- Setup deletes a unit or control only after a complete, error-free scan that found at least one
  thermostat file. An empty scan, or any failed read, parse or lookup, deletes nothing and logs why.
- Units and controls of different campuses and buildings coexist: nothing in setup or the model
  assumes a single campus or building.

## Dependencies

graphql, background

## Scenarios

| Name | Proves |
|---|---|
| `unit-per-thermostat-file` | a file makes one named unit with defaults and its timezone |
| `existing-unit-untouched` | a changed file leaves its existing unit as it was |
| `removed-file-deletes-unit` | a gone file deletes its unit; a demo unit stays |
| `control-per-ilc-file` | one control per file, assigned exactly the named units; a gone file deletes it |
| `bad-scan-deletes-nothing` | an empty scan, or a failed read, parse or lookup, deletes no unit or control |
| `many-buildings-coexist` | two campuses' and buildings' files give separate units and controls |
