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

import json
import logging
from datetime import datetime as dt
from datetime import timedelta as td

import numpy as np
from volttron.platform.agent.utils import format_timestamp, get_aware_utc_now
from volttron.platform.scheduling import cron

from . import DefaultConfig, OptimalStartConfig
from .data_utils import Data
from .holiday_manager import HolidayManager
from .optimal_start_models import Carrier, Johnson, Sbs, Siemens
from .points import OccupancyTypes
from .utils import get_cls_attrs

_log = logging.getLogger(__name__)

OPTIMAL_START = 'OptimalStart'
OPTIMAL_START_MODEL = 'OptimalStartModel'
OPTIMAL_START_TIME = 'OptimalStartTimes'
MODELS = {'j': Johnson, 's': Siemens, 'c': Carrier, 'sbs': Sbs}
CONFIG_STORE = 'optimal_start.models'
NUMBER_TYPE = (int, float, complex)


class OptimalStartManager:
    """
    Manages model storage and training, scheduling, and running optimal start.
    """

    def __init__(self, *, schedule: dict[str:dict[str, str]], config: DefaultConfig, identity: str,
                 config_get_fn: callable, scheduler_fn: callable, change_occupancy_fn: callable,
                 holiday_manager: HolidayManager, data_handler: Data, publish_fn: callable, config_set_fn: callable):
        """
        Manages the optimal start time for a device.

        :param schedule: A dictionary containing the schedule.
        :type schedule: dict[str:dict[str, str]]
        :param config: The default configuration.
        :type config: DefaultConfig
        :param identity: The identity string.
        :type identity: str
        :param config_get_fn: A callable for getting the configuration.
        :type config_get_fn: callable
        :param scheduler_fn: A callable for scheduling.
        :type scheduler_fn: callable
        :param change_occupancy_fn: A callable for changing occupancy.
        :type change_occupancy_fn: callable
        :param holiday_manager: The holiday manager.
        :type holiday_manager: HolidayManager
        :param data_handler: The data handler.
        :type data_handler: Data
        :param publish_fn: A callable for publishing.
        :type publish_fn: callable
        :param config_set_fn: A callable for setting the configuration.
        :type config_set_fn: callable
        """
        self.models = {}
        self.weekend_holiday_models = {}
        self.result = {}
        self.run_schedule = None
        self.training_time = None
        self.schedule = schedule
        self.config = config
        self.model_dir = config.model_dir
        self.device = config.system
        self.identity = identity

        self.weekend_holiday_trained = False
        self.base_record_topic = config.base_record_topic

        self.earliest_start_time = config.optimal_start.earliest_start_time
        self.latest_start_time = config.optimal_start.latest_start_time

        self.holiday_manager = holiday_manager
        self.data_handler = data_handler
        self.scheduler_fn = scheduler_fn
        self.change_occupancy_fn = change_occupancy_fn
        self.scheduler_greenlets = []
        self.publish_fn = publish_fn
        self.config_set_fn = config_set_fn
        self.config_get_fn = config_get_fn
        # Set and canceled in run_method.
        self.start_obj = None
        self.end_obj = None

    def setup_optimal_start(self):
        """
        Set up optimal start by loading models and scheduling.

        :return: None
        :rtype: None
        """
        self.models = self.load_models(self.config.optimal_start)
        self.weekend_holiday_models = self.load_models(self.config.optimal_start, weekend=True)
        if self.scheduler_greenlets is not None:
            for greenlet in self.scheduler_greenlets:
                greenlet.kill()
        self.scheduler_greenlets = []
        self.scheduler_greenlets.append(self.scheduler_fn(cron('1 0 * * *'), self.set_up_run))
        self.scheduler_greenlets.append(self.scheduler_fn(cron('0 9 * * *'), self.train_models))

    def update_model_configurations(self, config: OptimalStartConfig) -> None:
        """
        Receives configuration parameters for optimal start from config store callback.

        :param config: Optimal start configuration parameters
        """
        for tag, cls in self.models.items():
            cls.update_config(config)
        for tag, cls in self.weekend_holiday_models.items():
            cls.update_config(config)
        # Update the earliest and latest start-time for the optimal start manager
        self.latest_start_time = config.latest_start_time
        self.earliest_start_time = config.earliest_start_time
        _log.debug(f'OPTIMAL START -- earliest_start_time: {self.earliest_start_time} - latest_start_time: {self.latest_start_time}')

    def set_up_run(self):
        """
        Run based daily based on cron schedule.  This method calculates the earliest start time
        and schedules the run_method.

        :return:
        :rtype:
        """
        current_schedule = self.config.get_current_day_schedule()
        is_holiday = self.holiday_manager.is_holiday(dt.now())
        try:
            if current_schedule:
                if current_schedule == 'always_off' or is_holiday:
                    self.change_occupancy_fn(OccupancyTypes.UNOCCUPIED)
                elif current_schedule == 'always_on':
                    self.change_occupancy_fn(OccupancyTypes.OCCUPIED)
                else:
                    earliest = current_schedule.earliest_start
                    if earliest:
                        e_hour = earliest.hour
                        e_minute = earliest.minute
                        run_time = dt.now().replace(hour=e_hour, minute=e_minute)
                        _log.debug('Schedule run method: %s', format_timestamp(run_time))
                        self.run_schedule = self.scheduler_fn(run_time, self.run_method)
        except Exception as ex:
            _log.debug('Error setting up optimal start run: %s', ex)
        finally:
            self.data_handler.process_data()

    def get_start_time(self):
        """
        Get optimal start time from active controller

        :return:
        :rtype:
        """
        try:
            start_times = [value for value in self.result.values() if isinstance(value, NUMBER_TYPE)]
            active_minutes = np.median(start_times)
            _log.debug(f'OPTIMAL START - start_times: {self.result} -- median: {active_minutes}')
        except Exception as ex:
            _log.debug(f'OPTIMAL START ERROR - start_times: {self.result} -- error: {ex}')
            active_minutes = self.earliest_start_time
        return max(self.latest_start_time, min(active_minutes, self.earliest_start_time))

    def is_weekend_holiday(self):
        """
        Check if previous day was a weekend or holiday for model training.

        :return: True if previous day was weekend or holiday False otherwise
        :rtype: bool
        """
        yesterday = dt.now() - td(days=1)
        yesterday_holiday = self.holiday_manager.is_holiday(yesterday)
        yesterday_weekend = yesterday.weekday() >= 5
        return yesterday_holiday or yesterday_weekend

    def run_method(self):
        """
        Run at the earliest start time for the day.  Use models to calculate needed
        prestart time to meet room temperature requirements.

        :return:
        :rtype:
        """
        self.result = {}
        current_schedule = self.config.get_current_day_schedule()
        if not current_schedule:
            _log.debug(f'{self.identity } - no schedule configured returned for current day!')
            return
        start = current_schedule.start
        end = current_schedule.end
        s_hour = start.hour
        s_minute = start.minute
        e_hour = end.hour
        e_minute = end.minute
        occupancy_time = dt.now().replace(hour=s_hour, minute=s_minute, microsecond=0)
        unoccupied_time = dt.now().replace(hour=e_hour, minute=e_minute, microsecond=0)

        # If previous day was weekend or holiday and holiday models exist
        # calculate optimal start time using weekend/holiday models.
        if self.is_weekend_holiday() and self.weekend_holiday_trained:
            models = self.weekend_holiday_models
        else:
            models = self.models

        for tag, model in models.items():
            data = self.data_handler.df.fillna(method='ffill')
            try:
                optimal_start_time = model.calculate_prestart(data)
            except Exception as ex:
                _log.debug(f'{self.identity} - Error for optimal start: {tag} -- {ex}')
                continue
            self.result[tag] = optimal_start_time

        self.result['occupancy'] = format_timestamp(occupancy_time)
        active_minutes = self.get_start_time()
        _log.debug(f'OPTIMAL START -- return value: {active_minutes}')
        self.training_time = active_minutes
        optimal_start_time = occupancy_time - td(minutes=active_minutes)
        reschedule_time = dt.now().replace(microsecond=0) + td(minutes=15)
        if self.run_schedule is not None:
            self.run_schedule.cancel()

        if reschedule_time < optimal_start_time:
            _log.debug('Reschedule run method!')
            self.run_schedule = self.scheduler_fn(reschedule_time, self.run_method)
            return

        _log.debug(f'{self.identity} -- optimal start time: {active_minutes} -- result: {self.result}')
        headers = {'Date': format_timestamp(get_aware_utc_now())}
        topic = '/'.join([self.base_record_topic, OPTIMAL_START_TIME])
        self.publish_fn(topic, headers, self.result)
        if self.start_obj is not None:
            self.start_obj.cancel()
            self.start_obj = None
        if self.end_obj is not None:
            self.end_obj.cancel()
            self.end_obj = None

        self.start_obj = self.scheduler_fn(optimal_start_time, self.change_occupancy_fn, OccupancyTypes.OCCUPIED)
        self.end_obj = self.scheduler_fn(unoccupied_time, self.change_occupancy_fn, OccupancyTypes.UNOCCUPIED)

    def load_models(self, config: OptimalStartConfig, weekend=False):
        """
        Create or load model from the config store.

        :param config:
        :type config:
        :param weekend:
        :type weekend:
        :return:
        :rtype: Class Model
        """
        models = {}
        if weekend:
            config.training_period_window = 5
        for name, cls in MODELS.items():
            tag = '_'.join([name, 'we']) if weekend else name
            obj = cls(config, self.config.get_current_day_schedule)
            load_tag = '.'.join([CONFIG_STORE, tag])
            try:
                cls_attrs = self.config_get_fn(load_tag)
                obj.load_model(cls_attrs)
            except KeyError as ex:
                _log.debug(f'{self.identity}: config not in store: {tag} - {ex}')
            models[tag] = obj
        return models

    def train_models(self):
        """
        Run daily after startup to update model coefficients.
        Save each model class as a pickle to allow saving state.
         - train each model with morning startup data.
         - Save model as pickle on disk for saving state.

        :return:
        :rtype:
        """
        training_time = int(self.training_time) + 5 if self.training_time else None
        data = self.data_handler.df.fillna(method='ffill')
        models = self.models
        if self.is_weekend_holiday():
            models = self.weekend_holiday_models
            self.weekend_holiday_trained = True

        for tag, model in models.items():
            try:
                model.train(data, training_time)
            except Exception as ex:
                _log.debug(f'{self.identity} - ERROR training model {tag}: -- {ex}')
                continue
            try:
                cls_attrs = get_cls_attrs(model)
                cls_attrs.pop('cfg')
                store_tag = '.'.join([CONFIG_STORE, tag])
                self.config_set_fn(store_tag, cls_attrs)
                _file = self.model_dir / f'{self.device}_{tag}.json'
                with open(_file, 'w') as fp:
                    json.dump(cls_attrs, fp, indent=4)
            except Exception as ex:
                _log.debug(f'{self.identity} - Could not store object {tag} -- {ex}')
            try:
                record = model.record
                _log.debug(f'{self.identity}: MODEL parameters: {record}')
                if record:
                    headers = {'Date': format_timestamp(get_aware_utc_now())}
                    topic = '/'.join([self.base_record_topic, OPTIMAL_START_MODEL, tag])
                    self.publish_fn(topic, headers, record)
            except Exception as ex:
                _log.debug(f'{self.identity} - ERROR publishing optimal start model information: {ex}')
                continue
