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
from datetime import timedelta
import pandas as pd
from dateutil.relativedelta import *
from pandas.tseries.holiday import (TH, Holiday, USColumbusDay, USLaborDay,
                                    USMartinLutherKingJr, USMemorialDay,
                                    USPresidentsDay, USThanksgivingDay,
                                    after_nearest_workday,
                                    before_nearest_workday, nearest_workday,
                                    next_monday, next_workday, previous_friday,
                                    previous_workday, sunday_to_monday)

ALL_HOLIDAYS = {
    "New Year's Day": Holiday("New Year's Day", month=1, day=1, observance=nearest_workday),
    'Martin Luther King Jr': USMartinLutherKingJr,
    'Presidents Day': USPresidentsDay,
    'Memorial Day': USMemorialDay,
    'Juneteenth': Holiday(
        'Juneteenth National Independence Day',
        month=6,
        day=19,
        observance=nearest_workday,
    ),
    'Independence Day': Holiday('Independence Day', month=7, day=4, observance=nearest_workday),
    'Labor Day': USLaborDay,
    'Columbus Day': USColumbusDay,
    'Veterans Day': Holiday('Veterans Day', month=11, day=11, observance=nearest_workday),
    'Thanksgiving': USThanksgivingDay,
    'Black Friday': Holiday('Black Friday', month=11, day=1, offset=relativedelta(weekday=TH(+4)) + timedelta(days=1)),
    'Christmas Eve': Holiday('Christmas Eve', month=12, day=24),
    'Christmas': Holiday('Christmas', month=12, day=25, observance=nearest_workday)
}

OBSERVANCE = {
    'after_nearest_workday': after_nearest_workday,
    'before_nearest_workday': before_nearest_workday,
    'nearest_workday': nearest_workday,
    'next_monday': next_monday,
    'next_workday': next_workday,
    'previous_workday': previous_workday,
    'previous_friday': previous_friday,
    'sunday_to_monday': sunday_to_monday
}