"""
Copyright (c) 2023, Battelle Memorial Institute
All rights reserved.
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies,
either expressed or implied, of the FreeBSD Project.
This material was prepared as an account of work sponsored by an agency of the
United States Government. Neither the United States Government nor the United
States Department of Energy, nor Battelle, nor any of their employees, nor any
jurisdiction or organization that has cooperated in th.e development of these
materials, makes any warranty, express or implied, or assumes any legal
liability or responsibility for the accuracy, completeness, or usefulness or
any information, apparatus, product, software, or process disclosed, or
represents that its use would not infringe privately owned rights.
Reference herein to any specific commercial product, process, or service by
trade name, trademark, manufacturer, or otherwise does not necessarily
constitute or imply its endorsement, recommendation, or favoring by the
United States Government or any agency thereof, or Battelle Memorial Institute.
The views and opinions of authors expressed herein do not necessarily state or
reflect those of the United States Government or any agency thereof.
PACIFIC NORTHWEST NATIONAL LABORATORY
operated by BATTELLE for the UNITED STATES DEPARTMENT OF ENERGY
under Contract DE-AC05-76RL01830
"""
import pandas as pd
from pandas.tseries.holiday import (FR, Holiday, USColumbusDay, USLaborDay,
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
    'Black Friday': Holiday('Black Friday', month=11, day=1, offset=pd.DateOffset(weekday=FR(4))),
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
