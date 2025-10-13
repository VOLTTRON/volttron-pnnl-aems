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
import os
from dataclasses import dataclass, field
from datetime import datetime, time, timedelta
from functools import cached_property
from pathlib import Path
from typing import Optional
import pytz
from tzlocal import get_localzone

try:
    import volttron.utils as utils
    from volttron.utils import get_aware_utc_now
    from volttron.client.messaging import topics
except ImportError:
    from volttron.platform.messaging import topics, utils
    from volttron.platform.agent.utils import get_aware_utc_now

from .points import DaysOfWeek, Points, PointValue, SetpointControlType

_log = logging.getLogger(__name__)

DEFAULT_SCHEDULE = {
    'Monday': {'start': '6:30', 'end': '18:00'},
    'Tuesday': {'start': '6:30', 'end': '18:00'},
    'Wednesday': {'start': '6:30', 'end': '18:00'},
    'Thursday': {'start': '6:30', 'end': '18:00'},
    'Friday': {'start': '6:30', 'end': '18:00'},
    'Saturday': 'always_off',
    'Sunday': 'always_off'
}
DEFAULT_SETPOINTS = {
    'UnoccupiedHeatingSetPoint': 65,
    'UnoccupiedCoolingSetPoint': 78,
    'DeadBand': 3,
    'OccupiedSetPoint': 71
}
DEFAULT_OCCUPANCY_VALUES = {'occupied': 2, 'unoccupied': 3}

@dataclass
class Location:
    lat: float = 0.0
    lon: float = 0.0

    def __str__(self):
        return f'{self.lat}, {self.lon}'

    def __asdict__(self):
        return {'lat': self.lat, 'long': self.lon}

    def update_location(self, location: dict) -> Location:
        try:
            lat = round(location['lat'], 4)
            lon = round(location['long'], 4)
            self.lat = lat
            self.lon = lon
            _log.debug(f'Set location to {self}')
        except KeyError:
            if location != {}:
                _log.error(f'Invalid Location passed for data: {location}')
            self.lat = 0.0
            self.lon = 0.0
        finally:
            return self


@dataclass
class Schedule:
    day: DaysOfWeek
    get_current_datetime: callable
    start: time | None = None
    end: time | None = None
    always_on: bool = False
    always_off: bool = False
    earliest_start_time: int = 120

    def is_always_off(self) -> bool:
        return self.always_off

    def is_always_on(self) -> bool:
        return self.always_on

    @cached_property
    def earliest_start(self) -> time | None:
        if self.always_on or self.always_off:
            return None
        earliest_start = self.get_current_datetime().replace(
            hour=self.start.hour,
            minute=self.start.minute,
            second=0,
            microsecond=0,
        ) - timedelta(minutes=self.earliest_start_time)
        return datetime.time(earliest_start)

    def __post_init__(self):
        if self.always_on and self.always_off:
            raise ValueError('Schedule cannot be always on and always off.')
        if self.always_on or self.always_off:
            self.start = None
            self.end = None
        else:
            if not self.start or not self.end:
                raise ValueError('Schedule must have start and end times.')
            self.start = time(*[int(x) for x in str(self.start).split(':')])
            self.end = time(*[int(x) for x in str(self.end).split(':')])
            if self.start > self.end:
                raise ValueError('Schedule start time must be before end time.')


@dataclass
class OptimalStartConfig:
    latest_start_time: int
    earliest_start_time: int
    allowable_setpoint_deviation: float
    optimal_start_lockout_temperature: float = 30
    training_period_window: int = 10


@dataclass
class DefaultConfig:
    system: str
    campus: str = ''
    building: str = ''
    outdoor_temperature_topic: str = ''
    system_status_point: str = 'OccupancyCommand'
    setpoint_control: SetpointControlType = SetpointControlType(1)
    setpoint_validate_frequency: int = 300
    local_tz: str = 'UTC'
    location: Optional[Location] = None
    default_setpoints: dict[str, float] = field(default_factory=lambda: DEFAULT_SETPOINTS)
    optimal_start: OptimalStartConfig = field(
        default_factory=lambda: OptimalStartConfig(latest_start_time=10,
                                                   earliest_start_time=180,
                                                   allowable_setpoint_deviation=1,
                                                   optimal_start_lockout_temperature=30))
    zone_point_names: dict[str, str] = field(default_factory=dict)
    schedule: dict[str, dict[str, str]] = field(default_factory=lambda: DEFAULT_SCHEDULE)
    occupancy_validate_frequency: int = 60
    occupancy_values: dict[str, int] = field(default_factory=lambda: DEFAULT_OCCUPANCY_VALUES)
    occupancy_current: str = 'occupied'
    actuator_identity: str = 'platform.driver'
    weather_identity: str = 'platform.weather'
    # Path for data being read from the thermostat and stored in dataframes for csv.
    data_dir: Path = Path('~/.manager').expanduser()
    model_dir: Path = Path('~/.manager/models').expanduser()
    data_file: Optional[Path] = None
    setpoint_offset: Optional[float] = None

    def __post_init__(self):
        if isinstance(self.data_dir, str):
            self.data_dir = Path(self.data_dir).expanduser()
        if isinstance(self.model_dir, str):
            self.model_dir = Path(self.model_dir).expanduser()
        self._initialize_directories()
        self._initialize_setpoint_control()
        self._initialize_optimal_start_config()
        os.environ['LOCAL_TZ'] = self.local_tz
        self.data_file = self.data_dir / f'{self.system}.csv'
        self.timezone_consistent = self.are_timezones_equivalent(self.local_tz)
        if not self.timezone_consistent:
            _log.warning(f'Timezone configuration is not consistent.')
            _log.warning(f'Configured: {self.local_tz} -- detected system timezone: {get_localzone()}')
        self.validate()

    def _initialize_directories(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.model_dir.mkdir(parents=True, exist_ok=True)

    def _initialize_setpoint_control(self):
        if isinstance(self.setpoint_control, int):
            self.setpoint_control = SetpointControlType(self.setpoint_control)
        for point_name, value in self.zone_point_names.items():
            Points.add_item(point_name, value)

    def _initialize_optimal_start_config(self):
        if isinstance(self.optimal_start, dict):
            self.optimal_start = OptimalStartConfig(**self.optimal_start)

    def __hash__(self):
        return hash(self.__repr__())

    def validate(self):
        assert self.default_setpoints['UnoccupiedHeatingSetPoint'] < self.default_setpoints['OccupiedSetPoint']
        assert self.default_setpoints['OccupiedSetPoint'] < self.default_setpoints['UnoccupiedCoolingSetPoint']
        assert self.setpoint_control in SetpointControlType
        # Make more assertions here.
        assert os.path.isdir(self.data_dir)

    @cached_property
    def timezone(self):
        from dateutil import tz
        return tz.gettz(self.local_tz)

    @property
    def base_device_topic(self) -> utils.Topic:
        return topics.DEVICES_VALUE(
            campus=self.campus, building=self.building, unit=self.system, path='', point='all'
        )

    @property
    def system_rpc_path(self) -> utils.Topic:
        return topics.RPC_DEVICE_PATH(
            campus=self.campus, building=self.building, unit=self.system, path='', point=''
        )

    @property
    def base_record_topic(self) -> utils.Topic:
        return self.base_device_topic.replace('devices', 'record').rstrip('/all')

    def update(self, other: DefaultConfig):
        for k, v in other.__dict__.items():
            if k == 'default_setpoints':
                self.default_setpoints.update(v)
            elif k == 'schedule':
                self.schedule.update(v)
            elif k == 'occupancy_values':
                self.occupancy_values.update(v)
            else:
                self.__setattr__(k, v)
        self.validate()

    def get_current_day_schedule(self) -> Schedule:
        """
        Returns the current days schedule based on the current day of the week.

        :return: Occupancy schedule for the current day.
        :rtype: Schedule
        """
        # Cache the current datetime to avoid multiple calls
        current_dt = self.get_current_datetime()
        current_day = DaysOfWeek(current_dt.weekday())
        current_schedule = None
        if self.schedule and current_day.name in self.schedule:
            sched = self.schedule[current_day.name]
            if isinstance(sched, dict):
                current_schedule = Schedule(current_day, lambda: current_dt,
                                            earliest_start_time=self.optimal_start.earliest_start_time,
                                            **self.schedule[current_day.name])
            else:
                _log.debug(f'Using {sched} for {current_day.name}')
                if sched == 'always_on':
                    current_schedule = Schedule(current_day, lambda: current_dt, always_on=True)
                elif sched == 'always_off':
                    current_schedule = Schedule(current_day, lambda: current_dt, always_off=True)
                else:
                    raise ValueError(f'Invalid schedule value: {sched}')
        return current_schedule

    def get_current_datetime(self) -> datetime:
        """
        Returns the current datetime based on the object's timezone configuration.

        If the object's timezone configuration is consistent (`timezone_consistent` is True),
        the local system time is returned with the microsecond and second fields set to 0.
        Otherwise, the function calculates the current time based on the object's specified timezone,
        adjusting from UTC if necessary.

        Handles exceptions by logging errors, which might affect schedule determination accuracy.

        :return: The current datetime adjusted based on the object's timezone configuration.
        :rtype: datetime.time
        """
        try:
            _log.debug(f'The timezone settings are consistent: {self.timezone_consistent}')
            if self.timezone_consistent:
                return datetime.now()
            else:
                return get_aware_utc_now().astimezone(self.timezone)
        except Exception as e:
            _log.error('Schedule determination might be incorrect! Problem parsing timezone!')
            _log.error(e)
            return datetime.now()

    def get_current_time(self) -> datetime.time:
        """
        Returns the current time based on the object's timezone configuration.

        If the object's timezone configuration is consistent (`timezone_consistent` is True),
        the local system time is returned with the microsecond and second fields set to 0.
        Otherwise, the function calculates the current time based on the object's specified timezone,
        adjusting from UTC if necessary.

        Handles exceptions by logging errors, which might affect schedule determination accuracy.

        :return: The current time adjusted based on the object's timezone configuration.
        :rtype: datetime.time
        """
        return datetime.time(self.get_current_datetime()).replace(microsecond=0, second=0)

    @staticmethod
    def are_timezones_equivalent(cfg_tz: str):
        """
        Check if system and configured timezones are consistent.
        :param cfg_tz: configured timezone.
        :type cfg_tz: str
        :return: return True if system and configured timezones are consistent, False otherwise.
        :rtype: bool
        """
        now = datetime.now()
        _log.debug(f'Configured timezone {cfg_tz} -- detected system timezone: {get_localzone()}')
        # Convert the current time to both timezones
        dt1 = now.astimezone(get_localzone())
        dt2 = now.astimezone(pytz.timezone(cfg_tz))

        # Check if the UTC offsets are the same
        return dt1.utcoffset() == dt2.utcoffset()
