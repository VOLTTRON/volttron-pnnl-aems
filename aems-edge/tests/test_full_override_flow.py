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
Tests for the full flow of occupancy overrides.

These tests simulate what happens when the Manager agent loads
overrides in various states (in-progress, future, past) and verify
the complete flow from load_override through to state changes.
"""

import logging
from datetime import datetime, time, timedelta
from unittest.mock import MagicMock
import unittest.mock as mock

import pytest

from manager.occupancy_override_manager import OccupancyOverride, Override
from manager.points import OccupancyTypes

_log = logging.getLogger(__name__)


def _make_smart_scheduler():
    """Create a mock scheduler that executes past events immediately."""
    scheduled_jobs = []

    def scheduler(when, callback, *args):
        scheduled_jobs.append({
            'when': when, 'callback': callback, 'args': args,
        })
        now = datetime.now()
        if isinstance(when, datetime) and when <= now:
            callback(*args)
        return MagicMock()

    return scheduler, scheduled_jobs


class TestFullOverrideFlow:
    """End-to-end tests for occupancy override flows."""

    def test_in_progress_override_sets_occupied(self):
        """An override already in progress should set OCCUPIED immediately."""
        change_calls = []
        scheduler, jobs = _make_smart_scheduler()

        def track_change(state):
            change_calls.append(state)

        occ_manager = OccupancyOverride(
            change_occupancy_fn=track_change,
            scheduler_fn=scheduler,
            sync_occupancy_state_fn=MagicMock(),
        )

        now = datetime.now()
        today = now.date()

        # Override that started 2 hours ago and ends 2 hours from now
        start = now - timedelta(hours=2)
        end = now + timedelta(hours=2)

        override = Override(
            date_of_override=today,
            start=start,
            end=end,
            always_off=False,
        )

        occ_manager.create_override("test_flow", override)

        assert OccupancyTypes.OCCUPIED in change_calls, (
            "OCCUPIED was not set for in-progress override"
        )
        assert occ_manager.current_id == "test_flow"

    def test_full_load_override_in_progress(self):
        """Load an in-progress override via load_override (the config path)."""
        change_calls = []
        scheduler, jobs = _make_smart_scheduler()

        def track_change(state):
            change_calls.append(state)

        occ_manager = OccupancyOverride(
            change_occupancy_fn=track_change,
            scheduler_fn=scheduler,
            sync_occupancy_state_fn=MagicMock(),
        )

        today = datetime.now().date()
        mock_now = datetime.combine(today, time(14, 31))

        override_data = {
            today.strftime('%Y-%m-%d'): [
                {'start': '08:00', 'end': '18:00'}
            ]
        }

        with mock.patch('manager.occupancy_override_manager.dt') as mock_dt:
            mock_dt.now.return_value = mock_now
            mock_dt.combine = datetime.combine
            mock_dt.strptime = datetime.strptime

            occ_manager.load_override(override_data)

        assert OccupancyTypes.OCCUPIED in change_calls, (
            "OCCUPIED was not set via load_override for in-progress override"
        )
        assert occ_manager.current_id is not None

    def test_override_greenlets_tracked(self):
        """Override greenlets should be tracked for cleanup."""
        scheduler_fn = MagicMock(return_value=MagicMock())

        occ_manager = OccupancyOverride(
            change_occupancy_fn=MagicMock(),
            scheduler_fn=scheduler_fn,
            sync_occupancy_state_fn=MagicMock(),
        )

        tomorrow = (datetime.now() + timedelta(days=1)).date()

        override_data = {
            tomorrow.strftime('%Y-%m-%d'): [
                {'start': '09:00', 'end': '17:00'}
            ]
        }

        occ_manager.load_override(override_data)

        assert len(occ_manager.override_greenlets) > 0, (
            "Override greenlets should be tracked"
        )
