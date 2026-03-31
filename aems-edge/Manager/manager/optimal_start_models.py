# -*- coding: utf-8 -*-
# ===----------------------------------------------------------------------===
#
#                 AEMS Application — Optimal Start Zone Models
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

import logging
import os
import warnings
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime as dt
from enum import Enum
from typing import Callable, Optional

import numpy as np
import pandas as pd
from volttron.platform.agent.utils import format_timestamp

from . import OptimalStartConfig
from .points import DFPoints as dfpts
from .utils import (
    calculate_prestart_time,
    ema,
    get_operating_mode,
    get_time_target,
    get_time_temp_diff,
    offset_time,
    parse_df,
    trim,
)

warnings.filterwarnings("ignore", category=DeprecationWarning)
_log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_DEFAULT_TIMEZONE = "US/Pacific"
_TRAINING_END_OFFSET_MINUTES = 60

# Parameters for heat-transfer-rate calculation
_HTR_MAX_THRESHOLD = 15
_HTR_NUM_STEPS = 61


class OperatingMode(str, Enum):
    """
    Represents the operating modes for a system.

    This class is an Enum that defines possible operating modes such as
    cooling and heating. It inherits from both `str` and `Enum`, enabling
    the representation of the modes as strings while also leveraging the
    benefits of enumeration.

    :ivar COOLING: Represents the cooling mode.
    :type COOLING: str

    :ivar HEATING: Represents the heating mode.
    :type HEATING: str
    """
    COOLING = "cooling"
    HEATING = "heating"


@dataclass(frozen=True)
class ZoneConditions:
    """
    Represents the environmental conditions of a specific zone.

    This class is used to store and represent various temperature-related
    conditions, both internal and external, for a specific zone. It includes
    the zone temperature, heating and cooling setpoint temperatures, and the
    outdoor air temperature. The class is immutable due to the use of
    `frozen=True` in the dataclass, ensuring that its attributes cannot be
    modified after instantiation.

    :ivar zone_temperature: The current temperature of the zone.
    :type zone_temperature: float
    :ivar cooling_setpoint: The cooling setpoint temperature of the zone.
        This defines the upper limit for the zone temperature before
        the cooling system activates.
    :type cooling_setpoint: float
    :ivar heating_setpoint: The heating setpoint temperature of the zone.
        This defines the lower limit for the zone temperature before
        the heating system activates.
    :type heating_setpoint: float
    :ivar outdoor_air_temperature: The external air temperature outside the
        zone. This provides context for heat exchange or load calculation.
    :type outdoor_air_temperature: float
    """
    zone_temperature: float
    cooling_setpoint: float
    heating_setpoint: float
    outdoor_air_temperature: float


def _extract_zone_conditions(data: pd.DataFrame) -> ZoneConditions:
    """
    Extracts zone-specific conditions from the given DataFrame based on the latest
    available entries in the dataset. This function retrieves the most recent values
    for zone temperature, cooling setpoint, heating setpoint, and outdoor air
    temperature from the provided DataFrame and combines them into a ZoneConditions
    object.

    The input DataFrame is expected to have specific columns, namely
    'zonetemperature', 'coolingsetpoint', 'heatingsetpoint', and
    'outdoortemperature'. An assumption is made that the structure of the dataset
    ensures valid access to these columns and the most recent values will always be
    found at the last index of the respective columns.

    :param data: Input pandas DataFrame containing zone-related condition data. The
        DataFrame must include the following columns:
            - 'zonetemperature': Zone temperature values
            - 'coolingsetpoint': Cooling setpoint values
            - 'heatingsetpoint': Heating setpoint values
            - 'outdoortemperature': Outdoor air temperature values

    :return: A ZoneConditions object encapsulating the most recent zone condition
        details extracted from the input data.
    :rtype: ZoneConditions
    """
    return ZoneConditions(
        zone_temperature=data["zonetemperature"].iloc[-1],
        cooling_setpoint=data["coolingsetpoint"].iloc[-1],
        heating_setpoint=data["heatingsetpoint"].iloc[-1],
        outdoor_air_temperature=data["outdoortemperature"].iloc[-1],
    )


def _coefficients_are_valid(
    values: dict[str, float],
    *,
    model_label: str,
    allow_zero: bool = False,
) -> bool:
    """
    Determines if the provided coefficients are valid by checking that all values are
    finite, non-negative, and optionally non-zero. Logs debug information if any
    coefficient is invalid.

    :param values: Dictionary mapping coefficient names to their respective values.
    :param model_label: Identifier for the model, used for logging purposes.
    :param allow_zero: If True, allows zero values in the coefficients; otherwise,
        zero values are considered invalid.
    :return: True if all coefficients are valid, otherwise False.
    """
    for name, value in values.items():
        if not np.isfinite(value):
            _log.debug(
                "%s: non-finite coefficient %s = %s", model_label, name, value
            )
            return False
        if (value < 0) or (not allow_zero and value == 0):
            _log.debug(
                "%s: non-positive coefficient %s = %s", model_label, name, value
            )
            return False
    return True


class OptimalStartZoneModel(ABC):
    """
    Provides an abstract base class for implementing an optimal start zone model,
    focusing on calculating optimal start times, training schedules, and handling
    specific heating or cooling operations.

    The OptimalStartZoneModel allows derived classes to manage parameters for
    efficient operations in a controlled environment. It incorporates functionalities
    to configure system parameters, persist and load model configurations, train
    based on operational data, and abstract methods for specific operations like
    training in heating or cooling modes.

    :ivar record: A dictionary used to store intermediate or temporary results during
        processes such as training.
    :type record: dict
    :ivar cfg: Configuration parameters for the optimal start system.
    :type cfg: OptimalStartConfig
    :ivar _get_current_schedule: Callable function to obtain the current operational
        schedule required for training and calculations.
    :type _get_current_schedule: Callable
    :ivar latest_start_time: The latest allowable start time for training or processes.
    :type latest_start_time: float
    :ivar earliest_start_time: The earliest allowable start time for training or processes.
    :type earliest_start_time: float
    :ivar setpoint_deviation: Acceptable deviation in setpoint for operations.
    :type setpoint_deviation: float
    :ivar training_period_window: Time window for training data processing.
    :type training_period_window: int
    :ivar tz: Local timezone used for managing time-series data.
    :type tz: str
    """

    def __init__(
        self,
        config: OptimalStartConfig,
        get_current_schedule_fn: Callable,
    ):
        self._get_current_schedule = get_current_schedule_fn
        self.record: dict = {}
        self._apply_config(config)

    def _apply_config(self, config: OptimalStartConfig) -> None:
        """
        Apply the configuration values from an OptimalStartConfig object to set up
        the necessary parameters for the system.

        This method assigns configuration values to corresponding instance variables
        that control timing, deviation allowances, training period, and timezone.
        The configuration is intended for managing parameters related to starting
        a process or application optimally. This primarily extracts the necessary
        values from the provided configuration object and initializes internal
        parameters accordingly.

        :param config: Configuration object that contains optimal start parameters.
        :type config: OptimalStartConfig
        :return: None
        """
        self.cfg = config
        self.latest_start_time: float = config.latest_start_time
        self.earliest_start_time: float = config.earliest_start_time
        self.setpoint_deviation: float = config.allowable_setpoint_deviation
        self.training_period_window: int = config.training_period_window
        self.tz: str = os.environ.get("LOCAL_TZ", _DEFAULT_TIMEZONE)

    def update_config(self, config: OptimalStartConfig) -> None:
        """
        Updates the configuration parameters used within the system.

        This method takes a configuration instance of type `OptimalStartConfig`
        and applies it to update the internal configuration state of the system.
        The configuration update is performed through the `_apply_config` method.

        The purpose of this method is to ensure that the system behavior aligns
        with the updated parameter values defined in the provided
        `OptimalStartConfig` instance. This may involve validating and reconfiguring
        various internal aspects of the system.

        :param config: A configuration object of type `OptimalStartConfig` that
            holds the parameters for updating the system configuration.
        :return: None
        """
        self._apply_config(config)

    def load_model(self, model_dict: dict[str, any]) -> None:
        """
        Loads model parameters from a dictionary and assigns them as attributes
        to the current instance. Each key in the dictionary is used as an attribute
        name, and the corresponding value is assigned to that attribute. If an
        attribute cannot be set, the process is logged for debugging purposes
        without interrupting the operation.

        :param model_dict: A dictionary containing model parameters to be loaded as
            attributes, where keys represent attribute names and their corresponding
            values are the values to be assigned.
        :type model_dict: dict[str, any]
        :return: This method does not return any value.
        :rtype: None
        """
        for name, value in model_dict.items():
            try:
                setattr(self, name, value)
            except Exception as ex:
                _log.debug(
                    "Cannot restore model parameter %s = %s: %s", name, value, ex
                )

    def train(self, data: pd.DataFrame, prestart: Optional[float] = None) -> None:
        """
        Trains the model using provided data and prestart time. This function processes
        training data within a given operational schedule and slices it based on the
        training window. It determines the operating mode to train the system either in
        cooling or heating mode. If there is no appropriate schedule or training data,
        or if the operating mode is not valid, the training process is skipped.

        :param data:
            A pandas DataFrame containing the data required for training the model.
            The DataFrame should include the necessary time-series or operational
            data used to determine training schedules and modes.
        :param prestart:
            An optional float indicating the earliest time for beginning the training.
            If not provided, the default value will be set to the earliest start time
            available internally in the system.
        :return:
            None
        """
        self.record = {}

        if prestart is None:
            prestart = self.earliest_start_time
        if data.empty:
            return

        schedule = self._get_current_schedule()
        if schedule is None:
            _log.debug("No schedule found — skipping training.")
            return

        training_data = self._slice_training_window(data, schedule, prestart)
        if training_data is None or training_data.empty:
            return

        mode = get_operating_mode(training_data)
        if mode == OperatingMode.COOLING:
            training_data.to_csv('sort1.csv')
            self.train_cooling(parse_df(training_data, mode))
        elif mode == OperatingMode.HEATING:
            training_data.to_csv('sort1.csv')
            self.train_heating(parse_df(training_data, mode))
        else:
            _log.debug("No active heating or cooling during training period.")

    # -- Abstract Interface -------------------------------------------------

    @abstractmethod
    def train_cooling(self, data: pd.DataFrame) -> None: ...

    @abstractmethod
    def train_heating(self, data: pd.DataFrame) -> None: ...

    @abstractmethod
    def calculate_prestart(self, data: pd.DataFrame) -> float: ...

    # -- Shared Helpers -----------------------------------------------------

    def _slice_training_window(
        self,
        data: pd.DataFrame,
        schedule,
        prestart: float,
    ) -> Optional[pd.DataFrame]:
        """
        Slices the training data to include only the period between the calculated
        prestart time and the training window end time. Filters out rows where the
        supply fan status is off. If the resulting data is empty, logs a debug message
        and returns None. The method also ensures the time index is converted to the
        correct timezone and exports the filtered data to a CSV file for sorting.

        :param data: A pandas DataFrame containing the system data indexed by time.
        :param schedule: An object providing a 'start' attribute for the schedule,
                         representing the start time of the event of interest.
        :param prestart: A float representing the amount of time to offset before the
                        `schedule.start` as prestart duration, measured in minutes.
        :return: A pandas DataFrame containing the processed subset of data or None
                 if the resulting data after filtering is empty, with the first row
                 dropped to avoid initial transition artifacts.
        """
        occupancy_start = schedule.start
        window_start = calculate_prestart_time(occupancy_start, prestart)
        window_end = offset_time(occupancy_start, _TRAINING_END_OFFSET_MINUTES)
        _log.debug("Training window: %s → %s", window_start, window_end)

        data = data.copy()
        data.index = pd.to_datetime(data.index, utc=True).tz_convert(self.tz)
        data = data.between_time(window_start, window_end)
        data = data[data["supplyfanstatus"] != 0]
        data.to_csv('sort.csv')
        if data.empty:
            _log.debug("Supply fan was off for the entire training window.")
            return None

        # Drop the initial transition row.
        return data.iloc[1:]

    def _compute_heat_transfer_rate(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Computes the heat transfer rate (HTR) based on the temperature difference
        column in the provided dataset. The function identifies the points at which
        the temperature difference crosses defined thresholds, and returns a data
        frame containing these points. If only one crossing is found and the initial
        temperature difference exceeds the tolerance level, the last available row
        is appended to the result for accuracy.

        :param data: A DataFrame containing temperature difference data. The
                     computation relies on a specific column, 'tempdiff', being
                     available among the data fields.
        :type data: pd.DataFrame
        :return: A DataFrame containing a subset of rows where the temperature
                 difference crosses predefined thresholds. If no valid crossings
                 are identified, an empty DataFrame is returned. The returned
                 DataFrame avoids duplicate indices by keeping only the first
                 occurrence.
        :rtype: pd.DataFrame
        """
        temp_diff_col = dfpts.tempdiff.value
        initial_diff = data[temp_diff_col].iloc[0]
        thresholds = np.linspace(0, _HTR_MAX_THRESHOLD, _HTR_NUM_STEPS)

        rows: list[pd.Series] = []
        for threshold in thresholds:
            try:
                crossed = data[(initial_diff - data[temp_diff_col]) >= threshold]
                rows.append(data.loc[crossed.index[0]])
            except (IndexError, ValueError) as ex:
                _log.debug("HTR lookup skipped at %.2f: %s", threshold, ex)

        # If only one crossing found but the initial diff exceeds tolerance,
        # append the last available row as an endpoint.
        if len(rows) == 1 and initial_diff > self.setpoint_deviation:
            rows.append(data.iloc[-1])

        if not rows:
            return pd.DataFrame()

        htr = pd.concat(rows, axis=1).T
        return htr[~htr.index.duplicated(keep="first")]

    def _determine_mode(
        self, conditions: ZoneConditions
    ) -> Optional[OperatingMode]:
        """
        Determines the operational mode based on the provided zone conditions. This
        function evaluates the current zone temperature relative to the heating and
        cooling setpoints, adjusted by a setpoint deviation margin, to ascertain if
        the system should be in heating, cooling, or no specific operational mode.

        :param conditions: Represents the current zone conditions including
            temperature, heating setpoint, and cooling setpoint.
        :type conditions: ZoneConditions
        :return: The determined operating mode, which could be heating, cooling,
            or None if no specific mode is applicable based on the given conditions.
        :rtype: Optional[OperatingMode]

        """
        if (
            conditions.zone_temperature + self.setpoint_deviation
            < conditions.heating_setpoint
        ):
            return OperatingMode.HEATING
        if (
            conditions.zone_temperature - self.setpoint_deviation
            > conditions.cooling_setpoint
        ):
            return OperatingMode.COOLING
        return None


class Carrier(OptimalStartZoneModel):
    """
    Represents a Carrier model used for optimal start zone calculations in HVAC systems.

    The Carrier class provides mechanisms for training operation modes (cooling and heating),
    calculating prestart times based on zone conditions, and adjusting start times according
    to outdoor air temperatures and historical data. The class handles scaling of start times
    based on reference outdoor air temperatures for both heating and cooling modes.

    :ivar c1: Cooling rate coefficients list.
    :type c1: list[float]
    :ivar h1: Heating rate coefficients list.
    :type h1: list[float]
    :ivar oat_clg: Outdoor air temperatures during cooling training.
    :type oat_clg: list[float]
    :ivar oat_htg: Outdoor air temperatures during heating training.
    :type oat_htg: list[float]
    :ivar adjust_time: Adjustment time for start calculation.
    :type adjust_time: float
    """

    # Reference temperatures used for OAT scaling
    _OAT_REF_HEATING = 0.0
    _OAT_REF_COOLING = 100.0

    def __init__(self, config: OptimalStartConfig, schedule_fn: Callable):
        super().__init__(config, schedule_fn)
        self.c1: list[float] = []
        self.h1: list[float] = []
        self.oat_clg: list[float] = []
        self.oat_htg: list[float] = []
        self.adjust_time: float = 0.0

    def train_cooling(self, data: pd.DataFrame) -> None:
        """
        Trains the model in cooling mode using the provided data.

        This function sets the system to operate in cooling mode and
        trains the respective model by utilizing the provided dataset.
        It serves as a specific implementation of training directly
        focused on the cooling operational strategy. The training process
        uses the internal mechanism of the `_train_mode` function.

        :param data: A pandas DataFrame containing the training
            dataset required for the model. Data must be structured
            and preprocessed appropriately to align with the expected
            input format for system training.
        :return: This method does not return any value.
        """
        self._train_mode(data, OperatingMode.COOLING)

    def train_heating(self, data: pd.DataFrame) -> None:
        """
        Trains the model for heating operations using the provided dataset.

        This method prepares the system for heating mode by processing the provided
        dataset within the specified operating mode. It modifies the system's state
        to reflect training completion for heating functionality.

        :param data: The dataset used for training the heating-specific model.
        :type data: pd.DataFrame
        :return: None
        """
        self._train_mode(data, OperatingMode.HEATING)

    def _train_mode(self, data: pd.DataFrame, mode: OperatingMode) -> None:
        """
        Trains the model for the given operating mode using the provided data. The function
        calculates heat transfer rate, temperature difference, time difference, and
        updates training parameters such as coefficients. This function updates internal
        model parameters that represent the state of training based on outdoor temperature
        and calculated rates for heating or cooling modes. If the heat transfer rate table
        is empty or if the time difference is zero, the function exits without making changes
        to the model state.

        :param data: The data used for training containing temperature records and related
            details. Should be provided as a pandas DataFrame.
        :type data: pd.DataFrame
        :param mode: Operating mode for which the training is being performed; should be
            either COOLING or HEATING.
        :type mode: OperatingMode
        :return: None
        """
        htr = self._compute_heat_transfer_rate(data)
        if htr.empty:
            _log.debug("Carrier %s: HTR table is empty.", mode.value)
            return

        time_diff, temp_diff = get_time_temp_diff(htr, self.setpoint_deviation)
        if not time_diff:
            _log.debug("Carrier %s: time_diff is zero.", mode.value)
            return

        rate = temp_diff / time_diff
        label = f"Carrier {mode.value}"
        if not _coefficients_are_valid({"rate": rate}, model_label=label):
            return

        oat_mean = htr["outdoortemperature"].mean()

        if mode is OperatingMode.COOLING:
            self.c1 = trim(self.c1, rate, self.training_period_window)
            self.oat_clg = trim(self.oat_clg, oat_mean, self.training_period_window)
            self.record = {
                "date": format_timestamp(dt.now()),
                "c1": rate,
                "c1_array": self.c1,
            }
        else:
            self.h1 = trim(self.h1, rate, self.training_period_window)
            self.oat_htg = trim(self.oat_htg, oat_mean, self.training_period_window)
            self.record = {
                "date": format_timestamp(dt.now()),
                "h1": rate,
                "h1_array": self.h1,
            }

    def calculate_prestart(self, data: pd.DataFrame) -> float:
        """
        Calculate the prestart time based on the provided data. The method evaluates the
        conditions derived from the data to determine the operational mode. Based on the
        mode, it calculates and returns the appropriate prestart time considering heating,
        cooling, or a fallback to the latest possible start time.

        :param data: DataFrame containing the input data needed to calculate prestart time.
                     It is essential for determining operating conditions and subsequent mode.
        :type data: pd.DataFrame

        :return: Calculated prestart time representing the earliest possible time the system
                 should start operating, based on current conditions and mode.
        :rtype: float
        """
        if data.empty:
            _log.debug("Carrier: empty data — returning earliest start.")
            return self.earliest_start_time

        cond = _extract_zone_conditions(data)
        mode = self._determine_mode(cond)

        if mode is OperatingMode.HEATING:
            return self._prestart_heating(cond)
        if mode is OperatingMode.COOLING:
            return self._prestart_cooling(cond)
        return self.latest_start_time

    def _prestart_heating(self, cond: ZoneConditions) -> float:
        """
        Calculates the pre-start heating time based on zone conditions and internal model
        parameters.

        This method evaluates the difference between the heating setpoint and the current
        zone temperature to determine the delta that must be accounted for during heating.
        It applies a smoothing coefficient derived from historical data and scales the
        heating estimation based on the relationship between outdoor air temperature (OAT)
        and a reference OAT value. In cases where there is no historical data (`self.h1`),
        the earliest start time for heating is returned as a default fallback.

        The scaling factor is influenced by the ratio of the reference OAT to the current
        OAT, adjusted relative to the historical reference. This helps form a context-
        specific adjustment that reflects environmental changes, ensuring the pre-start
        heating calculation remains accurate under varying conditions.

        :param cond: ZoneConditions instance containing current zone temperature, outdoor
                     air temperature, and heating setpoint information.
        :type cond: ZoneConditions
        :return: Estimated pre-start heating time in float representing the computed
                 adjustment or earliest start time.
        :rtype: float
        """
        if not self.h1:
            return self.earliest_start_time

        delta = cond.heating_setpoint - cond.zone_temperature
        coeff = ema(self.h1)
        oat_ref = ema(self.oat_htg) if self.oat_htg else cond.outdoor_air_temperature

        # Scale rate by the ratio of current to training OAT distance from reference.
        oat_ratio = (
            (self._OAT_REF_HEATING - cond.outdoor_air_temperature)
            / (self._OAT_REF_HEATING - oat_ref)
        )
        return delta / (oat_ratio * coeff)

    def _prestart_cooling(self, cond: ZoneConditions) -> float:
        """
        Calculates the prestart cooling duration based on current zone conditions.

        This function determines the cooling duration required to bring a zone's
        temperature to its cooling setpoint before initiating the cooling process.
        It accounts for the zone's deviation from its cooling setpoint, the outdoor
        air temperature ratio, and a coefficient derived from an exponential moving
        average calculation.

        :param cond: The current zone conditions, including temperature and
            setpoints.
        :type cond: ZoneConditions
        :return: The calculated prestart cooling duration.
        :rtype: float
        """
        if not self.c1:
            return self.earliest_start_time

        delta = cond.zone_temperature - cond.cooling_setpoint
        coeff = ema(self.c1)
        oat_ref = ema(self.oat_clg) if self.oat_clg else cond.outdoor_air_temperature

        oat_ratio = (
            (self._OAT_REF_COOLING - cond.outdoor_air_temperature)
            / (self._OAT_REF_COOLING - oat_ref)
        )
        return delta / (oat_ratio * coeff)


class Siemens(OptimalStartZoneModel):
    """
    Represents a Siemens Optimal Start Zone Model. This class provides training
    and prediction mechanisms for cooling and heating coefficients to optimize
    the start times of HVAC systems.

    It determines efficient prestart times based on computed coefficients for
    cooling and heating modes, using heat transfer rate calculations and environmental
    conditions.

    :ivar c1: Cooling coefficient array representing the first cooling coefficient.
    :type c1: list[float]
    :ivar c2: Cooling coefficient array representing the second cooling coefficient.
    :type c2: list[float]
    :ivar h1: Heating coefficient array representing the first heating coefficient.
    :type h1: list[float]
    :ivar h2: Heating coefficient array representing the second heating coefficient.
    :type h2: list[float]
    :ivar adjust_time: Adjusted time to be considered in start time calculations.
    :type adjust_time: float
    """

    _OSP_SCALE_FACTOR = 10.0

    def __init__(self, config: OptimalStartConfig, schedule_fn: Callable):
        super().__init__(config, schedule_fn)
        self.c1: list[float] = []
        self.c2: list[float] = []
        self.h1: list[float] = []
        self.h2: list[float] = []
        self.adjust_time: float = 0.0

    def train_cooling(self, data: pd.DataFrame) -> None:
        """
        Trains the cooling system model using the provided data and computes new
        coefficients for the heat transfer rate based on the relationship between
        zone temperature, cooling setpoints, and outdoor temperature.

        :param data: The historical data required for calculating and training the cooling model.
                     It must include zone temperature, cooling setpoint, and outdoor temperature.
                     The data is expected to be in the form of a pandas DataFrame.
        :type data: pd.DataFrame

        :return: This method does not return a value. The computed coefficients and
                 other relevant information are stored as class attributes.
        :rtype: None

        :raises ValueError: If the provided data does not include the required columns for training.
        :raises TypeError: If the data argument is not of type pd.DataFrame.
        """
        htr = self._compute_heat_transfer_rate(data)
        if htr.empty:
            _log.debug("Siemens cooling: HTR table is empty.")
            return

        zone_sp_diff = htr["zonetemperature"].iloc[0] - htr["coolingsetpoint"].iloc[0]
        outdoor_sp_diff = htr["outdoortemperature"].iloc[0] - htr["coolingsetpoint"].iloc[0]

        c1, c2 = self._fit_coefficients(data, htr, zone_sp_diff, outdoor_sp_diff, "cooling")
        if c1 is None:
            return

        self.c1 = trim(self.c1, c1, self.training_period_window)
        self.c2 = trim(self.c2, c2, self.training_period_window)
        self.record = {
            "date": format_timestamp(dt.now()),
            "c1": c1, "c1_array": self.c1,
            "c2": c2, "c2_array": self.c2,
        }

    def train_heating(self, data: pd.DataFrame) -> None:
        """
        Trains the heating model by computing heat transfer rate, fitting coefficients,
        and updating existing records with new training data. This process adjusts
        heating-related coefficients based on provided input data and updates the model
        accordingly.

        :param data:
            A pandas DataFrame that contains the input data required for training,
            including columns for heating setpoint, zone temperature, and outdoor
            temperature.
        :return:
            None
        """
        htr = self._compute_heat_transfer_rate(data)
        if htr.empty:
            _log.debug("Siemens heating: HTR table is empty.")
            return

        zone_sp_diff = htr["heatingsetpoint"].iloc[0] - htr["zonetemperature"].iloc[0]
        outdoor_sp_diff = htr["heatingsetpoint"].iloc[0] - htr["outdoortemperature"].iloc[0]

        h1, h2 = self._fit_coefficients(data, htr, zone_sp_diff, outdoor_sp_diff, "heating")
        if h1 is None:
            return

        self.h1 = trim(self.h1, h1, self.training_period_window)
        self.h2 = trim(self.h2, h2, self.training_period_window)
        self.record = {
            "date": format_timestamp(dt.now()),
            "h1": h1, "h1_array": self.h1,
            "h2": h2, "h2_array": self.h2,
        }

    def _fit_coefficients(
        self,
        data: pd.DataFrame,
        htr: pd.DataFrame,
        zone_sp_diff: float,
        outdoor_sp_diff: float,
        label: str,
    ) -> tuple[Optional[float], Optional[float]]:
        """
        Fits coefficients based on input data and calculated differences while applying
        clamping and validation to ensure valid outputs. This method utilizes
        operational scaling factors and dependencies to derive the required coefficients
        that satisfy the specified constraints.

        :param data: Input DataFrame containing required time series data for calculations.
                     Expected to include relevant time and temperature-related information.
        :type data: pd.DataFrame
        :param htr: Input DataFrame containing heater data used for calculating time and
                    temperature differences.
        :type htr: pd.DataFrame
        :param zone_sp_diff: Zone setpoint difference used in coefficient adjustments.
        :type zone_sp_diff: float
        :param outdoor_sp_diff: Outdoor setpoint difference used for scaling calculations.
        :type outdoor_sp_diff: float
        :param label: An identifier used for logging and debugging processes.
        :type label: str
        :return: A tuple containing two coefficients:
                 - coeff1: A scale factor derived from time and temperature differences.
                 - coeff2: A coefficient adjusted based on the outdoor setpoint difference.
        :return type: tuple[Optional[float], Optional[float]]
        """
        time_diff, temp_diff = get_time_temp_diff(htr, self.setpoint_deviation)
        if not time_diff:
            _log.debug("Siemens %s: time_diff is zero.", label)
            return None, None

        time_one_degree = get_time_target(data, 1.0)
        if np.isnan(time_one_degree):
            _log.debug("Siemens %s: time_one_degree is NaN.", label)
            return None, None

        coeff1 = (time_diff / temp_diff) / 60.0
        coeff2 = (
                (time_diff / 60.0 - coeff1 * zone_sp_diff)
                * self._OSP_SCALE_FACTOR
                / (outdoor_sp_diff * zone_sp_diff)
        )

        model_label = f"Siemens {label}"

        # coeff1 must be strictly positive
        if not _coefficients_are_valid({"coeff1": coeff1}, model_label=model_label):
            return None, None

        # coeff2 is clamped rather than rejected
        if not np.isfinite(coeff2):
            _log.debug("%s: non-finite coeff2.", model_label)
            return None, None
        if coeff2 <= 0:
            _log.debug("%s: coeff2 is non-positive — clamping to 0.", model_label)
            coeff2 = 0.0

        return coeff1, coeff2

    def calculate_prestart(self, data: pd.DataFrame) -> float:
        """
        Calculates the prestart time required for system operation based on the zone
        conditions, mode (heating or cooling), and configuration parameters. This method
        evaluates zone setpoints, temperature differences, and other factors to determine
        the necessary start time. For heating and cooling modes, it adjusts the timing
        using configured coefficients and an outdoor-air-scaling factor. In case of missing
        parameters or unsupported modes, it defaults to earliest or latest start time
        accordingly.

        :param data: Input DataFrame containing zone conditions and setpoints. The DataFrame is
            expected to provide information including but not limited to zone temperature,
            heating setpoints, cooling setpoints, and outdoor air temperature. It is
            assumed the DataFrame is pre-processed and structured for the necessary calculations.
        :return: Float value representing the calculated prestart time in seconds
            based on zone conditions and mode. Defaults to the earliest or latest start
            time when the necessary parameters are missing or mode conditions are unsupported.
        :rtype: float
        """
        if data.empty:
            _log.debug("Siemens: empty data — returning earliest start.")
            return self.earliest_start_time

        cond = _extract_zone_conditions(data)
        mode = self._determine_mode(cond)

        if mode is OperatingMode.HEATING:
            if not self.h1 or not self.h2:
                return self.earliest_start_time
            zsp = max(0.0, cond.heating_setpoint - cond.zone_temperature)
            osp = max(0.0, cond.heating_setpoint - cond.outdoor_air_temperature)
            coeff1, coeff2 = ema(self.h1), ema(self.h2)

        elif mode is OperatingMode.COOLING:
            if not self.c1 or not self.c2:
                return self.earliest_start_time
            zsp = max(0.0, cond.zone_temperature - cond.cooling_setpoint)
            osp = max(0.0, cond.outdoor_air_temperature - cond.cooling_setpoint)
            coeff1, coeff2 = ema(self.c1), ema(self.c2)

        else:
            return self.latest_start_time

        start_time = (
            (coeff1 * zsp + coeff2 * zsp * osp / self._OSP_SCALE_FACTOR)
            * 60.0
            + self.adjust_time
        )
        return start_time


class Johnson(OptimalStartZoneModel):
    """
    Represents the Johnson model used for calculating optimal prestart times and
    analyzing thermal behavior in a given zone.

    This class inherits from OptimalStartZoneModel and implements methods for
    training heating and cooling system parameters, fitting coefficients, and
    predicting the prestart time required for zones to reach target setpoints.
    The coefficients related to heat transfer and thermal response are internally
    managed and updated using training data.

    :ivar c1: Represents the coefficient related to the first heat transfer
        parameter for cooling mode.
    :type c1: float
    :ivar c2: Represents the coefficient related to the second heat transfer
        parameter for cooling mode.
    :type c2: float
    :ivar h1: Represents the coefficient related to the first heat transfer
        parameter for heating mode.
    :type h1: float
    :ivar h2: Represents the coefficient related to the second heat transfer
        parameter for heating mode.
    :type h2: float
    :ivar c1_list: Historical values of coefficient c1 for cooling mode.
    :type c1_list: list[float]
    :ivar c2_list: Historical values of coefficient c2 for cooling mode.
    :type c2_list: list[float]
    :ivar h1_list: Historical values of coefficient h1 for heating mode.
    :type h1_list: list[float]
    :ivar h2_list: Historical values of coefficient h2 for heating mode.
    :type h2_list: list[float]
    """

    def __init__(self, config: OptimalStartConfig, schedule_fn: Callable):
        super().__init__(config, schedule_fn)
        self.c1: float = 0.0
        self.c2: float = 0.0
        self.h1: float = 0.0
        self.h2: float = 0.0
        self.c1_list: list[float] = []
        self.c2_list: list[float] = []
        self.h1_list: list[float] = []
        self.h2_list: list[float] = []

    def train_cooling(self, data: pd.DataFrame) -> None:
        """
        Trains the cooling model by computing and updating coefficients related to cooling
        performance based on the input data. The method extracts temperature and setpoint
        differences from the provided dataset, fits coefficients using internal fitting
        logic, trims historical coefficients based on a training period window, and
        updates exponential moving averages. It also records the latest computed
        coefficients and their respective arrays along with a timestamp.

        :param data: A pandas DataFrame containing the training data with at least
            "zonetemperature" and "coolingsetpoint" columns.
        :type data: pd.DataFrame

        :return: None
        :rtype: None
        """
        if data.empty:
            return
        initial_diff = data["zonetemperature"].iloc[0] - data["coolingsetpoint"].iloc[0]
        result = self._fit_coefficients(data, initial_diff, "cooling")
        if result is None:
            return

        coeff1, coeff2 = result
        self.c1_list = trim(self.c1_list, coeff1, self.training_period_window)
        self.c1 = ema(self.c1_list)
        self.c2_list = trim(self.c2_list, coeff2, self.training_period_window)
        self.c2 = ema(self.c2_list)
        self.record = {
            "date": format_timestamp(dt.now()),
            "c1": coeff1, "c1_array": self.c1_list,
            "c2": coeff2, "c2_array": self.c2_list,
        }

    def train_heating(self, data: pd.DataFrame) -> None:
        """
        Trains heating system parameters using the difference between heating set points and
        zone temperatures. The function computes coefficients from the training data and
        stores the results in exponential moving averages and a record with relevant
        training details.

        :param data: A DataFrame containing heating system data. The DataFrame must include
            'heatingsetpoint' and 'zonetemperature' columns. An empty DataFrame results in
            an early exit from the computation.
        :type data: pd.DataFrame
        :return: None
        """
        if data.empty:
            return
        initial_diff = data["heatingsetpoint"].iloc[0] - data["zonetemperature"].iloc[0]
        result = self._fit_coefficients(data, initial_diff, "heating")
        if result is None:
            return

        coeff1, coeff2 = result
        self.h1_list = trim(self.h1_list, coeff1, self.training_period_window)
        self.h1 = ema(self.h1_list)
        self.h2_list = trim(self.h2_list, coeff2, self.training_period_window)
        self.h2 = ema(self.h2_list)
        self.record = {
            "date": format_timestamp(dt.now()),
            "h1": coeff1, "h1_array": self.h1_list,
            "h2": coeff2, "h2_array": self.h2_list,
        }

    def _fit_coefficients(
        self,
        data: pd.DataFrame,
        initial_diff: float,
        label: str,
    ) -> Optional[tuple[float, float]]:
        """
        Fits the coefficients required for modeling based on the provided data
        and parameters. This method computes the coefficients 'coeff1' and 'coeff2'
        related to the heat transfer rate and temperature deviations. The coefficients
        are validated before returning. If any condition fails, the method returns None.

        :param data: A pandas DataFrame containing the time series data required
            for computation of heat transfer rates and other parameters.
        :type data: pd.DataFrame
        :param initial_diff: The initial temperature difference used as input for
            calculating the coefficient 'coeff1'.
        :type initial_diff: float
        :param label: A string label to identify the computation process or source
            of the data.
        :type label: str
        :return: A tuple containing the computed coefficients 'coeff1' and 'coeff2'
            if successful, else None.
        :rtype: Optional[tuple[float, float]]
        """
        htr = self._compute_heat_transfer_rate(data)
        if htr.empty:
            _log.debug("Johnson %s: HTR table is empty.", label)
            return None

        time_diff, temp_diff = get_time_temp_diff(htr, self.setpoint_deviation)
        if not time_diff:
            _log.debug("Johnson %s: time_diff is zero.", label)
            return None

        coeff2 = get_time_target(data, 1.0)
        if np.isnan(coeff2):
            _log.debug("Johnson %s: time_one_degree is NaN.", label)
            return None

        if (time_diff - coeff2) >= 1:
            coeff1 = (time_diff - coeff2) / (initial_diff ** 2)
        else:
            coeff1 = time_diff / (temp_diff * 10)

        model_label = f"Johnson {label}"
        if not _coefficients_are_valid(
            {"coeff1": coeff1, "coeff2": coeff2}, model_label=model_label
        ):
            return None

        return coeff1, coeff2

    # -- Prediction ---------------------------------------------------------

    def calculate_prestart(self, data: pd.DataFrame) -> float:
        """
        Calculates the prestart time based on the conditions and mode of operation.

        The method evaluates the provided data for zone conditions to determine the
        operating mode (heating or cooling). Based on this mode, it computes a zone
        setpoint difference and applies coefficients to calculate the prestart time
        needed. If the dataset is empty or the required parameters are not available,
        it returns the earliest start time. Should no valid mode be found, the method
        returns the latest start time.

        :param data: Input dataframe containing zone condition data.
        :type data: pd.DataFrame
        :return: Computed prestart time as a float.
        :rtype: float
        """
        if data.empty:
            _log.debug("Johnson: empty data — returning earliest start.")
            return self.earliest_start_time

        cond = _extract_zone_conditions(data)
        mode = self._determine_mode(cond)

        if mode is OperatingMode.HEATING:
            if not self.h1_list or not self.h2_list:
                return self.earliest_start_time
            zsp = cond.zone_temperature - cond.heating_setpoint
            coeff1, coeff2 = self.h1, self.h2

        elif mode is OperatingMode.COOLING:
            if not self.c1_list or not self.c2_list:
                return self.earliest_start_time
            zsp = cond.cooling_setpoint - cond.zone_temperature
            coeff1, coeff2 = self.c1, self.c2

        else:
            return self.latest_start_time

        return coeff1 * zsp * zsp + coeff2


class Sbs(OptimalStartZoneModel):
    """
    Represents a Specific Building Simulation (SBS) model for optimal start
    zone management.

    This class extends the `OptimalStartZoneModel` to provide methods for
    training heating and cooling models as well as calculating prestart
    based on setpoint deviations and other environmental conditions. It
    implements autoregressive techniques to estimate internal parameters
    such as alpha values and supports consistent training routines for both
    heating and cooling systems.

    :ivar alpha: The exponential moving average (EMA) alpha value used in
                 autoregressive estimation.
    :type alpha: float
    :ivar alpha_list: A list of alpha values obtained during training for
                      EMA calculation.
    :type alpha_list: list[float]
    :ivar sp_error_occ: The calculated setpoint error occurrence after
                        prediction processing.
    :type sp_error_occ: float
    :ivar _e_last: Tracks the previous error value during training for the
                   autoregressive estimator.
    :type _e_last: float
    :ivar _sum_xy: Tracks the cumulative product of x and y for alpha
                   estimation.
    :type _sum_xy: float
    :ivar _sum_x2: Tracks the cumulative sum of x squared for alpha
                   estimation.
    :type _sum_x2: float
    :ivar _cumulative_time: Tracks the accumulated time during training
                            to calculate averages.
    :type _cumulative_time: float
    """

    _ALPHA_LOWER = 0.001
    _ALPHA_UPPER = 0.999

    def __init__(self, config: OptimalStartConfig, schedule_fn: Callable):
        super().__init__(config, schedule_fn)
        default_start = self.earliest_start_time + self.latest_start_time
        self.alpha: float = np.exp(-1.0 / default_start)
        self.alpha_list: list[float] = []
        self.sp_error_occ: float = 0.0
        self._reset_estimation()

    def _reset_estimation(self) -> None:
        """
        Resets the internal estimation values to their initial state.

        This method is used to initialize or clear the internally stored
        values that support the estimation computations. All internal
        attributes specific to state maintenance are re-initialized to
        default values.

        :return: None
        """
        self._sum_xy: float = 0.0
        self._sum_x2: float = 0.0
        self._cumulative_time: float = 0.0

    # -- Training -----------------------------------------------------------

    def train_heating(self, data: pd.DataFrame) -> None:
        """
        Trains the heating model using the provided data.

        This method utilizes the same autoregressive estimator as
        the cooling model. It delegates the training process to
        the `train_cooling` method, ensuring consistency between
        both heating and cooling models in how they are trained.

        :param data: Input data for training the model.
                     This should be a pandas DataFrame containing
                     the relevant training data.

        :return: None
        """
        # Heating and cooling share the same autoregressive estimator.
        self.train_cooling(data)

    def train_cooling(self, data: pd.DataFrame) -> None:
        """
        Trains the cooling model based on provided data.

        This method processes temperature and setpoint information to calculate
        intermediate variables such as the mid-point of setpoints, deadband range,
        and error values. The error values are adjusted based on the deadband
        logic and then iteratively used to update internal state variables
        necessary for model training. The trained alpha value is estimated
        and recorded alongside training metadata for future analysis.

        :param data: A DataFrame containing temperature and setpoint data
                     used for training. It must include the following columns:
                     - 'coolingsetpoint': Cooling setpoint temperature.
                     - 'heatingsetpoint': Heating setpoint temperature.
                     - 'zonetemperature': Current zone temperature.
        :return: None
        """
        self._reset_estimation()

        data = data.copy()
        data["setpoint_mid"] = (data["coolingsetpoint"] + data["heatingsetpoint"]) / 2.0
        data["deadband"] = data["coolingsetpoint"] - data["heatingsetpoint"]
        data["error_raw"] = data["setpoint_mid"] - data["zonetemperature"]
        data["error"] = data.apply(
            lambda row: self._apply_deadband(row["error_raw"], row["deadband"]),
            axis=1,
        )

        avg_timestep = (
            data.index.to_series().diff().dt.total_seconds().div(60).mean()
        )

        for _, row in data.iterrows():
            self._cumulative_time += avg_timestep
            x = self._e_last
            y = row["error"]
            self._sum_x2 += x ** 2
            self._sum_xy += x * y
            self._e_last = y

        new_alpha = self._estimate_alpha()
        self.record = {
            "date": format_timestamp(dt.now()),
            "new_alpha": new_alpha,
            "alpha": self.alpha,
            "alpha_array": self.alpha_list,
        }

    def _estimate_alpha(self) -> Optional[float]:
        """
        Estimates the alpha value based on the sum of squares of x and the
        product of x and y. Adjusts the estimation by constraining it within
        pre-defined bounds and applying exponential moving average (EMA).

        :return: The estimated alpha value if the calculations and conditions
                 are met, otherwise None.
        :rtype: Optional[float]
        """
        if self._sum_x2 <= 0 or self._sum_xy <= 0:
            return None

        raw = self._sum_xy / self._sum_x2
        new_alpha = float(np.clip(raw, self._ALPHA_LOWER, self._ALPHA_UPPER))

        self.alpha_list = trim(self.alpha_list, new_alpha, self.training_period_window)
        self.alpha = ema(self.alpha_list)
        return new_alpha

    def calculate_prestart(self, data: pd.DataFrame) -> float:
        """
        Calculates the prestart time for a given zone based on the conditions extracted
        from the provided data. This function uses the setpoint deviation, current zone
        temperature, and the zone's cooling and heating setpoints, accounting for a
        deadband to avoid rapid state changes. It computes the logarithmic progression
        towards target conditions to determine the required prestart time. The result is
        clipped between the latest and earliest permissible start times.

        :param data: A pandas DataFrame containing the relevant zone data, including
            cooling and heating setpoints, and the zone temperature.
        :type data: pd.DataFrame

        :return: The prestart time, clipped within the range of earliest and latest
            start times as specified.
        :rtype: float
        """
        if data.empty:
            _log.debug("SBS: empty data — returning earliest start.")
            return self.earliest_start_time

        cond = _extract_zone_conditions(data)
        midpoint = (cond.cooling_setpoint + cond.heating_setpoint) / 2.0
        deadband = cond.cooling_setpoint - cond.heating_setpoint

        error = abs(self._apply_deadband(midpoint - cond.zone_temperature, deadband))

        if error > 0:
            prestart = np.log(self.setpoint_deviation / error) / np.log(self.alpha)
        else:
            prestart = self.latest_start_time

        prestart = float(np.clip(prestart, self.latest_start_time, self.earliest_start_time))
        self.sp_error_occ = error * np.power(self.alpha, self.earliest_start_time)

        _log.debug(
            "SBS: error=%.2f  alpha=%.4f  prestart=%.1f", error, self.alpha, prestart
        )
        return prestart

    @staticmethod
    def _apply_deadband(error: float, deadband: float) -> float:
        """
        Applies a deadband to the provided error value. A deadband is a range within
        which the input values are considered insignificant (zeroed). Values outside the
        deadband range will be adjusted accordingly to account for the deadband effect.

        :param error: The input error value to which the deadband will be applied.
        :type error: float
        :param deadband: The range of the deadband within which values will be zeroed.
        :type deadband: float
        :return: The adjusted error value after applying the deadband. The value is zero
            if the input error is within the deadband range; otherwise, returns the
            adjusted error accounting for the deadband.
        :rtype: float
        """
        half = deadband / 2.0
        if abs(error) <= half:
            return 0.0
        return error - half if error > 0 else error + half