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
from datetime import datetime
from typing import Optional

import pandas as pd
from pandas.tseries.holiday import (FR, AbstractHolidayCalendar, Holiday,
                                    USLaborDay, USMemorialDay,
                                    USThanksgivingDay, nearest_workday)

from .holiday_utils import ALL_HOLIDAYS, OBSERVANCE

_log = logging.getLogger(__name__)
# Default holiday list
RULES = [
    Holiday("New Year's Day", month=1, day=1, observance=nearest_workday),
    USMemorialDay,
    Holiday(
        'Juneteenth National Independence Day',
        month=6,
        day=19,
        start_date='2021-06-18',
        observance=nearest_workday,
    ),
    Holiday('Independence Day', month=7, day=4, observance=nearest_workday),
    USLaborDay,
    USThanksgivingDay,
    Holiday('Black Friday', month=11, day=1, offset=pd.DateOffset(weekday=FR(4))),
    Holiday('Christmas Eve', month=12, day=24),
    Holiday('Christmas', month=12, day=25, observance=nearest_workday),
]


class HolidayManager(AbstractHolidayCalendar):
    """
    A class representing a holiday manager.

    This class extends the AbstractHolidayCalendar class and provides functionality
    for managing and checking holidays.

    Attributes:
        ALL_HOLIDAYS (dict): A dictionary containing all the predefined holidays.
        OBSERVANCE (dict): A dictionary containing different observance options.

    Methods:
        __init__(self, rules=None): Initializes the HolidayManager object.
        update_rules(self, rules): Updates the holiday rules.
        create_rules(self, rules): Creates holiday rules based on the provided parameters.
        get_holiday(self, name, params): Retrieves a holiday based on the name and parameters.
        is_holiday(self, dt): Checks if a given date is a holiday.

    """

    def __init__(self, rules: Optional[list[Holiday]] = None):
        """
        Initialize the HolidayManager object.

        :param rules: Optional list of Holiday objects representing the holiday rules.
                      If not provided, the default RULES will be used.
        """
        if rules is None:
            rules = RULES
        super(HolidayManager, self).__init__(name='holidays', rules=rules)
        self.rules = rules
        self.hdays = pd.to_datetime(self.holidays(start='2023-01-01', end='2099-01-01'))

    def update_rules(self, rules: list[Holiday]):
        """
        Update the holiday rules.

        :param rules: List of Holiday objects representing the updated holiday rules.
        """
        self._cache = None
        self.rules = rules
        self.hdays = pd.to_datetime(self.holidays(start='2023-01-01', end='2099-01-01'))

    def create_rules(self, rules: dict[str, dict[str, int | str]]):
        """
        Create holiday rules based on the provided parameters.

        :param rules: Dictionary containing the holiday names and their parameters.
        :return: List of Holiday objects representing the created holiday rules.
        """
        _rules = []
        for name, params in rules.items():
            holiday = self.get_holiday(name, params)
            if holiday is not None:
                _rules.append(holiday)
        return _rules

    def get_holiday(self, name, params) -> Holiday | None:
        """
        Retrieve a holiday based on the name and parameters.

        :param name: Name of the holiday.
        :param params: Dictionary containing the parameters of the holiday.
        :return: Holiday object representing the retrieved holiday, or None if not found.
        """
        holiday = None

        if name in ALL_HOLIDAYS:
            holiday = ALL_HOLIDAYS[name]
        else:
            problems: list[str] = []
            try:
                _month = int(params.get('month'))
            except (ValueError, TypeError):
                problems.append(f"Invalid month: {params.get('month')}\n")
                _month = None
            try:
                _day = int(params.get('day'))
            except (ValueError, TypeError):
                problems.append(f"Invalid day: {params.get('day')}\n")
                _day = None

            if problems:
                _log.error(f'{[x for x in problems]}')
                return None

            observance = params.get('observance')

            if observance is not None and observance in OBSERVANCE:
                observance = OBSERVANCE[observance]
                holiday = Holiday(name, month=_month, day=_day, observance=observance)
            else:
                holiday = Holiday(name, month=_month, day=_day)

        return holiday

    def is_holiday(self, dt: datetime):
        """
        Check if a given date is a holiday.

        :param dt: Date to check.
        :return: True if the date is a holiday, False otherwise.
        """
        _date = datetime(year=dt.year, month=dt.month, day=dt.day)
        return (_date in self.hdays)
