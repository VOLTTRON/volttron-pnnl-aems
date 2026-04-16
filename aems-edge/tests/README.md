# AEMS-Edge Tests

## Running pytest tests

From the `aems-edge` directory:

```bash
poetry run pytest                          # all tests
poetry run pytest tests/                   # just this directory
poetry run pytest tests/test_override_in_progress.py  # single file
poetry run pytest -k "in_progress"         # by keyword
```

## Test files

### Unit tests (run with pytest, no platform needed)

| File | What it tests |
|------|--------------|
| `test_lockout_manager.py` | Temperature-based heating/cooling lockout logic |
| `test_manager_holiday.py` | Holiday detection and custom holiday support |
| `test_without_agent_runtime.py` | Basic ManagerProxy instantiation without VOLTTRON |
| `test_data_utils.py` | Data conversion utilities |
| `test_config_loading.py` | Config store structure and validation |
| `test_override_in_progress.py` | Overrides already in progress (past start, before end) |
| `test_full_override_flow.py` | End-to-end occupancy override flows |
| `test_runtime_override.py` | Adding overrides to an already-running agent |
| `test_occupancy_config_update.py` | Config store update behavior for occupancy overrides |
| `test_scheduler_behavior.py` | Scheduler behavior with past datetime objects |

### Integration test tools (require a running platform)

| File | What it does |
|------|-------------|
| `test_platform_driver.py` | CLI tool for platform.driver RPC (get/set point, subscribe, publish) |
| `test_rpc_agent.py` | Simple agent demonstrating RPC calls to platform.driver |

Run the CLI tools directly:

```bash
python tests/test_platform_driver.py --action get_devices
python tests/test_platform_driver.py --action get_point --device campus/building/rtu1 --point OutdoorAirTemperature
python tests/test_rpc_agent.py --host localhost --port 8000
```

## Startup scripts

Shell scripts for launching agents are in `aems-edge/scripts/`:

```bash
./scripts/start-manager    # Start Manager agent + platform driver
./scripts/start-vdriver    # Start platform driver standalone
```

Both scripts accept environment variables for configuration — see the script headers for details.
