import logging
from datetime import datetime, timedelta
from unittest import mock

import pytz
from manager.lock_out_manager import LockOutManager
from manager.points import Points, cooling

logging.basicConfig(level=logging.DEBUG)


def forcast_fn():
    return None


def control_fn():
    return None


def change_occupancy_fn():
    return None


def scheduler_fn():
    return None


def current_oat_fn():
    return None, None


def test_initial_state():

    lom = LockOutManager(get_forcast_fn=forcast_fn,
                         control_fn=control_fn,
                         change_occupancy_fn=change_occupancy_fn,
                         get_current_oat_fn=current_oat_fn,
                         scheduler_fn=scheduler_fn)

    assert -100.0 == lom.cooling_lockout_temp
    assert not lom.clg_lockout_active
    assert 200.0 == lom.electric_heat_lockout_temp
    assert not lom.electric_heat_lockout_active
    assert -100 == lom.optimal_start_lockout_temp
    assert not lom.optimal_start_lockout_active
    assert lom.economizer_switchover_setpoint is None
    assert lom.optimal_start_lockout_greenlet is None
    assert not lom.has_economizer
    assert not lom.is_heatpump

    # No forcast value so None is returned
    assert lom.evaluate_optimal_start_lockout() is None


def test_release_all():
    fn_control = mock.MagicMock()
    lom = LockOutManager(get_forcast_fn=forcast_fn,
                         control_fn=fn_control,
                         change_occupancy_fn=change_occupancy_fn,
                         get_current_oat_fn=current_oat_fn,
                         scheduler_fn=scheduler_fn)

    # Test if we have a heatpump without economizer
    lom.is_heatpump = True
    lom.electric_heat_lockout_active = True

    lom.release_all()

    assert not lom.electric_heat_lockout_active
    assert fn_control.called
    assert fn_control.called_with(Points.AUX_HEAT_CMD.value, None)

    fn_control.reset_mock()

    lom.is_heatpump = False
    lom.has_economizer = True

    lom.release_all()
    assert not lom.clg_lockout_active
    assert fn_control.called
    assert fn_control.called_with(Points.COOLING_COMMAND.value, None)

    fn_control.reset_mock()

    lom.electric_heat_lockout_active = True
    lom.clg_lockout_active = True
    lom.is_heatpump = False
    lom.has_economizer = False

    lom.release_all()


def test_evaluate():
    utcnow = datetime.utcnow()
    utcnow = pytz.UTC.localize(utcnow)

    def my_test_utc():
        return utcnow

    with mock.patch('manager.lock_out_manager.get_aware_utc_now', lambda: my_test_utc()):

        lom = LockOutManager(get_forcast_fn=forcast_fn,
                             control_fn=control_fn,
                             change_occupancy_fn=change_occupancy_fn,
                             get_current_oat_fn=current_oat_fn,
                             scheduler_fn=scheduler_fn)

        lom.evaluate()

    with mock.patch('manager.lock_out_manager.get_aware_utc_now', lambda: my_test_utc() - timedelta(seconds=901)):
        lom = LockOutManager(get_forcast_fn=forcast_fn,
                             control_fn=control_fn,
                             change_occupancy_fn=change_occupancy_fn,
                             get_current_oat_fn=lambda: (utcnow, 100.0),
                             scheduler_fn=scheduler_fn)

        lom.evaluate()


def test_electric_heating_lockout():
    mock_control = mock.MagicMock()

    lom = LockOutManager(get_forcast_fn=forcast_fn,
                         control_fn=mock_control,
                         change_occupancy_fn=change_occupancy_fn,
                         get_current_oat_fn=current_oat_fn,
                         scheduler_fn=scheduler_fn)

    lom.electric_heat_lockout_temp = 100.0

    lom.evaluate_electric_heating_lockout(101.0)

    assert lom.electric_heat_lockout_active
    assert mock_control.called_with(Points.AUX_HEAT_CMD.value, 0)
    mock_control.reset_mock()

    lom.evaluate_electric_heating_lockout(99.0)

    assert lom.electric_heat_lockout_active
    lom.evaluate_electric_heating_lockout(89.9)
    assert not lom.electric_heat_lockout_active
    assert mock_control.called_with(Points.AUX_HEAT_CMD.value, None)


def test_cooling_lockout():
    mock_control = mock.MagicMock()

    lom = LockOutManager(get_forcast_fn=forcast_fn,
                         control_fn=mock_control,
                         change_occupancy_fn=change_occupancy_fn,
                         get_current_oat_fn=current_oat_fn,
                         scheduler_fn=scheduler_fn)

    # Only first staing cooling is available.
    def side_effect_function(point, value):
        if point == cooling.stages[0].point:
            return 0
        else:
            return f'Error {point} not available'

    lom.cooling_lockout_temp = 101.0
    mock_control.side_effect = side_effect_function
    # value = mock_control(cooling.stages[0].point, 0)
    # assert value == 0
    # value = mock_control(cooling.stages[1].point, 0)
    # assert value == "Another"

    lom.evaluate_cooling_lockout(99)

    assert lom.clg_lockout_active
    assert mock_control.call_count == len(cooling.stages)

    mock_control.reset_mock()

    lom.clg_lockout_active = True

    lom.evaluate_cooling_lockout(101.1)
