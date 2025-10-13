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
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime as dt
from typing import Union

from dateutil import parser

from .colors import Colors
from .points import OccupancyTypes

_log = logging.getLogger(__name__)


@dataclass
class Override:
    date_of_override: dt
    start: str | dt = '00:00'
    end: str | dt = '24:00'
    always_off: bool = True

    @staticmethod
    def validate_time(payload: dict, key: str) -> Union[dt, tuple]:
        try:
            return parser.parse(payload[key])
        except KeyError:
            return None, f"No data found for '{key}' in payload"
        except parser._parser.ParserError:
            return None, f'Invalid start time specified in payload {payload[key]}'

    @staticmethod
    def from_payload(override_date: str, payload: dict) -> tuple[Override | None, str | None]:
        """ Create an override from a date and payload dictionary.

        :param override_date: The date of the override in the format YYYY-MM-DD
        :param payload:
            The payload dictionary containing the override data.  The payload can be
            one of two forms:
                1. { 'start': 'HH:MM', 'end': 'HH:MM' }
                2. { 'always_off': True }
        """
        try:
            date_of_override = parser.parse(override_date)
        except parser._parser.ParserError:
            return None, f'Invalid date specified {override_date}.'
        except TypeError:
            return None, f'Invalid date specified'
        else:
            start = Override.validate_time(payload, 'start')
            if isinstance(start, tuple):
                return start
            end = Override.validate_time(payload, 'end')
            if isinstance(start, tuple):
                return end

            start = start.replace(year=date_of_override.year,
                                  month=date_of_override.month,
                                  day=date_of_override.day)
            end = end.replace(year=date_of_override.year,
                              month=date_of_override.month,
                              day=date_of_override.day)
            override = Override(date_of_override, start, end, False)
            return override, None


class OccupancyOverride:
    """
    Class representing an occupancy override.

    The OccupancyOverride class is responsible for managing occupancy overrides.
    It provides methods for loading, updating, and creating occupancy overrides.
    """

    def __init__(self, change_occupancy_fn: callable, scheduler_fn: callable, sync_occupancy_state_fn: callable):
        """
        Initialize the OccupancyOverride object.

        :param change_occupancy_fn: A callable function for changing occupancy.
        :type change_occupancy_fn: callable
        :param scheduler_fn: A callable function for scheduling occupancy changes.
        :type scheduler_fn: callable
        :param sync_occupancy_state_fn: A callable function for synchronizing occupancy state.
        :type sync_occupancy_state_fn: callable
        """
        self.change_occupancy_fn = change_occupancy_fn
        self.sync_occupancy_state_fn = sync_occupancy_state_fn
        self.scheduler_fn = scheduler_fn
        self.current_id = None
        self.override_greenlets: dict[str, list] = {}

    def load_override(self, occupancy_data: dict[str, list[dict[str, str]]]):
        """
        Load occupancy overrides from a dictionary.

        The occupancy data dictionary should be in the form:

            {
                '2023-07-06': [{'start': '08:00', 'end': '10:00'}, {'start': '14:00', 'end': '17:00'}],
                '2023-07-24': [{'start': '05:00', 'end': '15:00'}]
            }

        Note the two different formats for the payload.

        :param occupancy_data: The occupancy data dictionary.
        """
        now = dt.now()
        _log.debug(f'Loading occupancy overrides: {occupancy_data}')
        for _date, schedule_list in occupancy_data.items():
            for index, override_schedule in enumerate(schedule_list):
                override, resp = Override.from_payload(_date, override_schedule)
                if override is None:
                    _log.debug(f'{resp}')
                    continue

                if resp:
                    _log.error(f"Couldn't set override for {_date}: {override_schedule}")
                    continue

                if override.end < now:
                    _log.error(
                        f"Can't create override for passed dates {_date}: {override_schedule}")
                    continue
                gid = '_'.join([_date, str(index)])
                if gid not in self.override_greenlets:
                    self.create_override(gid, override)
                else:
                    self.update_override(gid, override)

        if not occupancy_data:
            _log.debug(f'No occupancy overrides found. canceling greenlets {len(self.override_greenlets)}')
            for gid, tasks in self.override_greenlets.items():
                for schedule in tasks:
                    schedule.cancel()

            self.current_id = None
            self.sync_occupancy_state_fn()

    def _do_control_action(self, gid: str, state: str):
        _log.debug(f'{Colors.BG_GREEN}OVERRIDE _do_control_action {gid} changed to {state}{Colors.RESET}')
        new_occupancy = OccupancyTypes(state)
        self.change_occupancy_fn(new_occupancy)
        if new_occupancy == OccupancyTypes.UNOCCUPIED:
            self.current_id = None
            self.override_greenlets.pop(gid)
        elif new_occupancy == OccupancyTypes.OCCUPIED:
            self.current_id = gid
        else:
            _log.debug('Unhandled error initiating temporary occupancy override!')

    def update_override(self, gid: str, override: Override):
        if gid in self.override_greenlets:
            tasks = self.override_greenlets.pop(gid)

            for sched in tasks:
                sched.cancel()

        self.create_override(gid, override)
        return True

    def create_override(self, gid: str, override: Override):
        _log.debug(f'Creating occupancy override {gid} changed to {override.start} - {override.end}')
        _now = dt.now()
        if _now > override.end:
            _log.debug('Current time is greater than override time!')
            return

        overrides = [
            self.scheduler_fn(override.start, self._do_control_action, gid, OccupancyTypes.OCCUPIED.value),
            self.scheduler_fn(override.end, self._do_control_action, gid, OccupancyTypes.UNOCCUPIED.value)
        ]
        _log.debug(f'Current OVRR - {gid} -- {overrides}')
        self.override_greenlets[gid] = overrides
        return True
