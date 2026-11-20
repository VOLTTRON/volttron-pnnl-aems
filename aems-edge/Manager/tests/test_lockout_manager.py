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
from datetime import datetime, timedelta, timezone
from unittest import mock

import pytest
from manager.lock_out_manager import LOCKOUT_DEADBAND, STALE_DATA_TIMEOUT, LockOutManager
from manager.points import OccupancyTypes, Points, cooling

AUX_HEAT = Points.auxiliaryheatcommand.value


def make_lom(**overrides) -> LockOutManager:
    """LockOutManager with mock callbacks (override any of them by keyword)."""
    kwargs = dict(get_forecast_fn=mock.MagicMock(return_value=None), control_fn=mock.MagicMock(),
                  change_occupancy_fn=mock.MagicMock(), get_current_oat_fn=mock.MagicMock(return_value=(None, None)),
                  scheduler_fn=mock.MagicMock(), sync_occupancy_state_fn=mock.MagicMock())
    kwargs.update(overrides)
    return LockOutManager(**kwargs)


@pytest.fixture(autouse=True)
def no_sleep():
    # evaluate_optimal_start_lockout waits 30 s for the forecast to update
    with mock.patch("manager.lock_out_manager.gevent.sleep"):
        yield


def test_initial_state():
    lom = make_lom()
    assert lom.cooling_lockout_temp == -100.0 and not lom.clg_lockout_active
    assert lom.electric_heat_lockout_temp == 200.0 and not lom.electric_heat_lockout_active
    assert lom.optimal_start_lockout_temp == -100 and not lom.optimal_start_lockout_active
    assert lom.economizer_switchover_setpoint is None
    assert lom._optimal_start_greenlet is None and lom._reinforce_greenlet is None
    assert not lom.has_economizer and not lom.is_heatpump


def test_optimal_start_lockout_follows_the_forecast():
    forecast = mock.MagicMock(return_value=None)
    lom = make_lom(get_forecast_fn=forecast)
    lom.optimal_start_lockout_temp = 30.0

    lom.evaluate_optimal_start_lockout()                       # no forecast: nothing happens
    assert not lom.optimal_start_lockout_active
    lom._change_occupancy_fn.assert_not_called()

    forecast.return_value = [35.0, 28.0, 40.0]                 # forecast minimum below the lockout temperature
    lom.evaluate_optimal_start_lockout()
    assert lom.optimal_start_lockout_active
    lom._change_occupancy_fn.assert_called_once_with(OccupancyTypes.OCCUPIED)

    forecast.return_value = [35.0, 32.0]                       # warmer: released, occupancy re-synced
    lom.evaluate_optimal_start_lockout()
    assert not lom.optimal_start_lockout_active
    lom._sync_occupancy_state_fn.assert_called_once()


def test_release_all():
    lom = make_lom()
    lom.is_heatpump, lom.electric_heat_lockout_active = True, True
    lom.release_all()
    assert not lom.electric_heat_lockout_active
    lom._control_fn.assert_called_once_with(AUX_HEAT, None)

    lom._control_fn.reset_mock()
    lom.is_heatpump, lom.has_economizer, lom.clg_lockout_active = False, True, True
    lom.release_all()
    assert not lom.clg_lockout_active
    assert lom._control_fn.call_args_list == [mock.call(stage.point, None) for stage in cooling.stages]

    lom._control_fn.reset_mock()
    lom.has_economizer = False                                 # neither: nothing to release
    lom.release_all()
    lom._control_fn.assert_not_called()


def test_evaluate_releases_lockouts_on_missing_or_stale_outdoor_air():
    now = datetime(2026, 11, 11, 12, 0, tzinfo=timezone.utc)
    oat = mock.MagicMock(return_value=(None, None))
    lom = make_lom(get_current_oat_fn=oat)
    lom.is_heatpump = True
    with mock.patch("manager.lock_out_manager.get_aware_utc_now", lambda: now):
        lom.electric_heat_lockout_active = True
        lom.evaluate()                                         # no reading
        assert not lom.electric_heat_lockout_active

        lom.electric_heat_lockout_active = True
        oat.return_value = (now - STALE_DATA_TIMEOUT - timedelta(seconds=1), 100.0)
        lom.evaluate()                                         # stale reading
        assert not lom.electric_heat_lockout_active

        lom.electric_heat_lockout_temp = 90.0
        oat.return_value = (now, 100.0)                        # fresh and above the lockout temperature
        lom.evaluate()
        assert lom.electric_heat_lockout_active


def test_electric_heating_lockout():
    lom = make_lom()
    lom.electric_heat_lockout_temp = 100.0

    lom.evaluate_electric_heating_lockout(101.0)
    assert lom.electric_heat_lockout_active
    lom._control_fn.assert_called_once_with(AUX_HEAT, 0)
    lom._scheduler_fn.assert_called_once()                    # lockout is reinforced periodically

    lom._control_fn.reset_mock()
    lom.evaluate_electric_heating_lockout(100.0 - LOCKOUT_DEADBAND)   # inside the deadband: stays locked out
    assert lom.electric_heat_lockout_active
    lom._control_fn.assert_not_called()

    lom.evaluate_electric_heating_lockout(100.0 - LOCKOUT_DEADBAND - 0.1)
    assert not lom.electric_heat_lockout_active
    lom._control_fn.assert_called_once_with(AUX_HEAT, None)


def test_cooling_lockout():
    # Only the first cooling stage exists on this unit; the others return an error string.
    def control(point, value):
        return 0 if point == cooling.stages[0].point else f"Error {point} not available"

    lom = make_lom(control_fn=mock.MagicMock(side_effect=control))
    lom.cooling_lockout_temp = 101.0

    lom.evaluate_cooling_lockout(99.0)
    assert lom.clg_lockout_active
    assert lom._control_fn.call_args_list == [mock.call(stage.point, 0) for stage in cooling.stages]

    lom._control_fn.reset_mock()
    lom.evaluate_cooling_lockout(101.0 + LOCKOUT_DEADBAND)    # inside the deadband: stays locked out
    assert lom.clg_lockout_active
    lom._control_fn.assert_not_called()

    lom.evaluate_cooling_lockout(101.0 + LOCKOUT_DEADBAND + 0.1)
    assert not lom.clg_lockout_active
    assert lom._control_fn.call_args_list == [mock.call(stage.point, None) for stage in cooling.stages]
