# -*- coding: utf-8 -*- {{{
# ===----------------------------------------------------------------------===
#
#                 AEMS Application
#
# ===----------------------------------------------------------------------===
#
# Copyright 2024 Battelle Memorial Institute
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy
# of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# ===----------------------------------------------------------------------===
# }}}
from manager.main_manager import ManagerProxy


def test_manager_proxy(manager_proxy: ManagerProxy, tmp_path):
    assert isinstance(manager_proxy, ManagerProxy)
    # Built from the shipped example config, with data kept under tmp_path (not ~/.manager).
    assert manager_proxy.cfg.data_dir == tmp_path / "data" and manager_proxy.cfg.data_dir.is_dir()
    assert manager_proxy.datafile.datafile == tmp_path / "data" / "SCHNEIDER.csv"
    assert manager_proxy.optimal_start.selected_models == ["rr"]


def _app_optimal_start(**overrides):
    """What the web app sends (config.service.ts): no models, no training_period_window."""
    return {"latest_start_time": 10, "earliest_start_time": 120, "allowable_setpoint_deviation": 1,
            "optimal_start_lockout_temperature": 25, **overrides}


def test_optimal_start_update_keeps_settings_the_caller_leaves_out(manager_proxy: ManagerProxy):
    manager_proxy.config_set("optimal_start", {**_app_optimal_start(), "models": ["carrier", "johnson", "sbs"],
                                               "training_period_window": 12})
    merged = manager_proxy.merge_optimal_start(_app_optimal_start(earliest_start_time=150))
    assert merged["models"] == ["carrier", "johnson", "sbs"]
    assert merged["training_period_window"] == 12
    assert merged["earliest_start_time"] == 150                      # what was sent is applied


def test_optimal_start_update_without_stored_entry_uses_running_config(manager_proxy: ManagerProxy):
    manager_proxy.cfg.optimal_start.models = ["siemens"]
    merged = manager_proxy.merge_optimal_start(_app_optimal_start())
    assert merged["models"] == ["siemens"]


def test_optimal_start_update_can_still_change_models(manager_proxy: ManagerProxy):
    manager_proxy.config_set("optimal_start", {**_app_optimal_start(), "models": ["carrier"]})
    assert manager_proxy.merge_optimal_start({"models": ["sbs"]})["models"] == ["sbs"]


def test_optimal_start_update_ignores_unknown_stored_keys_but_not_sent_ones(manager_proxy: ManagerProxy):
    manager_proxy.config_set("optimal_start", {**_app_optimal_start(), "retired_setting": 1})
    assert "retired_setting" not in manager_proxy.merge_optimal_start({})
    assert manager_proxy.merge_optimal_start({"typo_setting": 1})["typo_setting"] == 1   # still rejected by the config


def test_web_app_optimal_start_rpc_keeps_selected_models(manager_proxy: ManagerProxy):
    from types import SimpleNamespace
    from manager.main_manager import ManagerAgent
    manager_proxy.config_set("optimal_start", {**_app_optimal_start(), "models": ["carrier", "johnson", "sbs"]})
    agent = SimpleNamespace(_proxy=manager_proxy)
    assert ManagerAgent.set_optimal_start(agent, _app_optimal_start(earliest_start_time=150)) is True
    stored = manager_proxy.config_get("optimal_start")
    assert stored["models"] == ["carrier", "johnson", "sbs"] and stored["earliest_start_time"] == 150
    assert manager_proxy.cfg.optimal_start.models == ["carrier", "johnson", "sbs"]
    assert manager_proxy.optimal_start.selected_models == ["c", "j", "sbs"]
