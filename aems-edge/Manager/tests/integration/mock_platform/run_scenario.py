"""
End-to-end optimal-start test on an isolated VOLTTRON instance.

Starts a fresh VOLTTRON platform (its own VOLTTRON_HOME and HOME under
``--root``), installs the mock platform driver and one Manager agent per RTU
from the current working tree, seeds model state where the scenario asks for
it, and starts everything. The morning runs in real time: occupancy starts
``--lead`` minutes after launch.

Scenario (default):
  rtu01  RecoveryRegression seeded from the mock's own physics -> it decides
  rtu02  nothing trained -> no-model fallback (earliest start), first training
  rtu03  seeded, but optimal_start.models = ["carrier", "johnson"] (untrained)
         via the config store -> falls back to the trained models

Usage:  python run_scenario.py [--root /tmp/aems_mock] [--lead 58] [--earliest 45]
Stop :  python run_scenario.py --stop [--root ...]
Then :  python analyze.py [--root ...]
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_MANAGER = HERE.parents[2]                       # aems-edge/Manager (this file: Manager/tests/integration/mock_platform)
VOLTTRON_BIN = Path(os.environ.get("VOLTTRON_ENV", "/home/volttron/volttron/env")) / "bin"
sys.path.insert(0, str(HERE / "mock_driver"))
from mock_driver import thermal  # noqa: E402

CAMPUS, BUILDING = "mock", "site"
SETPOINTS = {"UnoccupiedHeatingSetPoint": 65, "UnoccupiedCoolingSetPoint": 77, "DeadBand": 3, "OccupiedSetPoint": 71}
# Detached setpoint control: the Manager writes OccupiedSetPoint +- DeadBand (74 / 68 F)
OCC_CSP = SETPOINTS["OccupiedSetPoint"] + SETPOINTS["DeadBand"]
OCC_HSP = SETPOINTS["OccupiedSetPoint"] - SETPOINTS["DeadBand"]
RTUS = {
    "rtu01": {"seed": True, "models": None, "initial": {"zone_temperature": 77.2}, "params": {}},
    "rtu02": {"seed": False, "models": None, "initial": {"zone_temperature": 77.0}, "params": {"cooling_rate": 0.10}},
    "rtu03": {"seed": True, "models": ["carrier", "johnson"], "initial": {"zone_temperature": 76.8},
              "params": {"cooling_rate": 0.14}},
}


def env_for(root: Path) -> dict:
    env = dict(os.environ)
    env.update(VOLTTRON_HOME=str(root / "vhome"), HOME=str(root / "home"),
               PATH=f"{VOLTTRON_BIN}:{env.get('PATH', '')}")
    return env


def run(cmd, env, check=True, quiet=False):
    p = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if not quiet:
        print("$", " ".join(map(str, cmd)), "->", p.returncode, (p.stdout + p.stderr).strip()[-300:])
    if check and p.returncode:
        raise SystemExit(f"command failed: {cmd}")
    return p


def seed_observations(params: thermal.ZoneParams) -> list:
    """RecoveryRegression observations generated from the mock's own physics (8 mornings)."""
    obs = []
    for gap, oat in [(2.9, 78), (3.5, 80), (3.1, 84), (3.8, 86), (3.3, 82), (3.6, 88), (3.0, 86), (3.9, 83)]:
        start_temp = OCC_CSP + gap
        minutes = thermal.recovery_minutes(start_temp, oat, params, cooling_sp=OCC_CSP, heating_sp=OCC_HSP)
        obs.append(["seed", round(start_temp - OCC_CSP, 2), round(oat - OCC_CSP, 2), minutes])
    return obs


def build_copy(src: Path, dest: Path, include: list[str]) -> Path:
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    for name in include:
        s = src / name
        (shutil.copytree if s.is_dir() else shutil.copy2)(s, dest / name)
    return dest


def start(args):
    root = Path(args.root)
    if root.exists():
        run([VOLTTRON_BIN / "vctl", "shutdown", "--platform"], env_for(root), check=False, quiet=True)
        time.sleep(3)
        shutil.rmtree(root)
    for sub in ("vhome", "home", "build", "cfg", "out"):
        (root / sub).mkdir(parents=True)
    env = env_for(root)

    # Platform
    log = open(root / "volttron.log", "w")
    subprocess.Popen([str(VOLTTRON_BIN / "volttron"), "-vv"], env=env, stdout=log, stderr=subprocess.STDOUT,
                     start_new_session=True)
    for _ in range(60):
        if run([VOLTTRON_BIN / "vctl", "status"], env, check=False, quiet=True).returncode == 0:
            break
        time.sleep(2)
    else:
        raise SystemExit("platform did not start - see volttron.log")
    print("platform up:", root / "vhome")

    # Times
    now = datetime.now().replace(second=0, microsecond=0)
    occupancy = now + timedelta(minutes=args.lead)
    occupancy -= timedelta(minutes=occupancy.minute % 5)
    end = occupancy + timedelta(hours=5)
    day = now.strftime("%A")
    schedule = {d: "always_off" for d in ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")}
    schedule[day] = {"start": occupancy.strftime("%H:%M"), "end": end.strftime("%H:%M")}
    optimal_start = {"earliest_start_time": args.earliest, "latest_start_time": 5,
                     "allowable_setpoint_deviation": 1, "optimal_start_lockout_temperature": 30}

    # Mock driver
    drv_cfg = {"campus": CAMPUS, "building": BUILDING, "publish_interval": 60, "output_dir": str(root / "out"),
               "oat_range": [74.0, 90.0],
               "devices": {u: {"initial": {**r["initial"], "unoccupied_cooling_sp": SETPOINTS["UnoccupiedCoolingSetPoint"],
                                           "unoccupied_heating_sp": SETPOINTS["UnoccupiedHeatingSetPoint"]},
                               "params": r["params"]} for u, r in RTUS.items()}}
    (root / "cfg" / "mock_driver.json").write_text(json.dumps(drv_cfg, indent=2))
    drv_src = build_copy(HERE / "mock_driver", root / "build" / "mock_driver", ["setup.py", "mock_driver"])
    run([VOLTTRON_BIN / "vctl", "install", drv_src, "--vip-identity", "platform.driver",
         "--agent-config", root / "cfg" / "mock_driver.json", "--tag", "mock", "--start"], env)

    # Managers (code copied from the working tree, tests excluded)
    mgr_src = build_copy(REPO_MANAGER, root / "build" / "Manager", ["setup.py", "manager"])
    meta = {"started": now.isoformat(), "occupancy": occupancy.isoformat(), "earliest_start_time": args.earliest,
            "rtus": {}}
    for unit, r in RTUS.items():
        ident = f"manager.{unit}"
        cfg = {"system": unit, "campus": CAMPUS, "building": BUILDING, "local_tz": "America/Los_Angeles",
               "schedule": schedule, "default_setpoints": SETPOINTS, "optimal_start": optimal_start,
               "occupancy_validate_frequency": 60, "setpoint_validate_frequency": 300}
        cfg_path = root / "cfg" / f"{ident}.json"
        cfg_path.write_text(json.dumps(cfg, indent=2))
        run([VOLTTRON_BIN / "vctl", "install", mgr_src, "--vip-identity", ident, "--agent-config", cfg_path,
             "--tag", "manager"], env)
        seeded = []
        if r["seed"]:
            obs = seed_observations(thermal.ZoneParams(**r["params"]))
            p = root / "cfg" / f"{ident}.rr_seed.json"
            p.write_text(json.dumps({"observations_cooling": obs, "observations_heating": []}))
            run([VOLTTRON_BIN / "vctl", "config", "store", ident, "optimal_start.models.rr", p], env)
            seeded = obs
        if r["models"]:
            p = root / "cfg" / f"{ident}.optimal_start.json"
            p.write_text(json.dumps({**optimal_start, "models": r["models"]}))
            run([VOLTTRON_BIN / "vctl", "config", "store", ident, "optimal_start", p], env)
        meta["rtus"][unit] = {"identity": ident, "seed": seeded, "models": r["models"] or ["recovery_regression"],
                              "params": r["params"], "initial": r["initial"]}
    (root / "scenario.json").write_text(json.dumps(meta, indent=2))
    run([VOLTTRON_BIN / "vctl", "start", "--tag", "manager"], env)
    time.sleep(10)
    print(run([VOLTTRON_BIN / "vctl", "status"], env, quiet=True).stdout)
    print(f"occupancy at {occupancy:%H:%M}; first run_method at {occupancy - timedelta(minutes=args.earliest):%H:%M}; "
          f"training at {occupancy + timedelta(minutes=95):%H:%M}")


def stop(args):
    env = env_for(Path(args.root))
    run([VOLTTRON_BIN / "vctl", "shutdown", "--platform"], env, check=False)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="/tmp/aems_mock")
    ap.add_argument("--lead", type=int, default=58, help="minutes from launch to occupancy")
    ap.add_argument("--earliest", type=int, default=45, help="earliest_start_time (max prestart, minutes)")
    ap.add_argument("--stop", action="store_true")
    a = ap.parse_args()
    stop(a) if a.stop else start(a)
