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
Tests to verify that occupancy overrides that are already in progress
(past start time, before end time) are handled correctly.

Scenarios tested:
- In-progress override is activated immediately
- Future override is scheduled but not activated
- Past override is ignored
"""

import logging
from datetime import datetime, time, timedelta
from unittest.mock import MagicMock
import unittest.mock as mock

import pytest

from manager.occupancy_override_manager import OccupancyOverride, Override
from manager.points import OccupancyTypes

_log = logging.getLogger(__name__)


@pytest.fixture
def mock_deps():
    """Create mock dependencies for OccupancyOverride."""
    return {
        'change_occupancy_fn': MagicMock(),
        'sync_occupancy_fn': MagicMock(),
        'scheduler_fn': MagicMock(return_value=MagicMock()),
    }


@pytest.fixture
def occ_manager(mock_deps):
    """Create an OccupancyOverride instance with mock dependencies."""
    return OccupancyOverride(
        change_occupancy_fn=mock_deps['change_occupancy_fn'],
        sync_occupancy_state_fn=mock_deps['sync_occupancy_fn'],
        scheduler_fn=mock_deps['scheduler_fn'],
    )


def test_in_progress_override_activated_immediately(occ_manager, mock_deps):
    """Test that an override already in progress is activated immediately."""
    today = datetime.now().date()

    override_data = {
        today.strftime('%Y-%m-%d'): [
            {'start': '08:00', 'end': '18:00'}
        ]
    }

    # Mock datetime.now() to return 14:31 (within the override window)
    mock_now = datetime.combine(today, time(14, 31))

    with mock.patch('manager.occupancy_override_manager.dt') as mock_dt:
        mock_dt.now.return_value = mock_now
        mock_dt.combine = datetime.combine
        mock_dt.strptime = datetime.strptime

        occ_manager.load_override(override_data)

    # change_occupancy should have been called to set OCCUPIED
    change_fn = mock_deps['change_occupancy_fn']
    assert change_fn.called, "change_occupancy was NOT called - override not activated!"

    occupied_calls = [
        c for c in change_fn.call_args_list
        if c[0][0] == OccupancyTypes.OCCUPIED
    ]
    assert len(occupied_calls) > 0, "System was never set to OCCUPIED"

    # current_id should be set for active override
    assert occ_manager.current_id is not None, "current_id is None - override not marked as active!"


def test_future_override_not_activated(occ_manager, mock_deps):
    """Test that a future override is scheduled but not activated."""
    tomorrow = (datetime.now() + timedelta(days=1)).date()

    override_data = {
        tomorrow.strftime('%Y-%m-%d'): [
            {'start': '09:00', 'end': '17:00'}
        ]
    }

    occ_manager.load_override(override_data)

    # change_occupancy should NOT be called for future override
    change_fn = mock_deps['change_occupancy_fn']
    assert not change_fn.called, "change_occupancy was called for future override!"

    # Should have scheduled jobs (start and end)
    scheduler_fn = mock_deps['scheduler_fn']
    assert scheduler_fn.call_count == 2, (
        f"Expected 2 scheduled jobs, got {scheduler_fn.call_count}"
    )

    # current_id should be None
    assert occ_manager.current_id is None, (
        f"current_id should be None, got {occ_manager.current_id}"
    )


def test_past_override_ignored(occ_manager, mock_deps):
    """Test that a past override is ignored."""
    yesterday = (datetime.now() - timedelta(days=1)).date()

    override_data = {
        yesterday.strftime('%Y-%m-%d'): [
            {'start': '09:00', 'end': '17:00'}
        ]
    }

    occ_manager.load_override(override_data)

    # Nothing should be called or scheduled
    change_fn = mock_deps['change_occupancy_fn']
    assert not change_fn.called, "change_occupancy should not be called for past override"

    scheduler_fn = mock_deps['scheduler_fn']
    assert scheduler_fn.call_count == 0, (
        f"Should not schedule jobs for past override, got {scheduler_fn.call_count}"
    )

    assert occ_manager.current_id is None, "current_id should be None for past override"
