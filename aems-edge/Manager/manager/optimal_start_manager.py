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


"""
Optimal-start orchestration.

:class:`OptimalStartManager` schedules each day's optimal-start run, decides
when to switch the unit to occupied, and trains the optimal-start models
(:mod:`manager.optimal_start_models`) on each morning's recovery.

Daily lifecycle (all times local):

* 00:01 ``set_up_run`` - schedule today's ``run_method`` at the earliest start
  time and today's training run, then rotate the data buffer.
* earliest start -> occupancy: ``run_method`` evaluates the models every
  15 minutes and, once the predicted start is near, schedules the
  OCCUPIED / UNOCCUPIED transitions.
* occupancy + 95 min: ``train_models`` trains on this morning's data (after
  every model's training window has fully elapsed).

Model selection: every model is trained and its prediction published; the
start time is decided by the model(s) selected in ``optimal_start.models``
(one model: its prediction; several: their median). Only models trained for
the morning's mode take part; if none of the selected models is trained yet,
the median of all trained models is used, and the earliest start if no model
is trained.

Model sets: a weekday copy and a weekend/holiday copy of each model are kept.
The weekend copy is trained and used on the day after a weekend or holiday,
except for models with ``SEPARATE_WEEKEND_MODEL = False`` (RecoveryRegression),
which use one history for every day. A weekend copy not yet trained for the
needed mode falls back to the weekday copy.

Data: model input has one row per minute (device and outdoor-air publishes
merged; a reading covers at most ``MINUTE_FILL_LIMIT`` missed minutes). A
prediction needs a zone reading from the last ``_MAX_DATA_AGE_MINUTES``;
without one the models get no data and the earliest start is used.
"""

from __future__ import annotations

import dataclasses
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta as td
from typing import Any, Callable, Optional

import numpy as np
import pandas as pd
from volttron.platform.agent.utils import format_timestamp, get_aware_utc_now
from volttron.platform.scheduling import cron

from . import DefaultConfig, OptimalStartConfig
from .data_utils import MINUTE_FILL_LIMIT, Data, last_reading_time, to_minute_rows
from .holiday_manager import HolidayManager
from .optimal_start_models import (_TRAINING_END_OFFSET_MINUTES, Carrier, Johnson, OptimalStartZoneModel,
                                    RecoveryRegression, Sbs, Siemens)
from .points import DFPoints as dfpts
from .points import OccupancyTypes

_log = logging.getLogger(__name__)

_MODEL_REGISTRY: dict[str, type[OptimalStartZoneModel]] = {
    "j": Johnson,
    "s": Siemens,
    "c": Carrier,
    "sbs": Sbs,
    "rr": RecoveryRegression,
}

# Configuration names (optimal_start.models) -> registry tag; tags are accepted too.
_MODEL_NAMES = {"johnson": "j", "siemens": "s", "carrier": "c", "sbs": "sbs", "recovery_regression": "rr",
                **{tag: tag for tag in _MODEL_REGISTRY}}


def resolve_model_names(names) -> list[str]:
    """
    Registry tags for configured model names.

    Accepts configuration names (``recovery_regression``, ``carrier``,
    ``johnson``, ``siemens``, ``sbs``) or registry tags (``rr``, ``c``, ``j``,
    ``s``, ``sbs``), case-insensitive. Unknown names are logged and skipped;
    duplicates are removed; order is kept.

    :param names: A single name or a list of names.
    :type names: str | list[str] | None
    :return: Registry tags, e.g. ``["rr"]``.
    :rtype: list[str]
    """
    tags = []
    for name in ([names] if isinstance(names, str) else names or []):
        tag = _MODEL_NAMES.get(str(name).strip().lower())
        if tag is None:
            _log.error("Unknown optimal-start model %r (valid: %s) - ignored.", name,
                       ", ".join(k for k in _MODEL_NAMES if k not in _MODEL_REGISTRY))
        elif tag not in tags:
            tags.append(tag)
    return tags

_CONFIG_STORE_PREFIX = "optimal_start.models"
_TOPIC_MODEL = "OptimalStartModel"
_TOPIC_START_TIMES = "OptimalStartTimes"

_CRON_DAILY_SETUP = "1 0 * * *"  # 00:01 — determine today's schedule

_RESCHEDULE_INTERVAL_MINUTES = 15
_TRAINING_TIME_BUFFER_MINUTES = 5
# Train once every model's window has closed: the coefficient models use up to
# occupancy + 60 min, RecoveryRegression observes up to occupancy + its horizon
# (>= 90 min, see RecoveryRegression.observation_horizon); train this many
# minutes after the later of the two.
_TRAINING_DELAY_BUFFER_MINUTES = 5
_WEEKEND_TRAINING_WINDOW = 4

# A prediction needs a zone reading at most this old (minutes). Publishes are
# once a minute; this allows MINUTE_FILL_LIMIT missed publishes plus the minute
# in progress. Older data means the device has stopped publishing.
_MAX_DATA_AGE_MINUTES = MINUTE_FILL_LIMIT + 1


@dataclass(frozen=True)
class PlatformCallbacks:
    """
    Platform functions the manager needs, supplied by the agent.

    Kept separate so the manager can be unit tested without a VOLTTRON platform.

    :ivar schedule_fn: ``schedule_fn(when, fn, *args)`` - schedule a call (a
        datetime or cron iterator); returns an event with ``cancel()``.
    :vartype schedule_fn: Callable
    :ivar change_occupancy_fn: ``change_occupancy_fn(OccupancyTypes)`` - command
        the unit occupied / unoccupied.
    :vartype change_occupancy_fn: Callable
    :ivar publish_fn: ``publish_fn(topic, headers, message)`` - publish a record.
    :vartype publish_fn: Callable
    :ivar config_get_fn: ``config_get_fn(key)`` - read from the config store
        (raises KeyError if absent).
    :vartype config_get_fn: Callable
    :ivar config_set_fn: ``config_set_fn(key, value)`` - write to the config store.
    :vartype config_set_fn: Callable
    """
    schedule_fn: Callable
    change_occupancy_fn: Callable
    publish_fn: Callable
    config_get_fn: Callable
    config_set_fn: Callable


def _weekend_config(config: OptimalStartConfig) -> OptimalStartConfig:
    """
    Configuration for the weekend/holiday model copies.

    :param config: Optimal-start configuration.
    :type config: OptimalStartConfig
    :return: A copy with ``training_period_window`` set to the weekend window.
    :rtype: OptimalStartConfig
    """
    return dataclasses.replace(config, training_period_window=_WEEKEND_TRAINING_WINDOW)


class OptimalStartManager:
    """
    Schedules optimal-start runs, decides the start time and trains the models.

    :ivar identity: Agent identity (used in logs).
    :vartype identity: str
    :ivar config: Manager configuration (schedule, optimal-start settings, clock).
    :vartype config: DefaultConfig
    :ivar schedule: Occupancy schedule (as configured).
    :vartype schedule: dict[str, dict[str, str]]
    :ivar model_dir: Directory for the per-model JSON copies of the learned state.
    :vartype model_dir: pathlib.Path
    :ivar device: Device (system) name, used in the JSON file names.
    :vartype device: str
    :ivar base_record_topic: Base topic for published records.
    :vartype base_record_topic: str
    :ivar earliest_start_time: Maximum prestart in minutes.
    :vartype earliest_start_time: float
    :ivar latest_start_time: Minimum prestart in minutes.
    :vartype latest_start_time: float
    :ivar holiday_manager: Holiday lookup.
    :vartype holiday_manager: HolidayManager
    :ivar data_handler: Today's device data buffer.
    :vartype data_handler: Data
    :ivar models: Weekday model set, tag -> model (``c``, ``j``, ``s``, ``sbs``, ``rr``).
    :vartype models: dict[str, OptimalStartZoneModel]
    :ivar weekend_holiday_models: Weekend/holiday model set, tag -> model
        (``c_we``, ...).
    :vartype weekend_holiday_models: dict[str, OptimalStartZoneModel]
    :ivar selected_models: Registry tags of the models that decide the start time.
    :vartype selected_models: list[str]
    :ivar result: Latest predictions by model tag, plus ``occupancy`` and
        ``decided_by``; published when a start is committed.
    :vartype result: dict[str, Any]
    :ivar training_time: Committed prestart (minutes) of the current day, used as
        the start of the training window.
    :vartype training_time: float | None
    :ivar run_schedule_greenlet: Pending ``run_method`` event, if any.
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
        """
        :param schedule: Occupancy schedule.
        :type schedule: dict[str, dict[str, str]]
        :param config: Manager configuration.
        :type config: DefaultConfig
        :param identity: Agent identity (for logging).
        :type identity: str
        :param holiday_manager: Holiday lookup.
        :type holiday_manager: HolidayManager
        :param data_handler: Today's device data buffer.
        :type data_handler: Data
        :param callbacks: Platform functions.
        :type callbacks: PlatformCallbacks
        """
        self.identity = identity
        self.config = config
        self.schedule = schedule
        self.model_dir = config.model_dir
        self.device = config.system
        self.base_record_topic = config.base_record_topic
        self.earliest_start_time: float = config.optimal_start.earliest_start_time
        self.latest_start_time: float = config.optimal_start.latest_start_time

        self.holiday_manager = holiday_manager
        self.data_handler = data_handler
        self._cb = callbacks

        self.models: dict[str, OptimalStartZoneModel] = {}
        self.weekend_holiday_models: dict[str, OptimalStartZoneModel] = {}

        self.selected_models: list[str] = self._resolve_selection(config.optimal_start)
        self.result: dict[str, Any] = {}
        self._candidates: dict[str, float] = {}      # tag -> prediction from a model trained for today's mode
        self.training_time: Optional[float] = None
        self._committed_date = None                  # date today's start was committed (decision frozen)
        self._actual_start: Optional[datetime] = None   # when the optimal-start OCCUPIED command fired
        self._scheduler_greenlets: list = []
        self.run_schedule_greenlet = None
        self._training_greenlet = None
        self._start_greenlet = None
        self._end_greenlet = None

    # -- Public API ---------------------------------------------------------

    def setup_optimal_start(self) -> None:
        """
        Start optimal start: build both model sets (restoring persisted state),
        install the daily 00:01 job and schedule today's training if still ahead.

        Call once when the agent connects.
        """
        opt_cfg = self.config.optimal_start
        self.models = self._load_model_set(opt_cfg, weekend=False)
        self.weekend_holiday_models = self._load_model_set(_weekend_config(opt_cfg), weekend=True)
        self._install_daily_cron_jobs()
        self._schedule_todays_training()

    @property
    def weekend_holiday_trained(self) -> bool:
        """
        Whether any model that keeps a separate weekend copy has trained that copy.

        :return: True if the weekend/holiday set should be used after a weekend.
        :rtype: bool
        """
        return any(model.is_trained for model in self.weekend_holiday_models.values() if model.SEPARATE_WEEKEND_MODEL)

    def update_model_configurations(self, config: OptimalStartConfig) -> None:
        """
        Apply a new optimal-start configuration.

        Updates every model (the weekend copies with the weekend training window),
        the start-time limits and the model selection. Learned state is kept.

        :param config: New optimal-start configuration.
        :type config: OptimalStartConfig
        """
        for model in self.models.values():
            model.update_config(config)
        weekend_cfg = _weekend_config(config)
        for model in self.weekend_holiday_models.values():
            model.update_config(weekend_cfg)

        self.earliest_start_time = config.earliest_start_time
        self.latest_start_time = config.latest_start_time
        self.selected_models = self._resolve_selection(config)
        _log.debug("Optimal-start config updated — earliest: %s  latest: %s  models: %s",
                   self.earliest_start_time, self.latest_start_time, self.selected_models)

    def _resolve_selection(self, config: OptimalStartConfig) -> list[str]:
        """
        Registry tags for ``config.models``, falling back to the default selection.

        :param config: Optimal-start configuration.
        :type config: OptimalStartConfig
        :return: Tags of the deciding models (never empty).
        :rtype: list[str]
        """
        tags = resolve_model_names(getattr(config, "models", None))
        if not tags:
            tags = resolve_model_names(OptimalStartConfig.__dataclass_fields__["models"].default_factory())
            _log.warning("%s: no valid optimal-start models configured - using %s.", self.identity, tags)
        return tags

    def set_up_run(self) -> None:
        """
        Daily setup (00:01): schedule today's run and training, then rotate the data
        buffer (always, even if scheduling fails).
        """
        try:
            self._schedule_todays_run()
            self._schedule_todays_training()
        except Exception:
            _log.exception("Error during daily optimal-start setup.")
        finally:
            self.data_handler.process_data()

    def reset_run(self) -> None:
        """
        Restart today's optimal start: cancel any pending ``run_method`` and clear
        today's committed decision so the next ``run_method`` evaluates again.
        """
        self._cancel_greenlet("run_schedule_greenlet")
        self._committed_date = None

    def run_method(self) -> None:
        """
        Evaluate the models and commit or reschedule today's start.

        Once today's start is committed the decision is frozen: later calls the
        same day (e.g. from the occupancy sync) return immediately, until
        :meth:`reset_run` or the next day.

        Predicts with every model, decides the start time
        (:meth:`_aggregate_start_time`), and if the start is more than 15 minutes away
        reschedules itself to re-evaluate with fresher data; otherwise publishes the
        predictions and schedules the OCCUPIED transition at the start time and the
        UNOCCUPIED transition at the end of occupancy. Does nothing on days without a
        timed schedule or on holidays.
        """
        now = self.config.get_current_datetime()
        if self._committed_date == now.date():
            # Already decided today; the occupancy sync calls run_method whenever no
            # run is pending, which must not re-decide (or overwrite training_time).
            _log.debug("%s: optimal start already committed for today - skipping.", self.identity)
            return
        self.result = {}

        current_schedule = self._timed_schedule_for_today()
        if current_schedule is None:
            return

        occupancy_time = self._at(now, current_schedule.start)
        unoccupied_time = self._at(now, current_schedule.end)

        self._evaluate_all_models(occupancy_time)

        active_minutes = self._aggregate_start_time()
        optimal_start = occupancy_time - td(minutes=active_minutes)
        reschedule_at = now.replace(microsecond=0) + td(minutes=_RESCHEDULE_INTERVAL_MINUTES)

        self._cancel_greenlet("run_schedule_greenlet")

        if reschedule_at < optimal_start:
            _log.debug("Too early — rescheduling run_method at %s.", reschedule_at)
            self.run_schedule_greenlet = self._cb.schedule_fn(reschedule_at, self.run_method)
            return

        self.training_time = active_minutes
        self._committed_date = now.date()
        _log.debug("%s: committing optimal start = %.1f min — %s",
                   self.identity, active_minutes, self.result)
        self._publish_start_times()
        self._schedule_occupancy_transitions(optimal_start, unoccupied_time)

    def train_models(self) -> None:
        """
        Train today's models on this morning's data and persist what they learned.

        The training window starts when the unit actually started this morning
        (the recorded optimal-start OCCUPIED command; else the committed prestart)
        plus a 5 min buffer. After a
        weekend/holiday the weekend copies are trained, except for models that keep
        one history (:attr:`~manager.optimal_start_models.OptimalStartZoneModel.SEPARATE_WEEKEND_MODEL`).
        """
        lead = self._start_lead_today()
        training_time = int(lead) + _TRAINING_TIME_BUFFER_MINUTES if lead is not None else None
        data = self._get_current_data()
        if data.empty:
            _log.debug("%s: no data available — skipping training.", self.identity)
            return

        for tag, model in self._models_for_today().items():
            self._train_single_model(tag, model, data, training_time)

    def is_weekend_holiday(self) -> bool:
        """
        Whether today follows a weekend or holiday (i.e. yesterday was one).

        :return: True if yesterday was Saturday, Sunday or a holiday.
        :rtype: bool
        """
        yesterday = self.config.get_current_datetime() - td(days=1)
        return self.holiday_manager.is_holiday(yesterday) or yesterday.weekday() >= 5

    # -- Scheduling ---------------------------------------------------------

    def _timed_schedule_for_today(self):
        """
        Today's schedule if it has start/end times and today is not a holiday.

        :return: Today's :class:`~manager.Schedule`, or None for no schedule,
            always-on/off days and holidays.
        """
        current_schedule = self.config.get_current_day_schedule()
        if not current_schedule:
            _log.debug("%s: no schedule for today.", self.identity)
            return None
        if current_schedule.is_always_on() or current_schedule.is_always_off():
            return None
        if self.holiday_manager.is_holiday(self.config.get_current_datetime()):
            return None
        return current_schedule

    @staticmethod
    def _at(now: datetime, t) -> datetime:
        """
        ``now`` with the time of day replaced by ``t`` (seconds zeroed).

        :param now: Reference datetime (date and timezone).
        :type now: datetime
        :param t: Time of day.
        :type t: datetime.time
        :return: The combined datetime.
        :rtype: datetime
        """
        return now.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)

    def _install_daily_cron_jobs(self) -> None:
        """
        (Re)install the 00:01 daily job that calls :meth:`set_up_run`, cancelling any
        previous one.
        """
        for greenlet in self._scheduler_greenlets:
            greenlet.cancel()
        self._scheduler_greenlets = [
            self._cb.schedule_fn(cron(_CRON_DAILY_SETUP), self.set_up_run),
        ]

    def _schedule_todays_run(self) -> None:
        """
        Schedule today's optimal-start run.

        Always-off days and holidays are set unoccupied and always-on days occupied
        immediately; timed days get ``run_method`` scheduled at the earliest start.
        """
        current_schedule = self.config.get_current_day_schedule()
        if not current_schedule:
            return

        now = self.config.get_current_datetime()
        if current_schedule.is_always_off() or self.holiday_manager.is_holiday(now):
            self._cb.change_occupancy_fn(OccupancyTypes.UNOCCUPIED)
            return
        if current_schedule.is_always_on():
            self._cb.change_occupancy_fn(OccupancyTypes.OCCUPIED)
            return

        earliest = current_schedule.earliest_start
        if earliest is None:
            return

        run_time = self._at(now, earliest)
        _log.debug("Scheduling run_method at %s.", format_timestamp(run_time))
        self._cancel_greenlet("run_schedule_greenlet")
        self.run_schedule_greenlet = self._cb.schedule_fn(run_time, self.run_method)

    def _schedule_todays_training(self) -> None:
        """
        Schedule :meth:`train_models` at occupancy + :meth:`_training_delay_minutes`,
        if that time is still ahead today (replaces any pending training).
        """
        self._cancel_greenlet("_training_greenlet")
        current_schedule = self._timed_schedule_for_today()
        if current_schedule is None:
            return

        now = self.config.get_current_datetime()
        train_at = self._at(now, current_schedule.start) + td(minutes=self._training_delay_minutes())
        if train_at <= now:
            return
        _log.debug("Scheduling train_models at %s.", format_timestamp(train_at))
        self._training_greenlet = self._cb.schedule_fn(train_at, self.train_models)

    def _training_delay_minutes(self) -> float:
        """
        Minutes after occupancy at which every model's training window has closed.

        :return: The later of the coefficient models' window end and the
            RecoveryRegression observation horizon, plus
            ``_TRAINING_DELAY_BUFFER_MINUTES``.
        :rtype: float
        """
        horizon = RecoveryRegression.observation_horizon(self.earliest_start_time, self.latest_start_time)
        return max(_TRAINING_END_OFFSET_MINUTES, horizon) + _TRAINING_DELAY_BUFFER_MINUTES

    def _start_lead_today(self) -> Optional[float]:
        """
        Minutes before today's occupancy the unit actually started.

        :return: From the recorded optimal-start OCCUPIED command if it fired today,
            else the committed prestart if today's start was committed, else None.
        :rtype: float | None
        """
        now = self.config.get_current_datetime()
        schedule = self._timed_schedule_for_today()
        if self._actual_start is not None and self._actual_start.date() == now.date() and schedule is not None:
            occupancy = self._at(now, schedule.start)
            return max(0.0, (occupancy - self._actual_start).total_seconds() / 60.0)
        if self._committed_date == now.date():
            return self.training_time
        return None

    def _start_occupancy(self, state) -> None:
        """
        Scheduled optimal-start transition: record when it fired, then command the unit.

        :param state: Occupancy state to command (OCCUPIED).
        :type state: OccupancyTypes
        """
        self._actual_start = self.config.get_current_datetime()
        _log.debug("%s: optimal start fired at %s.", self.identity, format_timestamp(self._actual_start))
        self._cb.change_occupancy_fn(state)

    def _schedule_occupancy_transitions(self, start_time, end_time) -> None:
        """
        Schedule the OCCUPIED and UNOCCUPIED commands (replacing pending ones).

        :param start_time: When to switch to occupied (the optimal start).
        :type start_time: datetime
        :param end_time: When to switch to unoccupied (end of occupancy).
        :type end_time: datetime
        """
        self._cancel_greenlet("_start_greenlet")
        self._cancel_greenlet("_end_greenlet")
        self._start_greenlet = self._cb.schedule_fn(
            start_time, self._start_occupancy, OccupancyTypes.OCCUPIED
        )
        self._end_greenlet = self._cb.schedule_fn(
            end_time, self._cb.change_occupancy_fn, OccupancyTypes.UNOCCUPIED
        )

    def _cancel_greenlet(self, attr_name: str) -> None:
        """
        Cancel the scheduled event stored in attribute ``attr_name`` and clear it.

        :param attr_name: Attribute holding the event (e.g. ``"run_schedule_greenlet"``).
        :type attr_name: str
        """
        greenlet = getattr(self, attr_name, None)
        if greenlet is not None:
            greenlet.cancel()
            setattr(self, attr_name, None)

    # -- Prediction ---------------------------------------------------------

    def _evaluate_all_models(self, occupancy_time) -> None:
        """
        Predict with every model and collect the start-time candidates.

        All predictions are stored in :attr:`result` (and later published). On a day
        after a weekend/holiday the weekend copy is used, falling back per model to
        the weekday copy when the weekend copy is not trained for today's mode.
        Only finite predictions from models trained for that mode become candidates
        for :meth:`_aggregate_start_time`.

        :param occupancy_time: Today's occupancy start (recorded in the result).
        :type occupancy_time: datetime
        """
        data = self._get_prediction_data()
        use_weekend = self.is_weekend_holiday() and self.weekend_holiday_trained
        self._candidates = {}
        for tag, weekday_model in self.models.items():
            weekend_copy = use_weekend and weekday_model.SEPARATE_WEEKEND_MODEL
            versions = ([(f"{tag}_we", self.weekend_holiday_models[f"{tag}_we"])] if weekend_copy else []) + [(tag, weekday_model)]
            for result_tag, model in versions:
                try:
                    value = float(model.calculate_prestart(data))
                    ready = model.ready_for(data)
                except Exception:
                    _log.exception("%s: error in model '%s' during prediction.", self.identity, result_tag)
                    continue
                self.result[result_tag] = value
                if ready and np.isfinite(value):
                    self._candidates[tag] = value
                    break

        self.result["occupancy"] = format_timestamp(occupancy_time)

    def _aggregate_start_time(self) -> float:
        """
        Decide the prestart from the candidates.

        One selected model -> its prediction; several -> their median. If none of the
        selected models is trained for today's mode, the median of all trained
        models is used; if no model is trained, the earliest start. The models that
        decided are recorded in ``result["decided_by"]``.

        :return: Prestart in minutes, clamped to [latest, earliest].
        :rtype: float
        """
        chosen = {t: self._candidates[t] for t in self.selected_models if t in self._candidates}
        if not chosen and self._candidates:
            _log.info("%s: selected model(s) %s not trained for today - using all trained models %s.",
                      self.identity, self.selected_models, sorted(self._candidates))
            chosen = dict(self._candidates)
        if chosen:
            value = float(np.median(list(chosen.values())))
            self.result["decided_by"] = sorted(chosen)
            _log.debug("Start-time predictions: %s — decided by %s: %.1f", self.result, sorted(chosen), value)
        else:
            _log.warning("%s: no usable prediction (no trained model or no current data) — using earliest start.",
                         self.identity)
            self.result["decided_by"] = []
            value = self.earliest_start_time
        return max(self.latest_start_time, min(value, self.earliest_start_time))

    def _models_for_today(self) -> dict[str, OptimalStartZoneModel]:
        """
        Models to train today.

        :return: The weekday set, or after a weekend/holiday the weekend copies
            (``<tag>_we``) - except models that keep one history, which keep their
            weekday copy and tag.
        :rtype: dict[str, OptimalStartZoneModel]
        """
        if not self.is_weekend_holiday():
            return self.models
        return {(f"{tag}_we" if m.SEPARATE_WEEKEND_MODEL else tag): (self.weekend_holiday_models[f"{tag}_we"] if m.SEPARATE_WEEKEND_MODEL else m)
                for tag, m in self.models.items()}

    def _get_current_data(self) -> pd.DataFrame:
        """
        Today's data for the models, one row per minute (see
        :func:`~manager.data_utils.to_minute_rows`).

        :return: The data, or an empty DataFrame if none has been received.
        :rtype: pd.DataFrame
        """
        df = self.data_handler.df
        if df is None or df.empty:
            return pd.DataFrame()
        return to_minute_rows(df, timezone=self.config.timezone)

    def _get_prediction_data(self) -> pd.DataFrame:
        """
        Data for a prediction: :meth:`_get_current_data`, or an empty DataFrame
        (the models then return the earliest start) if no zone reading has
        arrived in the last ``_MAX_DATA_AGE_MINUTES`` - the device has stopped
        publishing, so the last row would not describe the zone now.

        :return: The data, or an empty DataFrame.
        :rtype: pd.DataFrame
        """
        df = self.data_handler.df
        if df is None or df.empty:
            return pd.DataFrame()
        tzinfo = self.config.timezone
        last = last_reading_time(df, dfpts.zonetemperature.value, tzinfo)
        now = pd.Timestamp(self.config.get_current_datetime())
        now = now.tz_localize(tzinfo) if now.tzinfo is None else now
        if last is None or now - last > pd.Timedelta(minutes=_MAX_DATA_AGE_MINUTES):
            _log.warning("%s: no zone temperature since %s - no current conditions for the prediction.",
                         self.identity, "never" if last is None else format_timestamp(last.to_pydatetime()))
            return pd.DataFrame()
        return to_minute_rows(df, timezone=tzinfo)

    # -- Persistence --------------------------------------------------------

    def _load_model_set(self, config: OptimalStartConfig, *, weekend: bool) -> dict[str, Any]:
        """
        Create one instance of every registered model and restore its saved state.

        :param config: Configuration for the set.
        :type config: OptimalStartConfig
        :param weekend: Build the weekend/holiday set (tags ``<tag>_we``).
        :type weekend: bool
        :return: Tag -> model.
        :rtype: dict[str, OptimalStartZoneModel]
        """
        models: dict[str, OptimalStartZoneModel] = {}
        for name, cls in _MODEL_REGISTRY.items():
            tag = f"{name}_we" if weekend else name
            model = cls(config, self.config.get_current_day_schedule)
            self._restore_model_state(tag, model)
            models[tag] = model
        return models

    def _restore_model_state(self, tag: str, model: OptimalStartZoneModel) -> None:
        """
        Load a model's persisted state from ``optimal_start.models.<tag>``.

        A missing entry is normal for a new model; other errors are logged and the
        model starts untrained.

        :param tag: Model tag (e.g. ``"rr"``, ``"c_we"``).
        :type tag: str
        :param model: Model to restore into.
        :type model: OptimalStartZoneModel
        """
        store_key = f"{_CONFIG_STORE_PREFIX}.{tag}"
        try:
            model.load_model(self._cb.config_get_fn(store_key))
        except KeyError:
            _log.debug("%s: no persisted state for '%s'.", self.identity, tag)
        except Exception:
            _log.exception("%s: could not restore persisted state for '%s'.", self.identity, tag)

    def _train_single_model(self, tag: str, model: OptimalStartZoneModel, data, training_time) -> None:
        """
        Train one model and, if it learned something, persist and publish it.

        Training errors are logged and do not affect other models.

        :param tag: Model tag.
        :type tag: str
        :param model: Model to train.
        :type model: OptimalStartZoneModel
        :param data: Today's data.
        :type data: pd.DataFrame
        :param training_time: Training window start in minutes before occupancy.
        :type training_time: float | None
        """
        try:
            model.train(data, training_time)
        except Exception:
            _log.exception("%s: training failed for '%s'.", self.identity, tag)
            return
        if not model.record:
            return
        self._persist_model(tag, model)
        self._publish_training_record(tag, model)

    def _persist_model(self, tag: str, model: OptimalStartZoneModel) -> None:
        """
        Save a model's learned state to the config store
        (``optimal_start.models.<tag>``) and to ``<model_dir>/<device>_<tag>.json``.

        :param tag: Model tag.
        :type tag: str
        :param model: Model to save.
        :type model: OptimalStartZoneModel
        """
        try:
            # Round-trip through JSON so numpy scalars become plain floats.
            state = json.loads(json.dumps(model.get_state(), default=float))
            self._cb.config_set_fn(f"{_CONFIG_STORE_PREFIX}.{tag}", state)
            json_path = self.model_dir / f"{self.device}_{tag}.json"
            with open(json_path, "w") as fp:
                json.dump(state, fp, indent=4)
        except Exception:
            _log.exception("%s: could not persist model '%s'.", self.identity, tag)

    # -- Publishing ---------------------------------------------------------

    def _publish(self, topic_parts: list[str], message: Any) -> None:
        """
        Publish ``message`` under ``<base_record_topic>/<topic_parts...>`` with a Date
        header.

        :param topic_parts: Topic segments after the base record topic.
        :type topic_parts: list[str]
        :param message: Message payload.
        """
        headers = {"Date": format_timestamp(get_aware_utc_now())}
        self._cb.publish_fn("/".join([self.base_record_topic, *topic_parts]), headers, message)

    def _publish_training_record(self, tag: str, model: OptimalStartZoneModel) -> None:
        """
        Publish a model's latest training record to ``.../OptimalStartModel/<tag>``.

        :param tag: Model tag.
        :type tag: str
        :param model: Trained model (uses ``model.record``).
        :type model: OptimalStartZoneModel
        """
        try:
            _log.debug("%s: model '%s' record: %s", self.identity, tag, model.record)
            self._publish([_TOPIC_MODEL, tag], json.loads(json.dumps(model.record, default=float)))
        except Exception:
            _log.exception("%s: failed to publish record for '%s'.", self.identity, tag)

    def _publish_start_times(self) -> None:
        """
        Publish all model predictions, the occupancy time and the deciding models to
        ``.../OptimalStartTimes``.
        """
        self._publish([_TOPIC_START_TIMES], json.loads(json.dumps(self.result, default=float)))
