# -*- coding: utf-8 -*-
# ===----------------------------------------------------------------------===
#
#                 AEMS Application — Optimal Start Manager
#
# ===----------------------------------------------------------------------===
#
# Copyright 2026 Battelle Memorial Institute
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

from __future__ import annotations

import copy
import json
import logging
from dataclasses import dataclass
from datetime import timedelta as td
from typing import Any, Callable, Optional

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


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Available model implementations keyed by short tag
_MODEL_REGISTRY: dict[str, type] = {
    "j": Johnson,
    "s": Siemens,
    "c": Carrier,
    "sbs": Sbs,
}

# Config store key prefix for persisted model coefficients
_CONFIG_STORE_PREFIX = "optimal_start.models"

# Topic path segments for publishing
_TOPIC_MODEL = "OptimalStartModel"
_TOPIC_START_TIMES = "OptimalStartTimes"

# Cron expressions for daily scheduling
_CRON_DAILY_SETUP = "1 0 * * *"     # 00:01 — determine today's schedule
_CRON_DAILY_TRAINING = "0 9 * * *"  # 09:00 — train models with morning data

# Run-method rescheduling interval when it is too early to commit
_RESCHEDULE_INTERVAL_MINUTES = 15

# Buffer added to observed pre-start time before passing it to training
_TRAINING_TIME_BUFFER_MINUTES = 5

# Weekend / holiday models use a shorter rolling window
_WEEKEND_TRAINING_WINDOW = 4

# Types accepted as valid numeric start-time predictions
_NUMERIC_TYPES = (int, float)


@dataclass(frozen=True)
class PlatformCallbacks:
    """
    Represents a collection of platform callback functions.

    This class is a frozen dataclass that encapsulates various callback functions
    essential for platform operations. It provides a structured way to manage and
    use these callbacks, ensuring they are easily accessible and immutable once
    set. Each callback corresponds to a specific operation the platform may need
    to perform, such as scheduling tasks, changing occupancy states, publishing
    data, or managing configurations.

    :ivar schedule_fn: Callback function for scheduling tasks or operations.
    :type schedule_fn: Callable
    :ivar change_occupancy_fn: Callback function for changing occupancy states.
    :type change_occupancy_fn: Callable
    :ivar publish_fn: Callback function responsible for publishing data or events.
    :type publish_fn: Callable
    :ivar config_get_fn: Callback function to retrieve configuration settings.
    :type config_get_fn: Callable
    :ivar config_set_fn: Callback function to set or update configuration settings.
    :type config_set_fn: Callable
    """

    schedule_fn: Callable
    change_occupancy_fn: Callable
    publish_fn: Callable
    config_get_fn: Callable
    config_set_fn: Callable


class OptimalStartManager:
    """
    Manages the optimal start scheduling and model training process for a facility.

    The class is responsible for dynamically determining the optimal start times
    based on the facility's schedule, configuring models, and training them with
    new data. It interacts with external dependencies, manages daily scheduling
    tasks, and ensures proper transitions between occupied and unoccupied states.

    :ivar identity: Unique identity string for the manager.
    :type identity: str
    :ivar config: Configuration setup for the optimal start manager.
    :type config: DefaultConfig
    :ivar schedule: Scheduling data indicating planned activities.
    :type schedule: dict[str, dict[str, str]]
    :ivar model_dir: Directory path for storing/loading persisted models.
    :type model_dir: str
    :ivar device: The device or system configuration where the program operates.
    :type device: str
    :ivar base_record_topic: Base topic for recording data.
    :type base_record_topic: str
    :ivar earliest_start_time: Earliest time to start based on the optimal-start configuration.
    :type earliest_start_time: float
    :ivar latest_start_time: Latest time to start based on the optimal-start configuration.
    :type latest_start_time: float
    :ivar holiday_manager: Manager for handling holidays and special scheduling logic.
    :type holiday_manager: HolidayManager
    :ivar data_handler: Handles data processing and retrieval operations.
    :type data_handler: Data
    :ivar _cb: Callbacks and handlers for platform-related operations.
    :type _cb: PlatformCallbacks
    :ivar models: Collection of models for regular scheduling logic.
    :type models: dict[str, Any]
    :ivar weekend_holiday_models: Models specific to weekends and holidays.
    :type weekend_holiday_models: dict[str, Any]
    :ivar weekend_holiday_trained: Indicates whether weekend/holiday models have been trained.
    :type weekend_holiday_trained: bool
    :ivar result: Stores results of model evaluations.
    :type result: dict[str, Any]
    :ivar training_time: Duration, in minutes, used for training the models.
    :type training_time: Optional[float]
    :ivar _scheduler_greenlets: Internal list to manage daily scheduling greenlets.
    :type _scheduler_greenlets: list
    :ivar run_schedule_greenlet: Greenlet for managing daily runs.
    :type run_schedule_greenlet: Optional[Any]
    :ivar _start_greenlet: Greenlet for start transitions.
    :type _start_greenlet: Optional[Any]
    :ivar _end_greenlet: Greenlet for end transitions.
    :type _end_greenlet: Optional[Any]
    """

    def __init__(
        self,
        *,
        schedule: dict[str, dict[str, str]],
        config: DefaultConfig,
        identity: str,
        holiday_manager: HolidayManager,
        data_handler: Data,
        callbacks: PlatformCallbacks,
    ):
        # --- Identity & configuration ---
        self.identity = identity
        self.config = config
        self.schedule = schedule
        self.model_dir = config.model_dir
        self.device = config.system
        self.base_record_topic = config.base_record_topic
        self.earliest_start_time: float = config.optimal_start.earliest_start_time
        self.latest_start_time: float = config.optimal_start.latest_start_time

        # --- External dependencies ---
        self.holiday_manager = holiday_manager
        self.data_handler = data_handler
        self._cb = callbacks

        # --- Model state ---
        self.models: dict[str, Any] = {}
        self.weekend_holiday_models: dict[str, Any] = {}
        self.weekend_holiday_trained: bool = False

        # --- Runtime state ---
        self.result: dict[str, Any] = {}
        self.training_time: Optional[float] = None
        self._scheduler_greenlets: list = []
        self.run_schedule_greenlet = None
        self._start_greenlet = None
        self._end_greenlet = None

    def setup_optimal_start(self) -> None:
        """
        Sets up the optimal start configuration by initializing and loading
        required models, and configuring daily cron jobs. The function performs the
        following tasks:
        - Loads a set of models for non-weekend days based on the configuration
          provided in `self.config.optimal_start`.
        - Loads a set of models for weekend or holiday dates with the same configuration.
        - Sets up recurring cron jobs for daily processing tasks.

        This method is designed to ensure that the correct models are deployed
        and scheduled for both weekday and weekend use cases.

        :return: None
        """
        opt_cfg = self.config.optimal_start
        self.models = self._load_model_set(opt_cfg, weekend=False)
        self.weekend_holiday_models = self._load_model_set(opt_cfg, weekend=True)
        self._install_daily_cron_jobs()

    def update_model_configurations(self, config: OptimalStartConfig) -> None:
        """
        Updates the configurations of all models with the provided optimal start configuration.

        This method applies the new configuration to all models, including both normal
        models and weekend/holiday-specific models. After updating each model with the
        new configuration, it updates the earliest and latest start times for the system.
        This ensures all models adhere to the specified configuration settings. A debug
        log is generated to confirm the update, documenting the updated earliest and
        latest start times.

        :param config: The new configuration instance to be applied to all models.
        :type config: OptimalStartConfig
        :return: None
        """
        all_models = list(self.models.values()) + list(self.weekend_holiday_models.values())
        for model in all_models:
            model.update_config(config)

        self.earliest_start_time = config.earliest_start_time
        self.latest_start_time = config.latest_start_time
        _log.debug(
            "Optimal-start config updated — earliest: %s  latest: %s",
            self.earliest_start_time,
            self.latest_start_time,
        )

    def set_up_run(self) -> None:
        """
        Schedules and prepares the daily run for optimal-start operations. This includes executing
        run setup tasks such as scheduling today's run and refreshing the data buffer. Ensures that
        cleanup and data handling processes are executed regardless of any errors occurring during
        scheduling.

        :return: None
        """
        try:
            self._schedule_todays_run()
        except Exception:
            _log.exception("Error during daily optimal-start setup.")
        finally:
            # Always refresh the data buffer regardless of scheduling outcome.
            self.data_handler.process_data()

    def run_method(self) -> None:
        """
        Executes the main method to calculate and commit an optimal operational schedule
        for a process based on the current day’s schedule, environmental conditions, and
        model evaluations. This method evaluates predictive models, calculates optimal
        start times, and schedules future activities accordingly.

        This method first determines the current schedule for the day and ensures that the
        process is only executed if a schedule exists. Subsequently, it calculates the
        start and end times of occupied and unoccupied states, evaluates predictive models
        for active runtime predictions, aggregates the start time information, and reschedules
        the execution if necessary for more accurate computations. If optimal decisions can
        be made, the method commits the estimated optimal start times, updates system state,
        and schedules the process for execution.

        :raises: This method does not raise exceptions itself but depends on various helper
            methods and external objects which may raise specific exceptions.
        """
        self.result = {}

        current_schedule = self.config.get_current_day_schedule()
        if not current_schedule:
            _log.debug("%s: no schedule for today — skipping.", self.identity)
            return

        now = self.config.get_current_datetime()
        occupancy_time = now.replace(
            hour=current_schedule.start.hour,
            minute=current_schedule.start.minute,
            microsecond=0,
        )
        unoccupied_time = now.replace(
            hour=current_schedule.end.hour,
            minute=current_schedule.end.minute,
            microsecond=0,
        )

        self._evaluate_all_models(occupancy_time)

        active_minutes = self._aggregate_start_time()
        optimal_start = occupancy_time - td(minutes=active_minutes)
        reschedule_at = now.replace(microsecond=0) + td(minutes=_RESCHEDULE_INTERVAL_MINUTES)

        self._cancel_greenlet("run_schedule_greenlet")

        # Too early to commit — reschedule with fresher data.
        if reschedule_at < optimal_start:
            _log.debug("Too early — rescheduling run_method at %s.", reschedule_at)
            self.run_schedule_greenlet = self._cb.schedule_fn(
                reschedule_at, self.run_method
            )
            return

        # Commit.
        self.training_time = active_minutes
        _log.debug(
            "%s: committing optimal start = %.1f min — %s",
            self.identity,
            active_minutes,
            self.result,
        )
        self._publish_start_times()
        self._schedule_occupancy_transitions(optimal_start, unoccupied_time)

    def train_models(self) -> None:
        """
        Trains machine learning models based on the provided configuration.

        This method retrieves the current data and selects appropriate models for training.
        Each model is trained individually with the specified training time, which includes
        a buffer time added to the user-specified training duration. If no training time is
        provided, the models are trained without a specified limit.

        :return: None
        """
        training_time = (
            int(self.training_time) + _TRAINING_TIME_BUFFER_MINUTES
            if self.training_time is not None
            else None
        )
        data = self._get_current_data()
        models = self._select_models_for_training()

        for tag, model in models.items():
            self._train_single_model(tag, model, data, training_time)

    def is_weekend_holiday(self) -> bool:
        """
        Determines if the previous day (yesterday) was either a holiday or a weekend.

        This function uses the `holiday_manager` object to check if yesterday was
        a holiday and also calculates if yesterday falls on a weekend (i.e.,
        Saturday or Sunday). The configuration provided through `config` is used
        to determine the current date and time, which is adjusted to get
        yesterday's date.

        :return: True if yesterday was either a holiday or a weekend, False otherwise
        :rtype: bool
        """
        yesterday = self.config.get_current_datetime() - td(days=1)
        return (
            self.holiday_manager.is_holiday(yesterday)
            or yesterday.weekday() >= 5
        )

    def _install_daily_cron_jobs(self) -> None:
        """
        Installs daily cron jobs by scheduling tasks for setup and training. Previously scheduled
        greenlets are killed before scheduling new ones. This ensures that only the latest scheduled
        tasks are active and reduces potential issues with overlapping or outdated processes.

        :returns: None
        """
        for greenlet in self._scheduler_greenlets:
            greenlet.kill()
        self._scheduler_greenlets = [
            self._cb.schedule_fn(cron(_CRON_DAILY_SETUP), self.set_up_run),
            self._cb.schedule_fn(cron(_CRON_DAILY_TRAINING), self.train_models),
        ]

    def _schedule_todays_run(self) -> None:
        """
        Schedules the run for today's current schedule based on configuration, current
        datetime, and holiday status. It determines occupancy or schedules a run method
        depending on the type of the day's schedule and time.

        :raises AttributeError: If schedule_fn or change_occupancy_fn is not callable.
        :return: None
        """
        current_schedule = self.config.get_current_day_schedule()
        now = self.config.get_current_datetime()
        is_holiday = self.holiday_manager.is_holiday(now)

        if not current_schedule:
            return

        if current_schedule == "always_off" or is_holiday:
            self._cb.change_occupancy_fn(OccupancyTypes.UNOCCUPIED)
            return

        if current_schedule == "always_on":
            self._cb.change_occupancy_fn(OccupancyTypes.OCCUPIED)
            return

        earliest = current_schedule.earliest_start
        if earliest is None:
            return

        run_time = now.replace(hour=earliest.hour, minute=earliest.minute)
        _log.debug("Scheduling run_method at %s.", format_timestamp(run_time))
        self.run_schedule_greenlet = self._cb.schedule_fn(run_time, self.run_method)

    def _schedule_occupancy_transitions(self, start_time, end_time) -> None:
        """
        Schedules transitions for occupancy states between specified start and end times.
        This method cancels any previously scheduled transitions for both start and end,
        and schedules new ones using the provided callback functions.

        :param start_time: The time at which the occupancy state should transition to OCCUPIED.
        :type start_time: datetime
        :param end_time: The time at which the occupancy state should transition to UNOCCUPIED.
        :type end_time: datetime
        :return: None
        """
        self._cancel_greenlet("_start_greenlet")
        self._cancel_greenlet("_end_greenlet")
        self._start_greenlet = self._cb.schedule_fn(
            start_time, self._cb.change_occupancy_fn, OccupancyTypes.OCCUPIED
        )
        self._end_greenlet = self._cb.schedule_fn(
            end_time, self._cb.change_occupancy_fn, OccupancyTypes.UNOCCUPIED
        )

    def _cancel_greenlet(self, attr_name: str) -> None:
        """
        Cancels a greenlet associated with the specified attribute name and resets the attribute to None.

        This function checks if a greenlet is assigned to the given attribute name. If a greenlet is found,
        it cancels the greenlet operation, ensuring that it is properly terminated, and then
        it sets the attribute to None to clean up.

        :param attr_name: The name of the attribute whose associated greenlet should be canceled.
        :type attr_name: str
        :returns: None
        :rtype: None
        """
        greenlet = getattr(self, attr_name, None)
        if greenlet is not None:
            greenlet.cancel()
            setattr(self, attr_name, None)

    def _evaluate_all_models(self, occupancy_time) -> None:
        """
        Evaluates all models selected for prediction. This method fetches the current data
        and calculates predictions for each model, storing the results in the `self.result`
        dictionary. The method also handles any exceptions raised during model execution
        and logs them. Finally, it updates the result dictionary with the formatted
        occupancy time.

        :param occupancy_time: The timestamp corresponding to the occupancy event.
        :type occupancy_time: float
        :return: None
        """
        models = self._select_models_for_prediction()
        data = self._get_current_data()

        for tag, model in models.items():
            try:
                self.result[tag] = model.calculate_prestart(data)
            except Exception:
                _log.exception(
                    "%s: error in model '%s' during prediction.", self.identity, tag
                )

        self.result["occupancy"] = format_timestamp(occupancy_time)

    def _aggregate_start_time(self) -> float:
        """
        Aggregates the start time based on numeric predictions while calculating
        a median value that falls between defined limits. If the median calculation
        fails, it falls back to the earliest start time.

        :return: The aggregated start time.
        :rtype: float
        """
        numeric = [v for v in self.result.values() if isinstance(v, _NUMERIC_TYPES)]
        try:
            median = float(np.median(numeric))
            _log.debug("Start-time predictions: %s — median: %.1f", self.result, median)
        except Exception:
            _log.exception("Median calculation failed — falling back to earliest.")
            median = self.earliest_start_time

        return max(self.latest_start_time, min(median, self.earliest_start_time))

    def _select_models_for_prediction(self) -> dict[str, Any]:
        """
        Selects the appropriate models for making predictions based on current conditions.

        This method evaluates whether the current date is a weekend or holiday and decides
        which models to use for predictions accordingly. The returned dictionary will
        contain the selected models based on the evaluation of the weekend or holiday
        condition and whether the related models are trained.

        :return: A dictionary containing the selected models for prediction.
        :rtype: dict[str, Any]
        """
        if self.is_weekend_holiday() and self.weekend_holiday_trained:
            return self.weekend_holiday_models
        return self.models

    def _select_models_for_training(self) -> dict[str, Any]:
        """
        Selects the appropriate models for training based on the current day type.

        This method determines whether it is a weekend or holiday and selects different sets
        of models accordingly. If it is a weekend or holiday, it returns the pre-trained
        `weekend_holiday_models`. Otherwise, it selects and returns the standard models
        specified in `models`. The corresponding state of `weekend_holiday_trained` is updated
        to reflect this decision.

        :return: Dictionary containing models selected for training.
        :rtype: dict[str, Any]
        """
        if self.is_weekend_holiday():
            self.weekend_holiday_trained = True
            return self.weekend_holiday_models
        return self.models

    def _load_model_set(
        self, config: OptimalStartConfig, *, weekend: bool
    ) -> dict[str, Any]:
        """
        Loads a set of models based on the provided configuration and determines their
        behavior depending on whether the current day is a weekend or not. The function
        creates and restores the states of models from a registry, utilizing the
        configuration provided and applying specific adjustments if the weekend flag
        is true.

        :param config: The base configuration used to initialize the models.
                       This configuration affects global settings such as
                       model parameters and training window settings.
        :type config: OptimalStartConfig
        :param weekend: A flag indicating whether the current day is a weekend.
                        If True, the training window for models is adjusted
                        specifically for weekend conditions.
        :return: A dictionary mapping model names to model instances. These models
                 are initialized with the specified configuration and have their
                 states restored.
        :rtype: dict[str, Any]
        """
        effective_config = config
        if weekend:
            # Avoid mutating the shared config — make a shallow copy first.
            effective_config = copy.copy(config)
            effective_config.training_period_window = _WEEKEND_TRAINING_WINDOW

        models: dict[str, Any] = {}
        for name, cls in _MODEL_REGISTRY.items():
            tag = f"{name}_we" if weekend else name
            model = cls(effective_config, self.config.get_current_day_schedule)
            self._restore_model_state(tag, model)
            models[tag] = model
        return models

    def _restore_model_state(self, tag: str, model) -> None:
        """
        Restores the state of a given model using a stored configuration identified by a specific tag.
        Attempts to retrieve the stored attributes associated with the tag from a configuration storage
        and then loads this state into the provided model.

        If no persisted state is found for the specified tag, the operation is skipped and it logs a debug
        message.

        :param tag: A unique identifier used to lookup the persisted configuration in the storage.
        :type tag: str
        :param model: An object that supports the `load_model` method, used to restore its state from
            persisted attributes.
        :return: None
        """
        store_key = f"{_CONFIG_STORE_PREFIX}.{tag}"
        try:
            stored_attrs = self._cb.config_get_fn(store_key)
            model.load_model(stored_attrs)
        except KeyError:
            _log.debug("%s: no persisted state for '%s'.", self.identity, tag)

    def _train_single_model(self, tag: str, model, data, training_time) -> None:
        """
        Trains a single model with the given data, tag, and training time, while handling
        potential errors during training. If the model training succeeds, the model is
        persisted and a training record is published. In case of an exception during
        training, the failure is logged and no further steps are executed.

        :param tag: A unique string identifier for the model being trained.
        :type tag: str
        :param model: The model object to be trained. This should support a
            `train` method that accepts `data` and `training_time`.
        :param data: The input data to be used for training the model.
        :param training_time: The time duration for which the model should be trained.
        :return: None
        """
        try:
            model.train(data, training_time)
        except Exception:
            _log.exception("%s: training failed for '%s'.", self.identity, tag)
            return

        self._persist_model(tag, model)
        self._publish_training_record(tag, model)

    def _persist_model(self, tag: str, model) -> None:
        """
        Persist the provided model's attributes associated with a given tag in both the internal
        config system and as a JSON file. This method ensures that certain attributes, such
        as "cfg", are excluded before persistence. If an error occurs during the process,
        it logs the failure with the associated tag.

        :param tag: A string representing the unique identifier or label for the model.
        :param model: The model object whose attributes are to be persisted.
        :return: None
        """
        try:
            attrs = get_cls_attrs(model)
            attrs.pop("cfg", None)

            store_key = f"{_CONFIG_STORE_PREFIX}.{tag}"
            self._cb.config_set_fn(store_key, attrs)

            json_path = self.model_dir / f"{self.device}_{tag}.json"
            with open(json_path, "w") as fp:
                json.dump(attrs, fp, indent=4)
        except Exception:
            _log.exception("%s: could not persist model '%s'.", self.identity, tag)

    def _publish_training_record(self, tag: str, model) -> None:
        """
        Publishes a training record to a specific topic. This method is responsible
        for formatting the record's topic, adding necessary headers, and calling
        the publish function. If no record exists, the method exits early.
        Failure during the publishing process will be logged.

        :param tag: A string representing the tag or identifier for the model topic.
        :type tag: str
        :param model: The model object containing the record to be published.
        :type model: object
        :return: This method does not return any value.
        :rtype: None
        """
        record = model.record
        if not record:
            return
        try:
            _log.debug("%s: model '%s' record: %s", self.identity, tag, record)
            headers = {"Date": format_timestamp(get_aware_utc_now())}
            topic = "/".join([self.base_record_topic, _TOPIC_MODEL, tag])
            self._cb.publish_fn(topic, headers, record)
        except Exception:
            _log.exception(
                "%s: failed to publish record for '%s'.", self.identity, tag
            )

    def _get_current_data(self):
        """
        Returns the current data by forward filling missing values in the relevant
        dataframe.

        The method utilizes the `ffill` function to propagate the last valid value
        to fill missing values, providing a complete and cleaned dataset based
        on the current state of the data handler's dataframe.

        :return: The updated dataframe with missing values forward filled.
        :rtype: pandas.DataFrame
        """
        return self.data_handler.df.ffill()

    def _publish_start_times(self) -> None:
        """
        Publishes the start times message to a specific topic by
        formatting the current timestamp and constructing headers.
        This message is sent using the provided callback's publish
        functionality with the relevant topic, headers, and data result.

        :return: None
        """
        headers = {"Date": format_timestamp(get_aware_utc_now())}
        topic = "/".join([self.base_record_topic, _TOPIC_START_TIMES])
        self._cb.publish_fn(topic, headers, self.result)