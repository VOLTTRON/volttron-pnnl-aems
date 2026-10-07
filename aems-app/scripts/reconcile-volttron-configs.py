"""Make VOLTTRON hold the configs volttron-setup rendered, for every agent platform_config.yml names.

Runs inside the volttron container as the volttron user (its Python has yaml and vctl on PATH);
reconcile-volttron-configs.sh/.ps1 pipe it in. For each agent:

- each config_store entry whose stored data or type differs from its rendered file is stored again
  with `vctl config store`, which notifies the agent;
- an install-time config (the `config:` file) that differs from the agent's installed
  <pkg>.dist-info/config is overwritten, and the agent is restarted, since agents read it only at
  start.

Entries the agent or the app wrote that platform_config.yml does not name -- a manager's set_points,
schedule, holidays -- are never touched. Prints one line per change or failure; exits 1 if anything
could not be reconciled. With --dry-run it reads only, and prints what it would change.
"""

import glob
import json
import os
import subprocess
import sys

import yaml

HOME = os.environ.get("VOLTTRON_HOME") or os.path.expanduser("~/.volttron")
CONFIG = os.environ.get("CONFIG") or "/home/volttron/configurations"
DRY_RUN = "--dry-run" in sys.argv[1:]
failures = []
changes = []


def same(kind, held, rendered):
    if kind == "json":
        try:
            return json.loads(held) == json.loads(rendered)
        except ValueError:
            pass
    return held.replace("\r\n", "\n").strip() == rendered.replace("\r\n", "\n").strip()


def vctl(*args):
    if DRY_RUN:
        return
    result = subprocess.run(["vctl", *args], capture_output=True, text=True)
    if result.returncode != 0:
        lines = (result.stderr or result.stdout).strip().splitlines()
        raise RuntimeError(lines[-1] if lines else f"vctl {args[0]} exited {result.returncode}")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def installed_agents():
    agents = {}
    for directory in glob.glob(os.path.join(HOME, "agents", "*")):
        try:
            agents[read(os.path.join(directory, "IDENTITY")).strip()] = directory
        except OSError:
            continue
    return agents


def reconcile_store(identity, entries):
    try:
        store = json.loads(read(os.path.join(HOME, "configuration_store", f"{identity}.store")))
    except (OSError, ValueError):
        store = {}
    for name, entry in (entries or {}).items():
        path = os.path.expandvars(entry["file"])
        kind = (entry.get("type") or "--json").lstrip("-")
        try:
            rendered = read(path)
        except OSError as error:
            failures.append(f"{identity} store {name}: cannot read {path}: {error.strerror}")
            continue
        held = store.get(name) or {}
        if held.get("type") == kind and same(kind, held.get("data", ""), rendered):
            continue
        try:
            vctl("config", "store", identity, name, path, f"--{kind}")
            changes.append(f"{identity} store {name}")
        except RuntimeError as error:
            failures.append(f"{identity} store {name}: {error}")


def reconcile_install(identity, config, directory):
    path = os.path.expandvars(config)
    try:
        rendered = read(path)
    except OSError as error:
        failures.append(f"{identity} install-time config: cannot read {path}: {error.strerror}")
        return
    stale = [c for c in glob.glob(os.path.join(directory, "*", "*.dist-info", "config")) if not same("json", read(c), rendered)]
    if not stale:
        return
    try:
        for installed in stale if not DRY_RUN else []:
            with open(installed, "w", encoding="utf-8") as f:
                f.write(rendered)
        vctl("restart", os.path.basename(directory.rstrip("/")))
        changes.append(f"{identity} install-time config")
    except (OSError, RuntimeError) as error:
        failures.append(f"{identity} install-time config: {error}")


def main():
    platform = yaml.safe_load(read(os.path.join(CONFIG, "platform_config.yml"))) or {}
    installed = installed_agents()
    for identity, spec in (platform.get("agents") or {}).items():
        spec = spec or {}
        reconcile_store(identity, spec.get("config_store"))
        if spec.get("config"):
            if identity in installed:
                reconcile_install(identity, spec["config"], installed[identity])
            else:
                failures.append(f"{identity}: not installed")
    for change in changes:
        print(f"{'would reconcile' if DRY_RUN else 'reconciled'}: {change}")
    for failure in failures:
        print(f"FAILED: {failure}")
    if not changes and not failures:
        print("every agent already holds the rendered configs")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
