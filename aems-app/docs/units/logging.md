# logging

**State:** built

## Contract

Application logs, written where operators can read them from the app. It guarantees a log line reaches
the console and the database. It does not decide what is logged.

## Claims

- A log entry is written to the console and to the database log table.
- The log table is pruned by the process whose `INSTANCE_TYPE` includes `log`.

## Dependencies

background

## Scenarios

| Name | Proves |
|---|---|
| `log-to-console-and-table` | both sinks |
| `log-pruned-by-worker` | pruning |
