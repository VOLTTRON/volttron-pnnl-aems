"""
Analyze an optimal-start scenario run (see run_scenario.py).

For each RTU: what the Manager predicted and which models decided, when it
switched the unit to occupied, how long the simulated zone actually took to
reach within 0.5 °F of the occupied cooling setpoint, whether it was ready by
occupancy, and (after training) what was learned and persisted.

Usage: python analyze.py [--root /tmp/aems_mock]
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "mock_driver"))
from mock_driver import thermal  # noqa: E402

TARGET = 0.5


def load_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in open(path)] if path.exists() else []


def ts(value: str) -> datetime:
    return datetime.fromisoformat(value).astimezone().replace(tzinfo=None)


def config_get(root: Path, identity: str, name: str):
    env = dict(os.environ, VOLTTRON_HOME=str(root / "vhome"), HOME=str(root / "home"))
    vctl = Path(os.environ.get("VOLTTRON_ENV", "/home/volttron/volttron/env")) / "bin" / "vctl"
    p = subprocess.run([str(vctl), "config", "get", identity, name], env=env, capture_output=True, text=True)
    try:
        return json.loads(p.stdout)
    except json.JSONDecodeError:
        return None


def main(root: Path) -> int:
    scen = json.loads((root / "scenario.json").read_text())
    occupancy = datetime.fromisoformat(scen["occupancy"])
    events = load_jsonl(root / "out" / "events.jsonl")
    records = load_jsonl(root / "out" / "records.jsonl")
    now = datetime.now()
    print(f"scenario started {scen['started'][11:16]}, occupancy {occupancy:%H:%M}, earliest_start_time "
          f"{scen['earliest_start_time']} min, now {now:%H:%M}\n")
    failures = 0
    for unit, info in scen["rtus"].items():
        ident = info["identity"]
        state = load_jsonl(root / "out" / f"state_{unit}.jsonl")
        for s in state:
            s["t"] = ts(s["ts"])
        occ_cmds = [e for e in events if e.get("event") == "set_point" and e["unit"] == unit
                    and e["point"] == "OccupancyCommand"]
        on = next((e for e in occ_cmds if e["value"] == 2), None)
        n_occ_writes = sum(1 for e in occ_cmds if e["value"] == 2)
        ost = [r for r in records if r["topic"].endswith(f"/{unit}/OptimalStartTimes")]
        model_recs = [r for r in records if f"/{unit}/OptimalStartModel/" in r["topic"]]
        print(f"=== {unit}  (models={info['models']}, seeded observations={len(info['seed'])}) ===")
        switch_t = ts(on["ts"]) if on else None
        governing = [r for r in ost if switch_t is None or ts(r["ts"]) <= switch_t + timedelta(seconds=61)] or ost
        if ost:
            print(f"  OptimalStartTimes published {len(ost)}x (commits); decision in force at the switch:")
            msg = governing[-1]["message"]
            preds = {k: round(v, 1) for k, v in msg.items() if isinstance(v, (int, float))}
            print(f"    {ts(governing[-1]['ts']):%H:%M:%S}: {preds}")
            print(f"  decided_by: {msg.get('decided_by')}")
        else:
            print("  no OptimalStartTimes published yet")
        if not on:
            print("  unit not switched to occupied yet\n")
            continue
        start = ts(on["ts"])
        lead = (occupancy - start).total_seconds() / 60
        before = [s for s in state if s["t"] <= start]
        z0, oat0, csp = before[-1]["ZoneTemperature"], before[-1]["OutdoorAirTemperature"], before[-1]["OccupiedCoolingSetPoint"]
        hit = next((s for s in state if s["t"] >= start and s["ZoneTemperature"] <= s["OccupiedCoolingSetPoint"] + TARGET), None)
        actual = (hit["t"] - start).total_seconds() / 60 if hit else None
        physics = thermal.recovery_minutes(z0, oat0, thermal.ZoneParams(**info["params"]), cooling_sp=csp,
                                           heating_sp=before[-1]["OccupiedHeatingSetPoint"])
        at_occ = [s for s in state if s["t"] <= occupancy]
        print(f"  OccupancyCommand=occupied written {n_occ_writes}x")
        print(f"  switched OCCUPIED at {start:%H:%M:%S} = {lead:.1f} min before occupancy "
              f"(zone {z0} F, cooling SP {csp} F, OAT {oat0} F)")
        if actual is None:
            print(f"  zone has not reached within {TARGET} F of SP yet (physics expects {physics:.1f} min)")
        else:
            print(f"  zone reached within {TARGET} F of SP after {actual:.0f} min at {hit['t']:%H:%M} "
                  f"(physics: {physics:.1f} min) -> ready {(lead - actual):+.0f} min vs occupancy")
        if now >= occupancy and at_occ:
            z_occ = at_occ[-1]["ZoneTemperature"]
            ok = z_occ <= csp + TARGET + 0.1
            print(f"  at occupancy {occupancy:%H:%M}: zone {z_occ} F ({z_occ - csp:+.1f} F vs SP) -> {'READY' if ok else 'NOT READY'}")
        # expectations per scenario role
        decided = governing[-1]["message"].get("decided_by") if ost else None
        if unit == "rtu02":
            expect = decided == [] and abs(lead - scen["earliest_start_time"]) <= 1.5
            print(f"  expectation (no model trained -> earliest start {scen['earliest_start_time']} min): {'PASS' if expect else 'FAIL'}")
        else:
            expect = decided == ["rr"] and abs(lead - physics) <= 5
            print(f"  expectation (recovery_regression decides; lead within 5 min of physics at switch time): "
                  f"{'PASS' if expect else 'FAIL'} (lead {lead:.1f} vs physics {physics:.1f} min)")
        failures += 0 if expect else 1
        if model_recs:
            for r in model_recs:
                tag = r["topic"].rsplit("/", 1)[-1]
                m = {k: (round(v, 3) if isinstance(v, float) else v) for k, v in r["message"].items()
                     if k not in ("c1_array", "h1_array", "c2_array", "h2_array", "alpha_array")}
                print(f"  training record [{tag}] {ts(r['ts']):%H:%M}: {m}")
            stored = config_get(root, ident, "optimal_start.models.rr")
            n = len((stored or {}).get("observations_cooling", []))
            print(f"  config store optimal_start.models.rr: {n} cooling observations "
                  f"({len(info['seed'])} seeded + this morning)")
            files = sorted(p.name for p in (root / "home" / ".manager" / "models").glob(f"{unit}_*.json"))
            print(f"  model files: {files}")
        elif now > occupancy + timedelta(minutes=95):
            print("  training expected by now but no OptimalStartModel record seen")
        print()
    print("summary:", "all expectations met" if failures == 0 else f"{failures} expectation(s) not met")
    return failures


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="/tmp/aems_mock")
    sys.exit(main(Path(ap.parse_args().root)) and 1)
