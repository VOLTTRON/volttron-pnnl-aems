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


def clean_array(array: list) -> list:
    """
    Returns list of coefficients with nan, -inf, inf, negative
    numbers, and outliers removed.
        :param array: (list) coefficients from models
        :return: array (list)
    """
    try:
        array = [item if isinstance(item, list) else ['', item] for item in array]
        array_values = [item[1] for item in array if np.isfinite(item[1]) and item[1] >= 0]
        if len(array) > 3:
            u = np.mean(array_values)
            s = np.std(array_values)
            if np.isfinite(u) and np.isfinite(s):
                array = [e for e in array if (u - 2.0 * s <= e[1] <= u + 2.0 * s)]
    except Exception as ex:
        _log.debug(f'Array parser error: {array} -- ex: {ex}')
    return array


def parse_df(df: pd.DataFrame, condition: str) -> pd.DataFrame:
    """
    Based on the mode (heating, cooling) this function determines the deviation
    of the zone temperature from the setpoint during the pre-conditioning period and
    eliminates data where the RTU has acheived the desired setpoint.

    :param df: The input data dataframe
    :type df: pd.DataFrame
    :param condition: heating or cooling
    :type condition: str
    :return: A new dataframe with the data filtered based on the condition
    :rtype: pd.DataFrame
    """

    if condition not in ['heating', 'cooling']:
        return pd.DataFrame()

    if condition == 'cooling':
        data_sort = df[df[dfpts.zonetemperature.value] <= df[dfpts.coolingsetpoint.value]]
        df[dfpts.tempdiff.value] = df[dfpts.zonetemperature.value] - df[dfpts.coolingsetpoint.value]
    else:
        data_sort = df[df[dfpts.zonetemperature.value] >= df[dfpts.heatingsetpoint.value]]
        df[dfpts.tempdiff.value] = df[dfpts.heatingsetpoint.value] - df[dfpts.zonetemperature.value]
    df[dfpts.conditioning.value] = df[condition].rolling(window=10).mean().fillna(value=1, inplace=False)
    data_sort_mode = df[df[dfpts.conditioning.value] == 0]
    if not data_sort.empty:
        idx = data_sort.index[0]
        df = df.loc[:idx]
    if not data_sort_mode.empty:
        idx = data_sort_mode.index[0]
        df = df.loc[:idx]
    df = df[df[condition] > 0]
    return df


def offset_time(_time: dt.time, offset: Minutes) -> dt.time:
    """
    Creates a new time based upon the offset in minutes from the original time.

    :param _time: datetime.time object
    :type _time: dt.time
    :param offset: Number of minutes to offset
    :type offset: int
    :return: A new time object with offset applied
    :rtype: dt.time
    """
    _offset_hr, offset_min = divmod(offset, 60)
    _hour = _time.hour + _offset_hr
    _minute = _time.minute + offset_min
    if _minute >= 60:
        _hour += 1
        _minute = _minute - 60
    ret_time = dt.time(hour=_hour, minute=_minute)
    return ret_time


def trim(lst: list, new_value: float, cutoff: int) -> list:
    """
    Add a new value to the list and trim the list to the cutoff length.

    :param lst: List of previous values
    :type lst: list
    :param new_value: The new value to add to the list
    :type new_value: float
    :param cutoff: The maximum length of the list
    :type cutoff: int
    :return: A new list trimmed to the cutoff length
    :rtype: list
    """

    if not np.isfinite(new_value):
        return lst
    lst.append([format_timestamp(dt.datetime.now()), new_value])
    lst = clean_array(lst)
    if lst and len(lst) > cutoff:
        lst = lst[-cutoff:]
    return lst


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
    htr.loc[:, dfpts.timediff.value] = htr.index.to_series().diff().dt.total_seconds() / 60
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
        idx = data[(data[dfpts.tempdiff.value][0] - data[dfpts.tempdiff.value]) >= target].index[0]
        target_df = data.loc[:idx]
    except IndexError:
        return 0
    _dt = (target_df.index[-1] - target_df.index[0]).total_seconds() / 60
    temp = target_df[dfpts.tempdiff.value][0] - target_df[dfpts.tempdiff.value][-1]

    return _dt / temp


def ema(lst: list) -> float:
    """
    Calculate the exponential moving average of a list of values.

    :param lst: List of values
    :type lst: list
    :return: The exponential moving average
    :rtype: float
    """
    smoothing_constant = 2.0 / (len(lst) + 1.0) * 2.0 if lst else 1.0
    smoothing_constant = smoothing_constant if smoothing_constant <= 1.0 else 1.0
    _sort = lst[::-1]
    ema = 0
    _sort = [item[1] if isinstance(item, list) else item for item in _sort]
    for n in range(len(lst)):
        ema += _sort[n] * smoothing_constant * (1.0 - smoothing_constant)**n
    if _sort:
        ema += _sort[-1] * (1.0 - smoothing_constant)**(len(lst))
    return ema


def calculate_prestart_time(end: dt.time, prestart: Minutes) -> dt.time:
    """
    A function that is slightly different than `func::offset_time` in that
    this function calculates the time based on the end time and the offset.

    :param _time: datetime.time object
    :type _time: dt.time
    :param offset: Number of minutes to offset
    :type offset: Minutes
    :return: A new time object with offset applied
    :rtype: dt.time
    """
    _hours, _minutes = divmod(prestart, 60)
    _minutes = end.minute - _minutes
    if _minutes < 0:
        _minutes = 60 + _minutes
        _hours += 1
    _hours = end.hour - _hours
    start = dt.time(hour=_hours, minute=_minutes)
    return start


def get_cls_attrs(cls) -> dict:
    """
    Retrieve the class attributes that are not callable.

    :return: The class attributes
    :rtype: dict
    """

    # TODO: Should just use inspect.get_members(cls) instead of this function
    d = {
        key: value
        for key, value in cls.__dict__.items() if not key.startswith('__') and not callable(value) and not callable(getattr(value, '__get__', None))
    }
    return d


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
        if data[dfpts.zonetemperature.value][0] > data[dfpts.coolingsetpoint.value][0]:
            mode = 'cooling'
        elif data[dfpts.zonetemperature.value][0] < data[dfpts.heatingsetpoint.value][0]:
            mode = 'heating'
        return mode
    if cooling_count > 0:
        mode = 'cooling'
    elif heating_count > 0:
        mode = 'heating'
    return mode
