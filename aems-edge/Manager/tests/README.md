# Manager Tests

Unit tests for the Manager agent. They run without a VOLTTRON platform, but
need VOLTTRON installed (the Manager imports `volttron.platform`), as in the
environment the agent runs in.

## Running

From `aems-edge/Manager` (what CI runs) or from `aems-edge`:

```bash
poetry run pytest                                   # all tests
poetry run pytest tests/test_optimal_start.py       # one file
poetry run pytest -k "in_progress"                  # by keyword
```

CI (`.github/workflows/pytestaems-edge.yml`) installs VOLTTRON 9.0.4 into the
Poetry environment and runs `pytest` from `aems-edge/Manager`.

Keep this directory free of `__init__.py`: `Manager/setup.py` installs the agent
as `find_packages('.')[0]`, and a `tests` package could be picked instead of
`manager`.

## Test files

| File | What it tests |
|------|--------------|
| `test_optimal_start.py` | Optimal-start models (incl. RecoveryRegression), model selection, the start decision and training schedule |
| `test_config_store_handlers.py` | Config-store entries the Manager reacts to (`set_points`) |
| `test_lockout_manager.py` | Heating/cooling lockouts and the forecast-based optimal-start lockout |
| `test_manager_holiday.py` | Holiday detection and custom holiday support |
| `test_without_agent_runtime.py` | ManagerProxy built from the shipped example config without VOLTTRON running |
| `test_data_utils.py` | Data file access and data file naming |
| `test_config_loading.py` | Config store structure and validation |
| `test_override_in_progress.py` | Overrides already in progress (past start, before end) |
| `test_full_override_flow.py` | End-to-end occupancy override flows |
| `test_runtime_override.py` | Adding overrides to an already-running agent |
| `test_occupancy_config_update.py` | Config store update behavior for occupancy overrides |
| `test_scheduler_behavior.py` | Scheduler behavior with past datetime objects |
| `test_server.py` | The FastAPI server (skipped when fastapi is not installed) |

`conftest.py` provides the `manager_proxy` fixture: a ManagerProxy built from
`configurations/thermostats/schneider.config` with a fake agent and temporary
data/model directories (nothing is written to `~/.manager`).

## Integration test on a mock VOLTTRON instance

`integration/mock_platform/` runs the real Manager on an isolated VOLTTRON
instance against a simulated `platform.driver` (thermal zone model), so the
cron/schedule path is exercised end to end:

```bash
python tests/integration/mock_platform/run_scenario.py          # start (occupancy ~1 h later)
python tests/integration/mock_platform/analyze.py               # report
python tests/integration/mock_platform/run_scenario.py --stop   # shut the instance down
```
