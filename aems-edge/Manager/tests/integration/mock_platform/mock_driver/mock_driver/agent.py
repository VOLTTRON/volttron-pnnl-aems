"""
Mock platform driver for AEMS integration tests.

Runs as ``platform.driver`` on a test VOLTTRON instance and stands in for real
RTUs:

* serves the ``get_point`` / ``set_point`` RPCs the Manager uses
  (``set_point(path, point, value, on_property=...)``, ``get_point(path, point)``);
* every ``publish_interval`` seconds advances each zone's thermal simulation
  (:mod:`mock_driver.thermal`) in real time and publishes
  ``devices/<campus>/<building>/<unit>/all`` like the real driver;
* logs every set command, the zone state each publish, and every message the
  Manager publishes under ``record/`` to ``output_dir`` for later analysis.
"""
from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone

from volttron.platform.agent import utils
from volttron.platform.messaging import headers as headers_mod
from volttron.platform.vip.agent import Agent, Core, RPC

from . import thermal

utils.setup_logging()
_log = logging.getLogger(__name__)
__version__ = "0.1.0"

# Manager point name -> ZoneState attribute
_POINT_ATTR = {
    "ZoneTemperature": "zone_temperature",
    "OccupancyCommand": "occupancy",
    "OccupiedCoolingSetPoint": "occupied_cooling_sp",
    "OccupiedHeatingSetPoint": "occupied_heating_sp",
    "UnoccupiedCoolingSetPoint": "unoccupied_cooling_sp",
    "UnoccupiedHeatingSetPoint": "unoccupied_heating_sp",
    "OccupiedSetPoint": "occupied_sp",
    "DeadBand": "deadband",
    "FirstStageCooling": "cooling",
    "FirstStageHeating": "heating",
    "SupplyFanStatus": "fan",
}
_READ_ONLY = {"ZoneTemperature", "FirstStageCooling", "FirstStageHeating", "SupplyFanStatus", "OutdoorAirTemperature"}


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class MockDriver(Agent):
    """Simulated RTUs behind the platform-driver RPC and publish interface."""

    def __init__(self, config_path, **kwargs):
        super().__init__(**kwargs)
        cfg = utils.load_config(config_path)
        self.campus = cfg.get("campus", "mock")
        self.building = cfg.get("building", "site")
        self.interval = float(cfg.get("publish_interval", 60))
        self.substep_min = float(cfg.get("substep_seconds", 10)) / 60.0
        self.oat_low, self.oat_high = cfg.get("oat_range", [74.0, 90.0])
        self.output_dir = cfg.get("output_dir", "/tmp/aems_mock/out")
        os.makedirs(self.output_dir, exist_ok=True)
        self.devices: dict[str, tuple[thermal.ZoneState, thermal.ZoneParams]] = {}
        for unit, dev in cfg["devices"].items():
            params = thermal.ZoneParams(**dev.get("params", {}))
            state = thermal.ZoneState(**dev.get("initial", {}))
            self.devices[unit] = (state, params)
        self._last = None

    # -- helpers -------------------------------------------------------------

    def _unit(self, path: str) -> str:
        unit = str(path).strip("/").split("/")[-1]
        if unit not in self.devices:
            raise ValueError(f"unknown device path {path!r}")
        return unit

    def _oat(self) -> float:
        local = datetime.now()
        return thermal.outdoor_air(local.hour * 60 + local.minute + local.second / 60, self.oat_low, self.oat_high)

    def _points(self, unit: str) -> dict:
        state, params = self.devices[unit]
        values = {name: getattr(state, attr) for name, attr in _POINT_ATTR.items()}
        values["ZoneTemperature"] = round(thermal.reading(state, params), 2)
        values["OutdoorAirTemperature"] = round(self._oat(), 2)
        values.update(state.extra)
        return values

    def _log_line(self, name: str, record: dict) -> None:
        with open(os.path.join(self.output_dir, name), "a") as fp:
            fp.write(json.dumps(record, default=str) + "\n")

    # -- lifecycle -------------------------------------------------------------

    @Core.receiver("onstart")
    def onstart(self, sender, **kwargs):
        self._last = _now_utc()
        self._log_line("events.jsonl", {"ts": self._last.isoformat(), "event": "mock_driver_start",
                                        "devices": list(self.devices)})
        self.vip.pubsub.subscribe("pubsub", "record/", self._on_record)
        self.core.periodic(self.interval, self._tick, wait=0)

    def _tick(self):
        now = _now_utc()
        elapsed = (now - self._last).total_seconds() / 60.0 if self._last else 0.0
        self._last = now
        oat = self._oat()
        for unit, (state, params) in self.devices.items():
            t = 0.0
            while t < elapsed - 1e-9:
                dt = min(self.substep_min, elapsed - t)
                thermal.step(state, params, oat, dt)
                t += dt
            values = self._points(unit)
            meta = {k: {"type": "float", "tz": "UTC", "units": ""} for k in values}
            headers = {headers_mod.TIMESTAMP: now.isoformat(), headers_mod.DATE: now.isoformat()}
            topic = f"devices/{self.campus}/{self.building}/{unit}/all"
            self.vip.pubsub.publish("pubsub", topic, headers=headers, message=[values, meta])
            self._log_line(f"state_{unit}.jsonl", {"ts": now.isoformat(), **values,
                                                   "true_zone_temperature": round(state.zone_temperature, 3)})

    def _on_record(self, peer, sender, bus, topic, headers, message):
        self._log_line("records.jsonl", {"ts": _now_utc().isoformat(), "sender": sender, "topic": topic,
                                         "message": message})

    # -- driver RPC interface ------------------------------------------------

    @RPC.export
    def get_point(self, path, point_name, **kwargs):
        unit = self._unit(path)
        value = self._points(unit).get(point_name)
        self._log_line("events.jsonl", {"ts": _now_utc().isoformat(), "event": "get_point", "unit": unit,
                                        "point": point_name, "value": value})
        return value

    @RPC.export
    def set_point(self, path, point_name, value, *args, **kwargs):
        unit = self._unit(path)
        state, _ = self.devices[unit]
        if point_name in _READ_ONLY:
            raise ValueError(f"{point_name} is read-only")
        attr = _POINT_ATTR.get(point_name)
        if value is None:          # release / revert: keep the current value
            result = getattr(state, attr) if attr else state.extra.get(point_name)
        elif attr:
            setattr(state, attr, type(getattr(state, attr))(value))
            result = getattr(state, attr)
        else:
            state.extra[point_name] = value
            result = value
        self._log_line("events.jsonl", {"ts": _now_utc().isoformat(), "event": "set_point", "unit": unit,
                                        "point": point_name, "value": value, "kwargs": kwargs,
                                        "zone_temperature": round(state.zone_temperature, 3)})
        return result

    @RPC.export
    def revert_point(self, path, point_name, **kwargs):
        return self.get_point(path, point_name)

    @RPC.export
    def revert_device(self, path, **kwargs):
        return True


def main(argv=sys.argv):
    utils.vip_main(MockDriver, identity="platform.driver", version=__version__)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        pass
