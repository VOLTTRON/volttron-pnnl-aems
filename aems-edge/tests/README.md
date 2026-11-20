# AEMS-Edge Test Tools

The Manager's unit tests are in [`Manager/tests`](../Manager/tests/README.md).
This directory holds tools for testing against a live platform.

## Integration test tools (require a running platform)

| File | What it does |
|------|-------------|
| `test_platform_driver.py` | CLI tool for platform.driver RPC (get/set point, subscribe, publish) |
| `test_rpc_agent.py` | Simple agent demonstrating RPC calls to platform.driver |
| `gs-payload.py` | Sends example payloads (schedule, setpoints, ...) to a Manager |

They need the AEMS client library and are run directly, not by pytest
(`conftest.py` keeps pytest from collecting them):

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
