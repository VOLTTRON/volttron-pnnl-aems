# historian-dashboards

**State:** built

## Contract

What the edge records about each unit, its building's weather and its building's power meter, read
from the historian database. Also the app's own dashboards, which chart that data. Who may open a
Grafana dashboard belongs to grafana-access. The historian's credentials and replication belong to
secrets and stack.

## Claims

- A topic is `{campus}/{building}/{system}/{metric}`, matched case-insensitively. An entry in
  `docker/historian/historian-topic-map.json` overrides it.
- A user reads the historian only for the units assigned to them. They read weather and meter data
  only for a building where they have a unit. An admin reads every unit and every building. A refused
  read returns no data and an "Access denied" error, never another building's rows.
- A range up to `HISTORIAN_BINNING_START` (48 hours by default) returns raw rows. A longer range is
  grouped into about 500 buckets. A requested interval is honoured as given, both number and unit,
  but never yields more than 5,000 buckets; a finer interval is coarsened to fit.
- Historian timestamps are read as UTC, whatever the server process's timezone.
- When the historian is down, a query answers a GraphQL error. An empty or missing topic yields no
  data, not an error.
- `historianReplicationInfo` is admin-only.

## Dependencies

site-model, stack

## Scenarios

| Name | Proves |
|---|---|
| `topic-path-and-map` | the default path, case-insensitive, and a map entry overriding it |
| `historian-access-by-assignment` | own units and own buildings' weather and meter only; admin sees all |
| `binning-and-interval-cap` | raw under the threshold, ~500 buckets over; interval honoured, capped |
| `historian-reads-utc` | identical results under two server timezones |
| `historian-down-or-empty` | down gives an error; empty or missing topic gives no data |
| `replication-info-admin-only` | a user is refused, an admin is answered |
