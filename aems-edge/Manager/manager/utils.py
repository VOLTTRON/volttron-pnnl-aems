# -*- coding: utf-8 -*- {{{
# ===----------------------------------------------------------------------===
#
#                 AEMS Application
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
# }}}
import datetime as dt
import logging
from typing import Literal

import numpy as np
import pandas as pd
from manager.points import DFPoints as dfpts
from volttron.platform.agent.utils import format_timestamp

pd.options.mode.chained_assignment = None
_log = logging.getLogger(__name__)

Minutes = int
Error = float
TimeDiff = float
TempDiff = float

ZONE_TEMP = dfpts.zonetemperature.value
COOLING_SETPOINT = dfpts.coolingsetpoint.value
HEATING_SETPOINT = dfpts.heatingsetpoint.value
TEMP_DIFF = dfpts.tempdiff.value
CONDITIONING = dfpts.conditioning.value
TIME_DIFF = 'timediff'


def parse_df(df: pd.DataFrame, condition: Literal["heating", "cooling"]) -> pd.DataFrame:
    """
    Filters and processes the dataframe based on the specified condition ('cooling' or 'heating').
    Eliminates data where the RTU has achieved the setpoint and filters further based on time differences.
    :param df: The input dataframe to process
    :param condition: The operating mode, either 'cooling' or 'heating'
    :return: Filtered dataframe
    """
    if condition not in ['heating', 'cooling']:
        return pd.DataFrame()

    # Filter rows and calculate temperature differences
    def _filter_by_condition(df: pd.DataFrame, condition: Literal["heating", "cooling"]) -> pd.DataFrame:
        if condition == 'cooling':
            filtered = df[df[ZONE_TEMP] <= df[COOLING_SETPOINT]]
            df[TEMP_DIFF] = df[ZONE_TEMP] - df[COOLING_SETPOINT]
        else:  # condition =df= 'heating'
            filtered = df[df[ZONE_TEMP] >= df[HEATING_SETPOINT]]
            df[TEMP_DIFF] = df[HEATING_SETPOINT] - df[ZONE_TEMP]
        return filtered

    filtered_temp = _filter_by_condition(df, condition)

    # Calculate rolling mean for conditioning
    df[CONDITIONING] = df[condition].rolling(window=10).mean().fillna(1)

    # Filter where conditioning equals 0
    filtered_conditioning = df[df[CONDITIONING] == 0]

    # Calculate time differences and filter for differences > 10 minutes
    df[TIME_DIFF] = df.index.to_series().diff()
    time_in_excess = df[df[TIME_DIFF] >= pd.Timedelta(minutes=10)]

    # Truncate at the earliest stop condition.
    stop_labels = [f.index[0] for f in (filtered_temp, filtered_conditioning, time_in_excess) if not f.empty]
    if stop_labels:
        df = df[df.index < min(stop_labels)]

    # Filter final dataframe based on the condition being active
    df = df[df[condition] > 0]
    df = df.resample('1min').mean()
    return df


def _shift_time(_time: dt.time, minutes: float) -> dt.time:
    """
    Shift a time-of-day by ``minutes``, clamped to the same day (00:00 - 23:59)
    rather than wrapping past midnight.
    """
    base = dt.datetime.combine(dt.date(2000, 1, 2), _time)
    shifted = base + dt.timedelta(minutes=minutes)
    if shifted.date() < base.date():
        return dt.time.min
    if shifted.date() > base.date():
        return dt.time(23, 59)
    return shifted.time()


def offset_time(_time: dt.time, offset: Minutes) -> dt.time:
    """
    Return ``_time`` shifted forward by ``offset`` minutes (clamped to 23:59).
    """
    return _shift_time(_time, offset)


def trim(lst: list, new_value: float, cutoff: int) -> list:
    """
    Append ``[timestamp, new_value]`` to the history and keep the last ``cutoff`` entries.
    Non-finite values are ignored. Legacy bare-float entries are normalized to pairs.

    :param lst: List of previous values
    :param new_value: The new value to add to the list
    :param cutoff: The maximum length of the list
    :return: A new list trimmed to the cutoff length
    """
    if not np.isfinite(new_value):
        return lst
    history = [item if isinstance(item, list) else ['', item] for item in lst]
    history.append([format_timestamp(dt.datetime.now()), float(new_value)])
    return history[-cutoff:] if cutoff > 0 else history


def get_time_temp_diff(htr: pd.DataFrame, target: Error) -> tuple[TimeDiff, TempDiff]:
    """
    Retrieve the time (minutes) and temperature delta(f) from the pre-conditioning period.

    :param htr: The input data dataframe
    :type htr: pd.DataFrame
    :param target: The acceptable deviation between the zone temperature and setpoint
    :type target: Error
    :return: A tuple containing the time and temperature delta
    :rtype: tuple[TimeDiff, TempDiff]
    """
    # htr = htr[htr[dfpt.tempdiff.value] >= target]
    htr[dfpts.timediff.value] = htr.index.to_series().diff().dt.total_seconds() / 60
    time_diff = htr[dfpts.timediff.value].sum(axis=0)
    temp_diff = htr[dfpts.tempdiff.value].iloc[0] - htr[dfpts.tempdiff.value].iloc[-1]
    return time_diff, temp_diff


def get_time_target(data: pd.DataFrame, target: Error) -> float:
    """
    Retrieve the approximate time (minutes) to reach the target temperature delta.

    :param data: The input data dataframe
    :type data: pd.DataFrame
    :param target: The target temperature delta from initial conditions.
    :type target: Error
    :return: The approximate time to reach the target temperature delta
    :rtype: float
    """
    try:
        temp_diff = data[TEMP_DIFF]
        idx = data[(temp_diff.iloc[0] - temp_diff) >= target].index[0]
        target_df = data.loc[:idx]
    except IndexError:
        return 0
    _dt = (target_df.index[-1] - target_df.index[0]).total_seconds() / 60
    temp = target_df[TEMP_DIFF].iloc[0] - target_df[TEMP_DIFF].iloc[-1]
    return _dt / temp if temp else float('nan')


def ema(lst: list) -> float:
    """
    Exponential moving average of a coefficient history (oldest first).

    Uses the standard smoothing constant ``2 / (n + 1)`` for ``n`` entries: the
    newest value gets weight ``a``, the next ``a(1 - a)``, and so on, with the
    remaining weight ``(1 - a)^n`` on the oldest value so the weights sum to 1.
    Entries may be bare values or ``[timestamp, value]`` pairs (see :func:`trim`).

    :param lst: History of values, oldest first
    :return: The exponential moving average (0 for an empty history)
    """
    values = [item[1] if isinstance(item, list) else item for item in lst]
    if not values:
        return 0
    n = len(values)
    smoothing = 2.0 / (n + 1.0)
    newest_first = values[::-1]
    result = sum(v * smoothing * (1.0 - smoothing) ** k for k, v in enumerate(newest_first))
    return result + newest_first[-1] * (1.0 - smoothing) ** n


def calculate_prestart_time(end: dt.time, prestart: Minutes) -> dt.time:
    """
    Return ``end`` shifted back by ``prestart`` minutes (clamped to 00:00).
    """
    return _shift_time(end, -prestart)


def get_operating_mode(data: pd.DataFrame) -> Literal['heating', 'cooling', None]:
    """
    Determine the operating mode (heating, cooling) of the RTU based upon
    the dataframe.

    :param data: The input data dataframe
    :type data: pd.DataFrame
    :return: The operating mode of the RTU
    :rtype: str
    """
    mode = None
    cooling_count = data['cooling'].sum()
    heating_count = data['heating'].sum()
    if cooling_count > 0 and heating_count > 0:
        first = data.iloc[0]
        if first[ZONE_TEMP] > first[COOLING_SETPOINT]:
            mode = 'cooling'
        elif first[ZONE_TEMP] < first[HEATING_SETPOINT]:
            mode = 'heating'
        return mode
    if cooling_count > 0:
        mode = 'cooling'
    elif heating_count > 0:
        mode = 'heating'
    return mode
