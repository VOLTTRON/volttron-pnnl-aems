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
import pytest


def test_manager_holiday_none_rules_uses_the_default_holidays():
    from datetime import datetime
    from manager.holiday_manager import RULES, HolidayManager

    manager = HolidayManager(rules=None)            # documented default: the standard RULES
    assert manager.rules == RULES
    assert manager.is_holiday(datetime(2026, 12, 25))


def test_manager_holiday_empty_rules_means_no_holidays():
    from datetime import datetime
    from manager.holiday_manager import HolidayManager

    manager = HolidayManager(rules=[])
    assert not manager.is_holiday(datetime(2026, 12, 25))
