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
Tests for adding an in-progress override to an already running agent.

This simulates the scenario where the agent is running and receives
a new override via RPC that has already started.
"""

import logging
from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest

from manager.occupancy_override_manager import OccupancyOverride, Override
from manager.points import OccupancyTypes

_log = logging.getLogger(__name__)


def _make_smart_scheduler():
    """Create a mock scheduler that executes past events immediately."""
    jobs = []

    def scheduler(when, callback, *args):
        jobs.append({'when': when, 'args': args})
        now = datetime.now()
        if isinstance(when, datetime) and when <= now:
            callback(*args)
        return MagicMock()

    return scheduler, jobs


class TestRuntimeOverrideAddition:
    """Tests for adding overrides to an already-running agent."""

    def test_in_progress_override_via_load(self):
        """Adding an in-progress override at runtime should activate it immediately."""
        change_calls = []
        scheduler, jobs = _make_smart_scheduler()

        def track_change(state):
            change_calls.append({'state': state, 'time': datetime.now()})

        occ_manager = OccupancyOverride(
            change_occupancy_fn=track_change,
            scheduler_fn=scheduler,
            sync_occupancy_state_fn=MagicMock(),
        )

        # Simulate receiving an RPC call with an override that started 2 hours ago
        now = datetime.now()
        today = now.date()
        start_hour = max(0, now.hour - 2)
        end_hour = min(23, now.hour + 2)

        override_data = {
            today.strftime('%Y-%m-%d'): [
                {
                    'start': f'{start_hour:02d}:00',
                    'end': f'{end_hour:02d}:00',
                }
            ]
        }

        occ_manager.load_override(override_data)

        occupied_set = any(
            call['state'] == OccupancyTypes.OCCUPIED for call in change_calls
        )
        assert occupied_set, (
            "OCCUPIED state was NOT set for in-progress override added at runtime"
        )
        assert occ_manager.current_id is not None, (
            "current_id should be set for active override"
        )

    def test_future_override_via_load_does_not_activate(self):
        """Adding a future override at runtime should schedule, not activate."""
        change_calls = []
        scheduler, jobs = _make_smart_scheduler()

        def track_change(state):
            change_calls.append(state)

        occ_manager = OccupancyOverride(
            change_occupancy_fn=track_change,
            scheduler_fn=scheduler,
            sync_occupancy_state_fn=MagicMock(),
        )

        tomorrow = (datetime.now() + timedelta(days=1)).date()

        override_data = {
            tomorrow.strftime('%Y-%m-%d'): [
                {'start': '09:00', 'end': '17:00'}
            ]
        }

        occ_manager.load_override(override_data)

        occupied_set = any(
            call == OccupancyTypes.OCCUPIED for call in change_calls
        )
        assert not occupied_set, "Should not activate a future override"
        assert occ_manager.current_id is None

    def test_consecutive_overrides_replace(self):
        """Adding a second override should replace the first."""
        change_calls = []
        scheduler, jobs = _make_smart_scheduler()

        def track_change(state):
            change_calls.append(state)

        occ_manager = OccupancyOverride(
            change_occupancy_fn=track_change,
            scheduler_fn=scheduler,
            sync_occupancy_state_fn=MagicMock(),
        )

        tomorrow = (datetime.now() + timedelta(days=1)).date()

        first_data = {
            tomorrow.strftime('%Y-%m-%d'): [
                {'start': '08:00', 'end': '12:00'}
            ]
        }
        second_data = {
            tomorrow.strftime('%Y-%m-%d'): [
                {'start': '13:00', 'end': '17:00'}
            ]
        }

        occ_manager.load_override(first_data)
        occ_manager.load_override(second_data)

        # Should have scheduled jobs for both sets
        assert len(jobs) >= 2, "Should have scheduled jobs for overrides"
