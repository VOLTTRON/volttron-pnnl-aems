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
Tests to verify scheduler behavior with past datetime objects.

These tests ensure that:
- Past datetimes are executed immediately when scheduled
- Past time objects (as time, not datetime) are handled correctly
- Future datetimes are scheduled normally
- The override scenario works end-to-end with a mock scheduler
"""

import logging
from datetime import datetime, time, timedelta
from unittest.mock import MagicMock

import pytest

from manager.occupancy_override_manager import OccupancyOverride, Override
from manager.points import OccupancyTypes

_log = logging.getLogger(__name__)


def _make_smart_scheduler():
    """Create a mock scheduler that executes past events immediately."""
    scheduled_jobs = []

    def mock_scheduler(when, callback, *args):
        job = {
            'when': when,
            'callback': callback,
            'args': args,
            'time': datetime.now(),
        }
        scheduled_jobs.append(job)

        now = datetime.now()
        if isinstance(when, datetime) and when <= now:
            callback(*args)
            return MagicMock(name=f"job_{len(scheduled_jobs)}")
        else:
            return MagicMock(name=f"job_{len(scheduled_jobs)}")

    return mock_scheduler, scheduled_jobs


class TestMockSchedulerDatetime:
    """Tests for scheduler behavior with various datetime inputs."""

    def test_past_datetime_executes_immediately(self):
        """Scheduling a past datetime should execute the callback immediately."""
        scheduled_jobs = []
        callback_results = []

        def mock_scheduler(when, callback, *args):
            scheduled_jobs.append({'when': when})
            now = datetime.now()
            if isinstance(when, datetime) and when <= now:
                callback(*args)
            return MagicMock()

        def test_callback(gid, state):
            callback_results.append({'gid': gid, 'state': state})

        past_dt = datetime.now() - timedelta(hours=2)
        mock_scheduler(past_dt, test_callback, "test1", "OCCUPIED")

        assert len(callback_results) == 1
        assert callback_results[0]['state'] == "OCCUPIED"

    def test_future_datetime_does_not_execute(self):
        """Scheduling a future datetime should not execute the callback."""
        callback_results = []

        def mock_scheduler(when, callback, *args):
            now = datetime.now()
            if isinstance(when, datetime) and when <= now:
                callback(*args)
            return MagicMock()

        def test_callback(gid, state):
            callback_results.append({'gid': gid, 'state': state})

        future_dt = datetime.now() + timedelta(hours=2)
        mock_scheduler(future_dt, test_callback, "test3", "OCCUPIED")

        assert len(callback_results) == 0

    def test_past_time_object_executes_immediately(self):
        """Scheduling a past time object should execute the callback immediately."""
        callback_results = []

        def mock_scheduler(when, callback, *args):
            now = datetime.now()
            if isinstance(when, time):
                when_dt = datetime.combine(datetime.today(), when)
                if when_dt <= now:
                    callback(*args)
            elif isinstance(when, datetime) and when <= now:
                callback(*args)
            return MagicMock()

        def test_callback(gid, state):
            callback_results.append({'gid': gid, 'state': state})

        past_time = (datetime.now() - timedelta(hours=1)).time()
        mock_scheduler(past_time, test_callback, "test2", "OCCUPIED")

        assert len(callback_results) == 1


class TestOverrideWithSmartScheduler:
    """Tests for the override scenario with a scheduler that handles past times."""

    def test_in_progress_override_activates(self):
        """An in-progress override should activate OCCUPIED immediately."""
        change_occupancy_calls = []
        mock_scheduler, scheduled_jobs = _make_smart_scheduler()

        def mock_change_occupancy(state):
            change_occupancy_calls.append({'state': state, 'time': datetime.now()})

        manager = OccupancyOverride(
            change_occupancy_fn=mock_change_occupancy,
            scheduler_fn=mock_scheduler,
            sync_occupancy_state_fn=MagicMock(),
        )

        now = datetime.now()
        start_time = now - timedelta(hours=2)
        end_time = now + timedelta(hours=2)

        override = Override(
            date_of_override=now.date(),
            start=start_time,
            end=end_time,
            always_off=False,
        )

        manager.create_override("test_override", override)

        occupied_set = any(
            call['state'] == OccupancyTypes.OCCUPIED
            for call in change_occupancy_calls
        )
        assert occupied_set, "OCCUPIED state was NOT set for in-progress override"
        assert manager.current_id == "test_override", (
            f"current_id not set (value: {manager.current_id})"
        )
