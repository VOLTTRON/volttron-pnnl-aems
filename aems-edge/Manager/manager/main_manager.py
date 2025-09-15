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

import inspect
import json
import logging
import os
import sys
from dataclasses import asdict, dataclass, is_dataclass
from datetime import datetime as dt
from pathlib import Path
from typing import Any, Union

import colorama
import gevent
import pandas as pd
from dateutil import parser

try:
    from aems.client.agent import RPC, Agent, Scheduler, get_smaller_print, run_agent
    from aems.client.jsonrpc import RemoteError
    cron = Scheduler.cron
    import volttron.utils as utils
    # from volttron.utils import format_timestamp, get_aware_utc_now
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s.%(msecs)03d %(levelname)-8s %(name)s (%(lineno)d): %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        force=True  # Override existing configuration
    )
    # Disable HTTP client tracing while keeping other debug logging
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)
    logging.getLogger('httpcore._trace').setLevel(logging.WARNING)
    logging.getLogger('aems.client.agent').setLevel(logging.INFO)

except ImportError:

    from volttron.platform.agent import utils
    from volttron.platform.agent.utils import format_timestamp, get_aware_utc_now, setup_logging
    from volttron.platform.jsonrpc import RemoteError
    from volttron.platform.scheduling import cron
    from volttron.platform.vip.agent import RPC, Agent
    setup_logging()

    # Configure timestamp formatting for all loggers
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s.%(msecs)03d %(levelname)-8s %(name)s (%(lineno)d): %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        force=True  # Override existing configuration
    )
    SIZE_OUTPUT = 100
    def get_smaller_print(data, in_str_full_value: str |None = None):
        if isinstance(data, str):
            if in_str_full_value and in_str_full_value in data:
                return data

            return data[:SIZE_OUTPUT] + "..." if len(data) > SIZE_OUTPUT else data
        else:
            if isinstance(data, (dict, list)):
                return get_smaller_print(json.dumps(data, default=str))
        return data



from . import DefaultConfig, Location, Schedule
from .data_utils import Data, DataFileAccess
from .holiday_manager import HolidayManager
from .lock_out_manager import LockOutManager
from .occupancy_override_manager import OccupancyOverride
from .optimal_start_manager import OptimalStartConfig, OptimalStartManager
from .points import DaysOfWeek, OccupancyTypes, Points, SetpointControlType, asdict_factory
from .utils import format_timestamp, get_aware_utc_now, load_config

DATE = 'Date'

SCHEDULE = 'Schedule'
OCC_OVERRIDE = 'OccupancyOverride'
SET_POINTS = 'TemperatureSetPoints'
HOLIDAYS = 'Holidays'
OPTIMAL_START = 'OptimalStart'
CONFIGURATIONS = 'Configurations'

pd.set_option('display.max_rows', None)
__author__ = ['Robert Lutes<robert.lutes@pnnl.gov>', 'Craig Allwardt<craig.allwardt@pnnl.gov>']
__version__ = '0.0.2'

#setup_logging()
_log = logging.getLogger(__name__)

# Define a custom ColoredFormatter for more readable logs
class ColoredFormatter(logging.Formatter):
    """Custom log formatter with colors"""
    # Initialize colorama for cross-platform color support
    colorama.init()

    # Define color codes for different log levels
    COLORS = {
        'DEBUG': colorama.Fore.CYAN,
        'INFO': colorama.Fore.GREEN,
        'WARNING': colorama.Fore.YELLOW,
        'ERROR': colorama.Fore.RED,
        'CRITICAL': colorama.Fore.RED + colorama.Style.BRIGHT
    }

    def format(self, record):
        # Add colors to the log level
        levelname = record.levelname
        if levelname in self.COLORS:
            colored_levelname = f"{self.COLORS[levelname]}{levelname}{colorama.Style.RESET_ALL}"
            record.levelname = colored_levelname

        # Call the original formatter
        return super().format(record)

# Set the formatter for the logger with timestamps
formatter = ColoredFormatter('%(asctime)s.%(msecs)03d %(levelname)-18s %(module)s (%(lineno)d): %(message)s')
formatter.datefmt = '%Y-%m-%d %H:%M:%S'
for handler in logging.getLogger().handlers:
    handler.setFormatter(formatter)

# Set the formatter for the logger if running inside debugger but not when
# run by the volttron platform.
if 'PYDEVD_USE_FRAME_EVAL' in os.environ:
    formatter = ColoredFormatter('%(asctime)s.%(msecs)03d %(levelname)-18s %(module)s (%(lineno)d): %(message)s')
    formatter.datefmt = '%Y-%m-%d %H:%M:%S'
    for handler in logging.getLogger().handlers:
        handler.setFormatter(formatter)

StrPath = Union[str, Path]

DEBUGGING = True

TIMEOUT_FROM_SERVER = 5
TIMEOUT_FROM_PEER = 20
TIMEOUT_FROM_SERVER_WHILE_DEBUGGING = 300

if DEBUGGING:
    TIMEOUT_FROM_SERVER = TIMEOUT_FROM_SERVER_WHILE_DEBUGGING
    TIMEOUT_FROM_PEER = TIMEOUT_FROM_SERVER_WHILE_DEBUGGING

class ManagerAgent(Agent):

    def __init__(self, proxy: ManagerProxy, default_config: DefaultConfig, **kwargs):
        super().__init__(**kwargs)
        self._proxy = proxy
        _log.info(f'🚀 Initializing {self.__class__.__name__} with configuration')
        _log.debug(f'Default Configuration for the system: {default_config}')
        default_config.validate()

        # Create a mapping of pattern to function for calling the proxy.
        # The order here is the order that we want the configurations to be
        # updated from the configuration store.
        #
        # NOTE: 'set_points' is used internally by _set_default_setpoint
        # while 'temperature_setpoints' can be used for external updates
        self._config_references = {
            'schedule': self._proxy.set_schedule,
            'temperature_setpoints': self._proxy.set_temperature_setpoints,
            'set_points': self._proxy.set_temperature_setpoints,  # Also support the internal name
            'holidays': self._proxy.set_holidays,
            'optimal_start': self._proxy.set_optimal_start,
            'occupancy_overrides': self._proxy.set_occupancy_override,
            'location': self._proxy.set_location,
            'control': self._proxy.set_configurations
        }

        # Registers the configstore for the pattern 'config' ('config is default config entry')
        self.vip.config.subscribe(self.update_default, actions=['NEW', 'UPDATE'], pattern='config')

        self.vip.config.set_default('config', asdict(default_config, dict_factory=asdict_factory))

        for key in self._config_references:
            _log.info(f'📋 Subscribing to config store entry: {key}')
            self.vip.config.subscribe(self.update_from_config_store, actions=['NEW', 'UPDATE'], pattern=key)

        # Schedule loading of existing configs after agent is fully started
        # This ensures the config store is properly initialized
        self.core.onstart.connect(self._on_start_load_configs)

    def _on_start_load_configs(self, sender, **kwargs):
        """
        Called when the agent starts. Loads existing configurations from the store.
        """
        _log.info('🔄 Agent started, loading existing configurations from config store...')
        self._load_existing_configs()

    def _load_existing_configs(self):
        """
        Load existing configurations from the config store at startup.
        This ensures all configs are loaded even if no NEW/UPDATE actions are triggered.
        """
        # Small delay to ensure config store is fully initialized
        import gevent
        gevent.sleep(0.5)

        _log.info('📊 Attempting to load all existing configurations from store...')
        configs_loaded = []
        configs_not_found = []
        configs_failed = []

        for config_name, setter_func in self._config_references.items():
            try:
                _log.debug(f'🔍 Checking for existing config: {config_name}')
                # Try to get the config from the store
                contents = self.vip.config.get(config_name)
                if contents:
                    _log.info(f'✅ Found existing config for {config_name}, loading...')
                    _log.debug(f'   Contents preview: {get_smaller_print(contents)}')
                    setter_func(contents, update_store=False)
                    configs_loaded.append(config_name)
                else:
                    _log.debug(f'ℹ️ No existing config found for {config_name} (empty)')
                    configs_not_found.append(config_name)
            except KeyError:
                _log.debug(f'ℹ️ Config {config_name} not found in store (KeyError)')
                configs_not_found.append(config_name)
            except Exception as ex:
                _log.error(f'❌ Error loading config {config_name}: {ex}', exc_info=True)
                configs_failed.append(config_name)

        # Summary log
        _log.info('📈 Config loading summary:')
        if configs_loaded:
            _log.info(f'   ✅ Loaded: {", ".join(configs_loaded)}')
        if configs_not_found:
            _log.info(f'   ℹ️ Not found: {", ".join(configs_not_found)}')
        if configs_failed:
            _log.error(f'   ❌ Failed: {", ".join(configs_failed)}')

    def update_from_config_store(self, config_name: str, action: str, contents: dict):
        """
        Updates the configuration for each of the manager functions:
            schedule, temperature_setpoints, holidays, optimal_start,
            occupancy_overrides, location

        :param config_name: The name of the configuration being updated.
        :type config_name: str
        :param action: The action being taken on the configuration. (Should always be 'NEW' or 'UPDATE')
        :type action: str
        :param contents: The contents of the configuration being updated.
        :type contents: dict
        :return: None
        """
        _log.debug(
            f'---Updating from config store: {config_name} {action} {get_smaller_print(contents)} {type(contents)}'
        )
        try:
            self._config_references[config_name](contents, update_store=False)
        except Exception as ex:
            _log.error(f'❌ Error updating from config store: {config_name}', exc_info=True)
            _log.error(f'❌ Exception details: {str(ex)}')
        else:
            _log.info(
                f'✅ Successfully updated configuration: {config_name}'
            )

    def update_default(self, config_name: str, action: str, contents: dict):
        """
        Updates the default configuration for the system.

        Creates a new DefaultConfig object from the contents of the configuration and validates it.  Once
        validated then passes the object to the proxy to update the configuration.

        :param config_name: The name of the configuration being updated. (Should always be 'config')
        :type config_name: str
        :param action: The action being taken on the configuration. (Should always be 'NEW' or 'UPDATE')
        :type action: str
        :param contents: The contents of the configuration being updated.
        :type contents: dict
        :return: None
        """

        _log.debug(
            f'Updating default: {config_name} {action} {get_smaller_print(contents)}'
        )

        config = DefaultConfig(**contents)
        config.validate()
        self._proxy.update_default_config(config)

    @RPC.export
    def set_optimal_start(self, data: dict) -> bool:
        try:
            obj = OptimalStartConfig(**data)
            result = self._proxy.set_optimal_start(obj, update_store=True)
            _log.debug(f'set_optimal_start_rpc: {result}')
            return result
        except Exception as ex:
            _log.error(f'Failed to set optimal start: {ex}', exc_info=True)
            return False

    @RPC.export
    def set_schedule(self, data) -> bool:
        try:
            result = self._proxy.set_schedule(data, update_store=True)
            _log.debug(f'set_schedule_rpc: {result}')
            return result
        except Exception as ex:
            _log.error(f'Failed to set schedule: {ex}', exc_info=True)
            return False

    @RPC.export
    def set_temperature_setpoints(self, data) -> bool:
        try:
            result = self._proxy.set_temperature_setpoints(data, update_store=True)
            _log.debug(f'set_temperature_setpoints_rpc: {result}')
            return result
        except Exception as ex:
            _log.error(f'Failed to set temperature setpoints: {ex}', exc_info=True)
            return False

    @RPC.export
    def set_holidays(self, data) -> bool:
        try:
            result = self._proxy.set_holidays(data, update_store=True)
            _log.debug(f'set_holidays_rpc: {result}')
            return result
        except Exception as ex:
            _log.error(f'Failed to set holidays: {ex}', exc_info=True)
            return False

    @RPC.export
    def set_occupancy_override(self, data: dict[str, dict]) -> bool:
        try:
            result = self._proxy.set_occupancy_override(data, update_store=True)
            _log.debug(f"--------------------------------------------------------------------")
            _log.debug(f'set_occupancy_override_rpc: {result}')
            _log.debug(f"--------------------------------------------------------------------"
            )
            return result
        except Exception as ex:
            _log.error(f'Failed to set occupancy override: {ex}', exc_info=True)
            return False

    @RPC.export
    def set_configurations(self, data) -> bool:
        try:
            result = self._proxy.set_configurations(data, update_store=True)
            _log.debug(f'set_configurations_rpc: {result}')
            return result
        except Exception as ex:
            _log.error(f'Failed to set configurations: {ex}', exc_info=True)
            return False

    @RPC.export
    def set_location(self, data) -> bool:
        try:
            result = self._proxy.set_location(data, update_store=True)
            _log.debug(f'set_location_rpc: {result}')
            return result
        except Exception as ex:
            _log.error(f'Failed to set location: {ex}', exc_info=True)
            return False

    def has_connected_identity(self, identity: str) -> bool:
        """
        Checks to see if the identity is connected to the platform.

        :param identity: The identity to check.
        :type identity: str
        :return: True if connected, False if not.
        :rtype: bool
        """
        list_of_id = self.vip.peerlist().get(timeout=TIMEOUT_FROM_SERVER)
        return identity in list_of_id


class ManagerProxy:

    def __init__(self, config_path: StrPath, agent_to_proxy: Agent = None, **kwargs):
        self.agent_class = agent_to_proxy or ManagerAgent
        self.config_path = config_path
        self.kwargs = kwargs

        self._proxied_agent = None
        self._validate_occupancy_greenlet = None
        self._validate_setpoints_greenlet = None

        config = load_config(self.config_path)

        default_config = DefaultConfig(**config)

        self.cfg = default_config

        # No precontrol code yet, this might be needed in future
        self.precontrols = config.get('precontrols', {})
        self.precontrol_flag = False

        # self.earliest_start_time = config.get('earliest_start_time', 180)
        # self.latest_start_time = config.get('latest_start_time', 0)
        # Time and schedule object initialization
        self.datafile = DataFileAccess(datafile=self.cfg.data_file)
        self.data_handler = Data(timezone=self.cfg.timezone,
                                 data_accessor=self.datafile,
                                 setpoint_offset=self.cfg.setpoint_offset)

        self._proxied_agent: ManagerAgent = self.agent_class(proxy=self, default_config=default_config, **self.kwargs)
        self.run = self._proxied_agent.run
        self.core = self._proxied_agent.core
        self.config = self._proxied_agent.vip.config
        self.identity = self.core.identity
        self.weather_forecast: list[tuple[dt, float]] = []
        self._weather_update_greenlet = None
        self.holiday_manager = HolidayManager()
        self.occupancy_override = OccupancyOverride(change_occupancy_fn=self.change_occupancy,
                                                    scheduler_fn=self.core.schedule,
                                                    sync_occupancy_state_fn=self.sync_occupancy_state)
        self.optimal_start = OptimalStartManager(schedule=self.cfg.schedule,
                                                 config=self.cfg,
                                                 identity=self.identity,
                                                 scheduler_fn=self.core.schedule,
                                                 holiday_manager=self.holiday_manager,
                                                 data_handler=self.data_handler,
                                                 publish_fn=self.publish,
                                                 change_occupancy_fn=self.change_occupancy,
                                                 config_set_fn=self.config_set,
                                                 config_get_fn=self.config_get)

        self.lockout_manager = LockOutManager(get_forecast_fn=self.get_weather_forecast,
                                              get_current_oat_fn=self.get_current_oat,
                                              control_fn=self.do_zone_control,
                                              scheduler_fn=self.core.schedule,
                                              change_occupancy_fn=self.change_occupancy,
                                              sync_occupancy_state_fn=self.sync_occupancy_state)
        # Wait to call this until the system connects.
        self.core.onstart.connect(lambda x: self.setup_optimal_start())

    def setup_optimal_start(self):
        _log.info(f'📅 Setting up data subscriptions for {self.identity}')
        self._p.vip.pubsub.subscribe('pubsub', self.cfg.base_device_topic,
                                     callback=self.update_data).get(timeout=TIMEOUT_FROM_SERVER)
        if self.cfg.outdoor_temperature_topic:
            _log.info(f'🌡️ Subscribing to outdoor temperature topic: {self.cfg.outdoor_temperature_topic}')
            self._p.vip.pubsub.subscribe('pubsub', self.cfg.outdoor_temperature_topic,
                                         callback=self.update_custom_data).get(timeout=TIMEOUT_FROM_SERVER)
        self.optimal_start.setup_optimal_start()
        if self._proxied_agent.has_connected_identity(self.cfg.weather_identity):
            _log.info(f'🌤️ Setting up weather forecast update for {self.cfg.weather_identity}')
            self._weather_update_greenlet = self.core.schedule(cron('0 * * * *'), self.update_weather_forecast)

    @property
    def _p(self) -> ManagerAgent:
        if self._proxied_agent is None:
            raise RuntimeError('The proxy agent hasn\'t been set.')
        return self._proxied_agent

    def config_get(self, name: str):
        """
        A helper method to get the configuration from the configuration store.

        :param name: The name of the configuration to get.
        :type name: str
        :return: The configuration.
        :rtype: dict
        """
        try:
            _log.debug(f"Getting config '{name}' from config store")
            result = self._p.vip.config.get(name)
            _log.debug(f"Config '{name}' retrieved from config store: {result}")
        except Exception as ex:
            if "not found" in str(ex):
                raise KeyError(name)
            else:
                raise

        return result

        #return self._p.vip.config.get(name)

    def config_set(self, name: str, config: dict[str, Any] | dataclass):
        """
        A helper method to set the configuration in the configuration store.

        :param name: The name of the configuration to set.
        :type name: str
        :param config: The configuration to set.
        :type config: dict
        :return: None
        """
        if is_dataclass(config):
            config = asdict(config, dict_factory=asdict_factory)

        try:
            # Wait for the config to be set and handle any errors
            _log.debug(f"Setting: {name} = {config}")
            result = self._p.vip.config.set(name, config, send_update=True)
            if hasattr(result, 'get'):
                result.get(timeout=TIMEOUT_FROM_SERVER)
            _log.debug(f"Successfully set config '{name}' in config store")
        except Exception as ex:
            _log.error(f"Failed to set config '{name}' in config store: {ex}")
            raise

    def publish(self, topic: str, headers: dict[str, str], message: dict[str, Any] | dataclass):
        """
        A helper method to publish a message to the message bus.

        :param topic: The topic to publish the message to.
        :type topic: str
        :param headers: The headers to include with the message.
        :type headers: dict
        :param message: The message to publish.
        :type message: dict
        """
        if is_dataclass(message):
            message = asdict(message, dict_factory=asdict_factory)

        debug_ref = f'{inspect.stack()[0][3]}()->{inspect.stack()[1][3]}()'
        _log.debug(f'📢 Publishing: {topic} from {debug_ref}')
        self._p.vip.pubsub.publish('pubsub', topic, headers=headers, message=message).get(timeout=TIMEOUT_FROM_SERVER)

    def rpc_set_point(self, point: str, value: Any, on_property: str | None = None):
        """
        A helper method to call the RPC method on the actuator agent.

        :param point: The point to set the value for.
        :type point: str
        :param value: The value to set the point to.
        :type value: Any
        :param _property: The property of the point to set.
        :type _property: str|None
        :return: The result of the RPC call.
        :rtype: Any
        """
        _log.debug(f"The type is a {type(point)}")
        debug_ref = f'{inspect.stack()[0][3]}()->{inspect.stack()[1][3]}()'
        _log.debug(f'Calling: {self.cfg.actuator_identity} set_point -- {self.cfg.system_rpc_path}, {str(point)}, {value}')
        # TODO This need to be fixed by ROBERT on_property thingy
        # result = self._p.vip.rpc.call(self.cfg.actuator_identity, 'set_point', self.cfg.system_rpc_path, point,
        #                               value, on_property=on_property).get(timeout=10.0)
        result = self._p.vip.rpc.call(
            self.cfg.actuator_identity,
            'set_point',
            str(self.cfg.system_rpc_path),
            str(point),
            value).get(timeout=TIMEOUT_FROM_SERVER)  # Increased timeout from 10s to 20s
        _log.debug(f'{debug_ref}: -> {result}')
        return result

    def rpc_get_point(self, point: str):
        """
        A helper method to call the RPC method on the actuator agent.

        :param point: The point to get the value for.
        :type point: str
        :return: The result of the RPC call.
        :rtype: Any
        """

        result = self._p.vip.rpc.call(self.cfg.actuator_identity, 'get_point', self.cfg.system_rpc_path,
                                      point).get(timeout=TIMEOUT_FROM_PEER)  # Increased timeout from 10s to 20s
        debug_ref = f'{inspect.stack()[0][3]}()->{inspect.stack()[1][3]}()'
        _log.debug(f'{debug_ref}: {self.cfg.system_rpc_path} -- {point} -> {result}')
        return result

    def _set_default_setpoint(self, config: DefaultConfig):
        try:
            temp_set_points = self.config_get('set_points')
            _log.debug("Found existing set_points in config store")
        except KeyError:
            _log.info("No set_points in config store using defaults.")
            try:
                self.config_set('set_points', self.cfg.default_setpoints)
                _log.info("Successfully set default setpoints in config store")
            except Exception as ex:
                _log.error(f"Failed to set default setpoints: {ex}")
                # Don't schedule the periodic task if we can't set the config
                return

        # Kill existing greenlet if it exists before creating a new one
        if self._validate_setpoints_greenlet is not None:
            self._validate_setpoints_greenlet.kill()

        self._validate_setpoints_greenlet = self.core.periodic(
            config.setpoint_validate_frequency,
            lambda: self.set_temperature_setpoints(self.config_get('set_points'), update_store=False))

    def update_default_config(self, config: DefaultConfig):
        """
        Updates the configuration for the system.  This is called from the ManagerAgent when the configuration
        is updated.

        If not in test mode, the occupancy state check greenlet is killed and restarted with the new configuration.

        :param config: The new configuration for the system.
        :type config: DefaultConfig
        :return: None
        """

        if self.core is not None:
            if self._validate_occupancy_greenlet is not None:
                self._validate_occupancy_greenlet.kill()
            if self._validate_setpoints_greenlet is not None:
                self._validate_setpoints_greenlet.kill()

        self.cfg.update(config)

        self._validate_occupancy_greenlet = self.core.periodic(config.occupancy_validate_frequency,
                                                               self.sync_occupancy_state)
        gevent.spawn_later(1, self._set_default_setpoint, config)

    def set_location(self, data, update_store: bool = True) -> bool:
        try:
            if data:
                self.cfg.location = Location().update_location(data)
                if update_store:
                    self.config_set('location', data)
            return True
        except ValueError:
            _log.error(f'Invalid location passed for data: {data}')
            return False

    def set_schedule(self, data: dict[str, dict[str, str]], update_store: bool = True) -> bool:
        """
        Sets the schedule for the system.  There are no partial updates, the entire schedule
        is replaced if valid.  This function does the following:

        1. Validates the week of schedules.  Raises ValueError if invalid.
           (This is handled internally)

        2. Syncs the occupancy to the current day's schedule.

        3. Once the new state is set correctly then the schedule is stored.

        4. The new schedule is published to the message bus.

        5. True is returned.

        :param data:  schedule information for each day in week for RTU.
        :type data: dict
            {
                "Monday": {
                    "start": "6:30",
                    "end": "18:00"
                },
                "Tuesday": {
                    "start": "6:30",
                    "end": "18:00"
                },
                "Wednesday": {
                    "start": "6:30",
                    "end": "18:00"
                },
                "Thursday": {
                    "start": "6:30",
                    "end": "18:00"
                },
                "Friday": {
                    "start": "6:30",
                    "end": "18:00"
                },
                "Saturday": "always_off",
                "Sunday": "always_off"
            }
        :return: True when no errors occur and False if an error occurs.
        :rtype: bool
        """
        headers = {DATE: format_timestamp(get_aware_utc_now())}
        topic = '/'.join([self.cfg.base_record_topic, SCHEDULE])

        try:
            # Validate the schedule by creating a new schedule object for each
            # day of the new schedule. schedule in the loop below can be either
            # a dict or always_(on|off) string.
            for day, schedule in data.items():
                # This seems to be the best way to get a member from an enumeration
                # by string name.
                if isinstance(schedule, str):
                    # Set always on/off for the day
                    schedule = {schedule: True}

                Schedule(day=DaysOfWeek.__members__[day], get_current_datetime=self.cfg.get_current_datetime, **schedule)
        except ValueError:
            _log.debug(f'Invalid Schedule: {data}')
            return False

        self.cfg.schedule = data
        self.sync_occupancy_state()

        # Only publish directly if not updating from config store
        # to avoid duplicate publishes
        if update_store:
            self.config_set('schedule', data)
            # No need to publish here, as the config update will trigger another
            # call to this method with update_store=False
        else:
            self.publish(topic, headers, data)

        return True

    def set_optimal_start(self, config: OptimalStartConfig | dict, update_store: bool = True) -> bool:
        """
        Sets the optimal start for the system.  This is called from the ManagerAgent when the optimal start is updated.
        There are no partial updates, the entire optimal start is replaced.  This function does the following:


        :param config: Optimal start configuration :
        --
            latest_start_time: int
            earliest_start_time: int
            allowable_setpoint_deviation: float
            optimal_start_lockout_temperature: float = 30
            training_period_window: int = 10
        :type config: OptimalStartConfig | dict
        :param update_store: True when method is triggered via RPC (store data in config store).
        :type update_store: bool
        :return: Return True on success
        :rtype: bool
        """
        headers = {DATE: format_timestamp(get_aware_utc_now())}
        topic = '/'.join([self.cfg.base_record_topic, OPTIMAL_START])
        if isinstance(config, dict):
            config = OptimalStartConfig(**config)

        self.optimal_start.update_model_configurations(config)
        self.cfg.optimal_start.earliest_start_time = config.earliest_start_time \
            if config.earliest_start_time else self.cfg.optimal_start.earliest_start_time
        self.cfg.optimal_start.latest_start_time = config.latest_start_time \
            if config.latest_start_time else self.cfg.optimal_start.latest_start_time
        if update_store:
            self.config_set('optimal_start', config)
            # Config update will trigger another call with update_store=False
        else:
            self.publish(topic, headers=headers, message=config)
        return True

    def set_temperature_setpoints(self, data: dict[str, float], update_store: bool = True) -> Union[bool, str]:
        """
        Sets the temperature setpoints for the RTU. Sequential execution with reduced timeout overhead.

        :param data: RTU occupied and unoccupied heating and cooling set points.
        :type data: dict
        :param update_store: True when method is triggered via RPC (store data in config store).
        :type update_store: bool
        :return: Return True on success and False on failure or error.
        :rtype: bool
        """
        headers = {DATE: format_timestamp(get_aware_utc_now())}
        topic = '/'.join([self.cfg.base_record_topic, SET_POINTS])
        _log.debug(f'Update temperature_setpoints - {data} -- update_store: {update_store}')

        # Create setpoints
        result = self.create_setpoints(data)
        if isinstance(result, str):
            _log.error(f'Failed to create setpoints: {result}')
            return False

        # First pass: Set all regular values sequentially with error collection
        errors = []
        for point, value in result.items():
            try:
                _log.debug(f'Setting {point} to {value}')
                control_result = self.do_zone_control(point, value)
                if isinstance(control_result, str):
                    error_msg = f'Zone control response {self.identity} - Set {point} to {value} -- {control_result}'
                    _log.error(error_msg)
                    errors.append(error_msg)
            except Exception as ex:
                error_msg = f'Failed to set {point} to {value}: {ex}'
                _log.error(error_msg)
                errors.append(error_msg)

        # Check if any errors occurred
        if errors:
            _log.error(f'Errors occurred during setpoint configuration: {errors}')
            return False

        # If update_store is True, update config and set relinquishDefault values
        if update_store:
            try:
                self.config_set('set_points', data)

                # Second pass: Set relinquishDefault values
                errors_relinquish = []
                for point, value in result.items():
                    try:
                        _log.debug(f'Setting relinquishDefault for {point} to {value}')
                        control_result = self.do_zone_control(point, value, on_property='relinquishDefault')
                        if isinstance(control_result, str):
                            error_msg = f'Zone control response {self.identity} - Set relinquishDefault for {point} to {value} -- {control_result}'
                            _log.error(error_msg)
                            errors_relinquish.append(error_msg)
                    except Exception as ex:
                        error_msg = f'Failed to set relinquishDefault for {point} to {value}: {ex}'
                        _log.error(error_msg)
                        errors_relinquish.append(error_msg)

                if errors_relinquish:
                    _log.error(f'Errors occurred during relinquishDefault configuration: {errors_relinquish}')
                    return False

            except Exception as ex:
                _log.error(f'Failed to update config store: {ex}')
                return False

        # Only publish directly if not updating from config store
        # to avoid duplicate publishes
        if not update_store:
            # Publish the update
            self.publish(topic, headers=headers, message=data)
        _log.info(f'Successfully set temperature setpoints: {data}')
        return True

    def set_holidays(self, data, update_store: bool = True) -> bool:
        """
        Data dict from AEMS web UI with observed holidays.  RTU/HP is control as unoccupied on
        holidays.

        :param data: U.S. holidays from pandas holidays module can supply empty dictionary.
        Custom holidays require the day and month and observance is optional.

            {
                "Christmas": {},
                "Custom": {
                    "month": 12,
                    "day": 26,
                    "observance": "nearest_workday"
                }
            }

        :type data: dict
        :return: If successfully set without error return True, else False
        :rtype: Bool
        """
        headers = {DATE: format_timestamp(get_aware_utc_now())}
        topic = '/'.join([self.cfg.base_record_topic, HOLIDAYS])

        rules = self.holiday_manager.create_rules(data)
        self.holiday_manager.update_rules(rules)
        if update_store:
            self.config_set('holidays', data)
            # Config update will trigger another call with update_store=False
        else:
            self.publish(topic, headers, data)
        return True

    def set_occupancy_override(self, data: dict[str, list[dict]], update_store: bool = True) -> bool:
        """
        Data dict from AEMS web UI with occupancy overrides.  During unoccupied periods
        (i.e., weekends or holidays) user can set RTU/HP to occupied mode.

        :param data:
        :type data: dict
        :return: If successfully set without error return True, else False
        :rtype: Bool
        """
        _log.debug(f'{self.identity} - Scheduling occupancy override: {data}')
        headers = {DATE: format_timestamp(get_aware_utc_now())}
        topic = '/'.join([self.cfg.base_record_topic, OCC_OVERRIDE])

        self.occupancy_override.load_override(data)

        if self.config and update_store:
            self.config_set('occupancy_overrides', data)
            # Config update will trigger another call with update_store=False
        else:
            self.publish(topic, headers=headers, message=data)
        return True

    def set_configurations(self, data: dict[str, float | int], update_store: bool = True) -> bool:
        """
        Data dict from AEMS web UI with RTU control and configuration parameters.
        :param data:
        :type data:
        :return:
        :rtype:
        """
        _log.debug(f'{self.identity} - set RTU configurations: {data}')
        headers = {DATE: format_timestamp(get_aware_utc_now())}
        topic = '/'.join([self.cfg.base_record_topic, CONFIGURATIONS])

        self.lockout_manager.update_configuration(**data)
        if update_store:
            self.config_set('control', data)
            # Config update will trigger another call with update_store=False
        else:
            self.publish(topic, headers=headers, message=data)
        return True

    def create_setpoints(self, setpoints: dict[str, float]) -> Union[dict[str, float], str]:
        """
        Create setpoints for RTU/HP based on configuration.

        setpoints must contain the following keys:
            - UnoccupiedHeatingSetPoint
            - UnoccupiedCoolingSetPoint
            - DeadBand
            - OccupiedSetPoint

        :param setpoints: Setpoints from AEMS web UI.
        :type setpoints: dict
        :return: Setpoints for RTU/HP
        :rtype: dict
        """
        control = {}
        try:
            unocc_clg_sp = float(setpoints[Points.unoccupiedcoolingsetpoint.value])
            unocc_htg_sp = float(setpoints[Points.unoccupiedheatingsetpoint.value])
            deadband = float(setpoints[Points.deadband.value])
            occ_sp = float(setpoints[Points.occupiedsetpoint.value])
            occ_clg_sp = occ_sp + deadband
            occ_htg_sp = occ_sp - deadband
        except KeyError:
            result = f'UI Point names do not match standard point names!\n{setpoints}'
            _log.error(f'{result}', exc_info=True)
            return result

        control[Points.unoccupiedcoolingsetpoint.value] = unocc_clg_sp
        control[Points.unoccupiedheatingsetpoint.value] = unocc_htg_sp
        _log.debug(f'Configure setpoints: {self.cfg.setpoint_control}')

        if self.cfg.setpoint_control == SetpointControlType.AttachedSetpoint:
            control[Points.deadband.value] = deadband + deadband
            control[Points.coolingsetpoint.value] = occ_clg_sp
        if self.cfg.setpoint_control == SetpointControlType.DetatchedSetpoint:
            control[Points.coolingsetpoint.value] = occ_clg_sp
            control[Points.heatingsetpoint.value] = occ_htg_sp
        if self.cfg.setpoint_control == SetpointControlType.CommonSetpoint:
            control[Points.occupiedsetpoint.value] = occ_sp
            control[Points.deadband.value] = deadband

        return control

    def sync_occupancy_state(self):
        """
        Check current occupancy state and based on configured schedule/holidays modify if needed.
        :return: None
        :rtype:
        """
        _log.debug("===== Sync Occupancy State Started =======")

        # Initialize variables that will be used in finally block
        is_occupied = None
        is_holiday = None
        current_schedule = None
        current_time = None

        try:
            is_occupied = self.is_system_occupied()
            if isinstance(is_occupied, str):
                _log.error(f'❌ {self.identity} - Error getting occupancy state: {is_occupied}')
                _log.error(f'❌ {self.identity} - cannot sync to occupancy state')
                return
            if is_occupied is False:
                _log.info(f'🔒 {self.identity} - System is unoccupied')
            else:
                _log.info(f'🔓 {self.identity} - System is occupied')

            if is_occupied is None:
                _log.warning(f'⚠️ {self.identity} - Unknown occupancy state!')
                _log.warning(f'⚠️ {self.identity} - attempting to sync to correct occupancy state')

            _log.debug(f'{self.identity} - Syncing occupancy state override is {self.occupancy_override.current_id}')
            if self.occupancy_override.current_id is not None:
                if not is_occupied:
                    _log.debug(f'{self.identity} - override active but system is unoccupied!')
                    data = self.config_get('occupancy_overrides')
                    self.occupancy_override.load_override(data)
                return

            if self.lockout_manager.optimal_start_lockout_active:
                if not is_occupied:
                    _log.debug(
                        f'{self.identity} - low temperature optimal start lockout is active but system is unoccupied!')
                    self.lockout_manager.evaluate_optimal_start_lockout()
                return

            # what if current_schedule is None
            current_schedule = self.cfg.get_current_day_schedule()
            current_time = self.cfg.get_current_time()
            is_holiday = self.holiday_manager.is_holiday(dt.now())

            _log.debug(f'{self.identity} - current day is holiday: {is_holiday}\n{current_schedule} -- current_time: {current_time}')
            if is_holiday:
                if is_occupied or is_occupied is None:
                    _log.debug('Unit is in occupied mode but should be unoccupied! -- holiday')
                    self.change_occupancy(OccupancyTypes.UNOCCUPIED)
                return
            if current_schedule.is_always_off():
                _log.debug('Unit is set to always_off')
                if is_occupied or is_occupied is None:
                    _log.debug('Unit is in occupied mode but should be unoccupied! -- always_off')
                    self.change_occupancy(OccupancyTypes.UNOCCUPIED)
                return
            if current_schedule.is_always_on():
                _log.debug('Unit is set to always_on')
                if not is_occupied or is_occupied is None:
                    _log.debug('Unit is in unoccupied mode but should be occupied! -- always_on')
                    self.change_occupancy(OccupancyTypes.OCCUPIED)
                return

            _start = current_schedule.start
            _end = current_schedule.end
            _earliest = current_schedule.earliest_start

            # Change current control to match occupancy schedule
            if _start < current_time < _end and (not is_occupied or is_occupied is None):
                _log.debug('Unit is in unoccupied mode but should be occupied! -- _start < current_time < _end')
                self.change_occupancy(OccupancyTypes.OCCUPIED)
                e_hour = _end.hour
                e_minute = _end.minute
                unoccupied_time = dt.now().replace(hour=e_hour, minute=e_minute)
                _log.debug(f'Scheduling unoccupied time at {unoccupied_time}')
                self.end_obj = self.core.schedule(unoccupied_time, self.change_occupancy, OccupancyTypes.UNOCCUPIED)
            if current_time >= _end and (is_occupied or is_occupied is None):
                _log.debug('Unit is in occupied mode but should be unoccupied! -- current_time >= _end')
                self.change_occupancy(OccupancyTypes.UNOCCUPIED)
            if current_time < _earliest and (is_occupied or is_occupied is None):
                _log.debug('Unit is in occupied mode but should be unoccupied! -- current_time < _earliest')
                self.change_occupancy(OccupancyTypes.UNOCCUPIED)
            if _earliest <= current_time <= _start and is_occupied is None:
                _log.debug(f'Unit is between earliest start time and occupancy start!')
                _log.debug(f'Set unit to unoccupied mode and restart optimal start')
                self.change_occupancy(OccupancyTypes.UNOCCUPIED)
                self.optimal_start.run_schedule = None

            # # if we are in a time when we can do optimal start, schedule pre-start calculations
            if self.optimal_start.run_schedule is None:
                if current_time < _earliest:
                    self.optimal_start.set_up_run()
                elif _earliest <= current_time <= _start:
                    self.optimal_start.run_method()

        finally:
            # Always print comprehensive system state table, even if we returned early
            # The table function will grab current values directly from system state
            self._print_system_state_table()

    def _get_schedule_override_status(self, current_schedule, current_time, is_holiday, is_occupied):
        """
        Determine if we're in a schedule override situation.

        :param current_schedule: Current day's schedule
        :param current_time: Current time
        :param is_holiday: Whether today is a holiday
        :param is_occupied: Current occupancy status
        :return: String describing override status or None
        """
        if not current_schedule or current_time is None:
            return None

        # Check if we have an active occupancy override
        has_override = self.occupancy_override.current_id is not None

        if not has_override:
            return None

        # Determine what the "normal" state should be
        normal_state_occupied = None

        if is_holiday:
            normal_state_occupied = False
            reason = "holiday"
        elif current_schedule.is_always_off():
            normal_state_occupied = False
            reason = "always off schedule"
        elif current_schedule.is_always_on():
            normal_state_occupied = True
            reason = "always on schedule"
        else:
            # Regular schedule - check if current time is within occupied hours
            _start = current_schedule.start
            _end = current_schedule.end

            if _start and _end and _start < current_time < _end:
                normal_state_occupied = True
                reason = "scheduled occupied time"
            else:
                normal_state_occupied = False
                reason = "scheduled unoccupied time"

        # If we have an override and the current state differs from normal
        if normal_state_occupied is not None and is_occupied != normal_state_occupied:
            if is_occupied and not normal_state_occupied:
                return f"🔓 OVERRIDE: Occupied during {reason}"
            elif not is_occupied and normal_state_occupied:
                return f"🔒 OVERRIDE: Unoccupied during {reason}"

        return None

    def _print_system_state_table(self):
        """Print a comprehensive table of the current system state."""
        from tabulate import tabulate

        # Gather current system state information directly from the same sources
        try:
            is_occupied = self.is_system_occupied()
        except Exception:
            is_occupied = "ERROR"

        try:
            current_schedule = self.cfg.get_current_day_schedule()
            current_time = self.cfg.get_current_time()
        except Exception:
            current_schedule = None
            current_time = None

        try:
            is_holiday = self.holiday_manager.is_holiday(dt.now())
        except Exception:
            is_holiday = None
        table_data = []

        # Basic State Information
        table_data.append(["═" * 30, "═" * 50])
        table_data.append(["SYSTEM STATE", ""])
        table_data.append(["─" * 30, "─" * 50])
        table_data.append(["Current Time", current_time.strftime("%H:%M:%S")])
        table_data.append(["Occupancy Status", "🔓 OCCUPIED" if is_occupied else "🔒 UNOCCUPIED"])
        table_data.append(["Holiday Status", f"{'🎄 YES' if is_holiday else '❌ NO'}"])
        table_data.append(["Override Active", f"{self.occupancy_override.current_id if self.occupancy_override.current_id else 'None'}"])
        table_data.append(["Optimal Start Lockout", "🔒 ACTIVE" if self.lockout_manager.optimal_start_lockout_active else "❌ INACTIVE"])

        # Check if we're in a schedule override situation
        schedule_override_status = self._get_schedule_override_status(current_schedule, current_time, is_holiday, is_occupied)
        if schedule_override_status:
            table_data.append(["Schedule Override", schedule_override_status])

        # Schedule Information
        table_data.append(["", ""])
        table_data.append(["SCHEDULE INFO", ""])
        table_data.append(["─" * 30, "─" * 50])
        if current_schedule:
            if current_schedule.is_always_on():
                table_data.append(["Schedule Mode", "ALWAYS ON"])
            elif current_schedule.is_always_off():
                table_data.append(["Schedule Mode", "ALWAYS OFF"])
            else:
                table_data.append(["Schedule Start", current_schedule.start.strftime("%H:%M") if current_schedule.start else "N/A"])
                table_data.append(["Schedule End", current_schedule.end.strftime("%H:%M") if current_schedule.end else "N/A"])
                table_data.append(["Earliest Start", current_schedule.earliest_start.strftime("%H:%M") if current_schedule.earliest_start else "N/A"])

        # Temperature Settings
        table_data.append(["", ""])
        table_data.append(["TEMPERATURE SETTINGS", ""])
        table_data.append(["─" * 30, "─" * 50])

        # Get current temperature data if available
        if hasattr(self, 'data') and self.data:
            zone_temp = self.data.get(Points.zonetemperature.value, "N/A")
            outdoor_temp = self.data.get(Points.outdoorairtemperature.value, "N/A")
            table_data.append(["Zone Temperature", f"{zone_temp}°F" if zone_temp != "N/A" else "N/A"])
            table_data.append(["Outdoor Temperature", f"{outdoor_temp}°F" if outdoor_temp != "N/A" else "N/A"])

        # Setpoints from config store
        try:
            setpoints_config = self.config_get('set_points')
            if setpoints_config:
                table_data.append(["Occupied Setpoint", f"{setpoints_config.get('OccupiedSetPoint', 'N/A')}°F"])
                table_data.append(["Unoccupied Heat", f"{setpoints_config.get('UnoccupiedHeatingSetPoint', 'N/A')}°F"])
                table_data.append(["Unoccupied Cool", f"{setpoints_config.get('UnoccupiedCoolingSetPoint', 'N/A')}°F"])
                table_data.append(["Deadband", f"{setpoints_config.get('DeadBand', 'N/A')}°F"])
            else:
                table_data.append(["Setpoints", "❌ NOT CONFIGURED"])
        except (KeyError, Exception):
            table_data.append(["Setpoints", "❌ ERROR LOADING"])

        # Control States
        table_data.append(["", ""])
        table_data.append(["CONTROL STATES", ""])
        table_data.append(["─" * 30, "─" * 50])

        if hasattr(self, 'lockout_manager'):
            table_data.append(["Electric Heat Lockout",
                              "🔒 ACTIVE" if self.lockout_manager.electric_heat_lockout_active else "✅ ALLOWED"])
            table_data.append(["Cooling Lockout",
                              "🔒 ACTIVE" if self.lockout_manager.clg_lockout_active else "✅ ALLOWED"])
            table_data.append(["Optimal Start Lockout",
                              "🔒 ACTIVE" if self.lockout_manager.optimal_start_lockout_active else "✅ ALLOWED"])

        if hasattr(self, 'optimal_start'):
            table_data.append(["Optimal Start", "🚀 SCHEDULED" if self.optimal_start.run_schedule else "⏸️ IDLE"])

        table_data.append(["═" * 30, "═" * 50])

        # Print the table
        table_str = tabulate(table_data, headers=["Parameter", "Value"], tablefmt="simple")
        _log.info(f"\n{table_str}\n")

    def update_data(self, peer, sender, bus, topic, header, message):
        """
        Update RTU data from driver publish for optimal start, lockout control, and
        economizer control.
        :param peer:
        :type peer:
        :param sender:
        :type sender:
        :param bus:
        :type bus:
        :param topic:
        :type topic:
        :param header:
        :type header:
        :param message:
        :type message:
        :return:
        :rtype:
        """
        _log.debug(f'Update data : {topic}')
        data, meta = message
        self.data_handler.update_data(data, header)
        self.lockout_manager.evaluate()

    def update_custom_data(self, peer, sender, bus, topic, header, message):
        """
        Update RTU data from driver publish for optimal start, lockout control, and
        economizer control.
        :param peer:
        :type peer:
        :param sender:
        :type sender:
        :param bus:
        :type bus:
        :param topic:
        :type topic:
        :param header:
        :type header:
        :param message:
        :type message:
        :return:
        :rtype:
        """
        _log.debug(f'Update data : {topic}')
        payload = {}
        data, meta = message
        if Points.outdoortemperature.value in data:
            payload[Points.outdoortemperature.value] = data[Points.outdoortemperature.value]
        self.data_handler.update_data(payload, header)

    def is_system_occupied(self) -> bool | str | None:
        """
        Call driver get_point to get current RTU occupancy status.
        :return:
        :rtype:
        """
        try:
            result = self.rpc_get_point(Points.occupancy.value)
            occupied_value = self.cfg.occupancy_values[OccupancyTypes.OCCUPIED.value]
            unoccupied_value = self.cfg.occupancy_values[OccupancyTypes.UNOCCUPIED.value]
            if result == occupied_value:
                return True
            if result == unoccupied_value:
                return False
        except (RemoteError, gevent.Timeout) as ex:
            _log.warning('Failed to get {}: {}'.format(self.cfg.system_rpc_path, str(ex)))
            return str(ex)
        return None

    def do_zone_control(self, point, value, on_property=None):
        """
        Makes RPC call to actuator agent to change zone control when zone transition to occupied
            or unoccupied mode.
        :param point: Driver name for point
        :type point: str
        :return:
        """
        try:
            # FIX THIS FOR ROBERT
            result = self.rpc_set_point(point=point, value=value, on_property=on_property)
        except TimeoutError as ex:
            _log.warning(f'Failed to set {self.cfg.system_rpc_path} - {point}  -- to {value}: {str(ex)}', exc_info=True)
            return str(ex)
        except (gevent.Timeout, RemoteError) as ex:
            _log.warning(f'Failed to set {self.cfg.system_rpc_path} - {point}  -- to {value}: {str(ex)}', exc_info=True)
            return str(ex)
        return result

    def change_occupancy(self, state: OccupancyTypes):
        """
        Change RTU occupancy state.

        Makes RPC call to actuator agent to change zone control when zone transitions to occupied/unoccupied mode.

        :param state: str; occupied or unoccupied
        :type state: str
        :return: True if successful, else False
        """

        if isinstance(state, str):
            _log.debug(f'🔄 Converting string occupancy state "{state}" to enum type')
            state = OccupancyTypes[state.upper()]

        # Based upon the values in the configuration, set the occupancy state.
        if state.value in self.cfg.occupancy_values:
            new_occupancy_state = self.cfg.occupancy_values[state.value]
        else:
            new_occupancy_state = state.value

        try:
            _log.info(f'🔑 Changing occupancy state to {state.name} ({new_occupancy_state})')
            result = self.rpc_set_point(Points.occupancy.value, new_occupancy_state)
            _log.info(f'✅ Successfully set occupancy to {state.name}')
        except RemoteError as ex:
            _log.error(f'❌ {self.identity} - Failed to set {self.cfg.system_rpc_path} to {state.value}: {ex}')
            return str(ex)
        return result

    def start_precontrol(self):
        """
        Makes RPC call to driver agent to enable any pre-control
        actions needed for optimal start.
        :return:
        :rtype:
        """
        result = None
        for topic, value in self.precontrols.items():
            try:
                _log.debug('Do pre-control: {} -- {}'.format(topic, value))
                result = self._p.vip.rpc.call(self.cfg.actuator_identity, 'set_point', topic, value).get(timeout=TIMEOUT_FROM_PEER)
            except RemoteError as ex:
                _log.warning('Failed to set {} to {}: {}'.format(topic, value, str(ex)))
                continue
        self.precontrol_flag = True
        return result

    def end_precontrol(self):
        """
        Makes RPC call to driver agent to end pre-control
        actions needed for optimal start.
        :return:
        :rtype:
        """
        result = None
        for topic, value in self.precontrols.items():
            try:
                _log.debug('Do pre-control: {} -- {}'.format(topic, 'None'))
                result = self._p.vip.rpc.call(self.cfg.actuator_identity, 'set_point', 'optimal_start', topic,
                                              None).get(timeout=TIMEOUT_FROM_PEER)
            except RemoteError as ex:
                _log.warning('Failed to set {} to {}: {}'.format(topic, value, str(ex)))
                continue
        return result

    def update_weather_forecast(self):
        """
        Updates the weather forecast by retrieving hourly weather data from a Weather service.

        The method fetches weather data through an RPC call to a specified weather service identity.
        It processes the data to extract and parse the forecast information,
        converting timestamps to the configured timezone and retrieving relevant temperature details.
        """
        def parse_rpc_data(weather_results):
            weather_data = []
            for oat in weather_results:
                weather_data.append((parser.parse(oat[0]).astimezone(self.cfg.timezone), oat[1]['temperature']))
            _log.debug(f'Parsed WEATHER forecast: {weather_data}')
            return weather_data

        for x in range(10):
            try:
                _log.debug(f'Fetching WEATHER forecast from {self.cfg.weather_identity} -- from {self.cfg.location.__asdict__()}')
                result = self._p.vip.rpc.call(self.cfg.weather_identity, 'get_hourly_forecast',
                                              [self.cfg.location.__asdict__()]).get(timeout=TIMEOUT_FROM_PEER)
                _log.debug(f'Weather data {result}')
                self.weather_forecast = parse_rpc_data(result[0]['weather_results'])
                break

            except (gevent.Timeout, RemoteError) as ex:
                _log.warning(f'Call to {self.cfg.weather_identity} for {self.cfg.location} failed: {ex}')
                gevent.sleep(5)
            except KeyError as ex:
                _log.error(f'No weather results: {ex}')
                break

    def get_weather_forecast(self):
        if not self.weather_forecast and self._weather_update_greenlet is not None:
            if self.cfg.location:
                self.update_weather_forecast()
            else:
                self.weather_forecast = []

        return self.validate_weather_forecast()

    def get_current_oat(self):
        return self.data_handler.get_current_oat()

    def validate_weather_forecast(self):
        outdoor_temperature_forecast = []
        for _dt, oat in self.weather_forecast:
            if _dt >= get_aware_utc_now():
                outdoor_temperature_forecast.append(oat)
        return outdoor_temperature_forecast


def main(argv=sys.argv):
    """Main method called by the aip."""

    # Display a colorful banner for the agent start
    print(f"{colorama.Fore.GREEN}╔════════════════════════════════════════════╗{colorama.Style.RESET_ALL}")
    print(f"{colorama.Fore.GREEN}║  Starting AEMS Manager Agent               ║{colorama.Style.RESET_ALL}")
    print(f"{colorama.Fore.GREEN}╚════════════════════════════════════════════╝{colorama.Style.RESET_ALL}")

    if run_agent:
        run_agent(ManagerProxy)
    else:
        try:
            utils.vip_main(ManagerProxy)
        except Exception as exception:
            _log.exception(f'{colorama.Fore.RED}Unhandled exception in main{colorama.Style.RESET_ALL}')
            _log.error(repr(exception))


if __name__ == '__main__':
    # Entry point for script
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        pass
