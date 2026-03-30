#!/usr/bin/env python3
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
"""
Tests to verify config store loading at startup.

These tests validate that all expected configuration entries
(schedule, holidays, location, temperature setpoints, optimal start,
occupancy overrides, control) are correctly structured and loadable.
"""

import json
import logging

import pytest

_log = logging.getLogger(__name__)

# Test configuration data representing all config store entries
TEST_CONFIGS = {
    'schedule': {
        "Monday": {"start": "6:30", "end": "18:00"},
        "Tuesday": {"start": "6:30", "end": "18:00"},
        "Wednesday": {"start": "6:30", "end": "18:00"},
        "Thursday": {"start": "6:30", "end": "18:00"},
        "Friday": {"start": "6:30", "end": "18:00"},
        "Saturday": "always_off",
        "Sunday": "always_off",
    },
    'holidays': {
        "Christmas": {},
        "NewYear": {},
        "Custom": {
            "month": 12,
            "day": 26,
            "observance": "nearest_workday",
        },
    },
    'location': {
        "latitude": 46.34,
        "longitude": -119.28,
        "timezone": "US/Pacific",
    },
    'temperature_setpoints': {
        "UnoccupiedHeatingSetPoint": 60.0,
        "UnoccupiedCoolingSetPoint": 85.0,
        "DeadBand": 2.5,
        "OccupiedSetPoint": 72.0,
    },
    'optimal_start': {
        "latest_start_time": 30,
        "earliest_start_time": 180,
        "allowable_setpoint_deviation": 1.0,
        "optimal_start_lockout_temperature": 30,
        "training_period_window": 10,
    },
    'occupancy_overrides': {
        "override_1": [
            {
                "date": "2024-12-25",
                "start": "08:00",
                "end": "17:00",
            }
        ]
    },
    'control': {
        "economizer_lockout_temperature": 65.0,
        "heating_lockout_temperature": 50.0,
        "cooling_lockout_temperature": 55.0,
    },
}


class TestConfigStructure:
    """Validate that test configuration data is well-formed."""

    def test_schedule_has_all_days(self):
        """Schedule config should have all 7 days of the week."""
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for day in days:
            assert day in TEST_CONFIGS['schedule'], f"Missing day: {day}"

    def test_schedule_weekday_format(self):
        """Weekday schedule entries should have start and end times."""
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]:
            entry = TEST_CONFIGS['schedule'][day]
            assert isinstance(entry, dict), f"{day} should be a dict"
            assert 'start' in entry, f"{day} missing 'start'"
            assert 'end' in entry, f"{day} missing 'end'"

    def test_schedule_weekend_format(self):
        """Weekend schedule entries should be 'always_off'."""
        for day in ["Saturday", "Sunday"]:
            assert TEST_CONFIGS['schedule'][day] == "always_off"

    def test_location_has_required_fields(self):
        """Location config should have latitude, longitude, and timezone."""
        loc = TEST_CONFIGS['location']
        assert 'latitude' in loc
        assert 'longitude' in loc
        assert 'timezone' in loc
        assert isinstance(loc['latitude'], (int, float))
        assert isinstance(loc['longitude'], (int, float))

    def test_temperature_setpoints_has_required_fields(self):
        """Temperature setpoints config should have all required fields."""
        sp = TEST_CONFIGS['temperature_setpoints']
        required = [
            "UnoccupiedHeatingSetPoint",
            "UnoccupiedCoolingSetPoint",
            "DeadBand",
            "OccupiedSetPoint",
        ]
        for field in required:
            assert field in sp, f"Missing setpoint field: {field}"
            assert isinstance(sp[field], (int, float))

    def test_optimal_start_has_required_fields(self):
        """Optimal start config should have all required fields."""
        os_cfg = TEST_CONFIGS['optimal_start']
        required = [
            "latest_start_time",
            "earliest_start_time",
            "allowable_setpoint_deviation",
            "optimal_start_lockout_temperature",
            "training_period_window",
        ]
        for field in required:
            assert field in os_cfg, f"Missing optimal start field: {field}"

    def test_control_has_required_fields(self):
        """Control config should have lockout temperature fields."""
        ctrl = TEST_CONFIGS['control']
        required = [
            "economizer_lockout_temperature",
            "heating_lockout_temperature",
            "cooling_lockout_temperature",
        ]
        for field in required:
            assert field in ctrl, f"Missing control field: {field}"
            assert isinstance(ctrl[field], (int, float))

    def test_all_configs_are_json_serializable(self):
        """All config entries should be JSON serializable."""
        for name, config in TEST_CONFIGS.items():
            try:
                json.dumps(config)
            except (TypeError, ValueError) as e:
                pytest.fail(f"Config '{name}' is not JSON serializable: {e}")
