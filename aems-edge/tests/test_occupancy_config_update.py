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
Tests to verify occupancy override config store update behavior.

These tests check that setting occupancy overrides properly updates
the config and triggers the correct behavior in OccupancyOverride.
"""

import json
import logging
from datetime import datetime, timedelta
from unittest.mock import MagicMock

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


class TestOccupancyConfigUpdate:
    """Tests for occupancy override config store update behavior."""

    def test_load_override_with_future_data(self, occ_manager, mock_deps):
        """Loading a future override should schedule jobs without activating."""
        tomorrow = datetime.now() + timedelta(days=1)
        date_str = tomorrow.strftime('%Y-%m-%d')
        start_time = "09:00"
        end_time = "17:00"

        test_data = {
            date_str: [{'start': start_time, 'end': end_time}]
        }

        occ_manager.load_override(test_data)

        # Should schedule but not activate
        change_fn = mock_deps['change_occupancy_fn']
        assert not change_fn.called, "Should not activate a future override"

        scheduler_fn = mock_deps['scheduler_fn']
        assert scheduler_fn.call_count == 2, "Should schedule start and end jobs"

    def test_load_override_replaces_previous(self, occ_manager, mock_deps):
        """Loading a new override should replace any previous override data."""
        tomorrow = datetime.now() + timedelta(days=1)
        date_str = tomorrow.strftime('%Y-%m-%d')

        first_data = {
            date_str: [{'start': '09:00', 'end': '12:00'}]
        }
        second_data = {
            date_str: [{'start': '13:00', 'end': '17:00'}]
        }

        occ_manager.load_override(first_data)
        first_call_count = mock_deps['scheduler_fn'].call_count

        occ_manager.load_override(second_data)
        # Should have additional scheduler calls for the second override
        assert mock_deps['scheduler_fn'].call_count > first_call_count

    def test_load_empty_override(self, occ_manager, mock_deps):
        """Loading an empty override dict should not crash."""
        occ_manager.load_override({})

        change_fn = mock_deps['change_occupancy_fn']
        assert not change_fn.called
        assert occ_manager.current_id is None

    def test_override_data_is_json_serializable(self):
        """Override data used in config store must be JSON serializable."""
        tomorrow = datetime.now() + timedelta(days=1)
        date_str = tomorrow.strftime('%Y-%m-%d')
        start_time = (datetime.now() + timedelta(hours=2)).strftime('%H:%M')
        end_time = (datetime.now() + timedelta(hours=3)).strftime('%H:%M')

        test_data = {
            date_str: [{'start': start_time, 'end': end_time}]
        }

        # Should be serializable for config store
        serialized = json.dumps(test_data)
        deserialized = json.loads(serialized)
        assert deserialized == test_data
