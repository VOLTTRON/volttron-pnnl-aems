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
import logging
from datetime import timedelta as td
import gevent

from volttron.platform.agent.utils import get_aware_utc_now
from volttron.platform.scheduling import cron, periodic

from .points import OccupancyTypes, Points, cooling

_log = logging.getLogger(__name__)

TIME_CONSTANT_SECONDS = 900
STALE_DATA_TIMEOUT = td(seconds=TIME_CONSTANT_SECONDS)
LOCKOUT_DEADBAND = 1.0


class LockOutManager:
    """
    Evaluates heating and cooling lockouts based on current outdoor air temperature.
    Optimal start is locked out for heat pump systems with electric heat using outdoor-air
    temperature forecast.
    """

    def __init__(self, *, get_forecast_fn: callable, control_fn: callable, change_occupancy_fn: callable,
                 get_current_oat_fn: callable, scheduler_fn: callable, sync_occupancy_state_fn: callable):
        """
        Initialize the LockOutManager object.

        :param get_forecast_fn: A callable function to get the forecast.
        :param control_fn: A callable function for controlling the system.
        :param change_occupancy_fn: A callable function for changing the occupancy status.
        :param get_current_oat_fn: A callable function to get the current outdoor air temperature.
        :param scheduler_fn: A callable function for scheduling tasks.
        :param sync_occupancy_state_fn: A callable function for reverting occupancy command.
        """
        self._get_forecast_fn = get_forecast_fn
        self._control_fn = control_fn
        self._change_occupancy_fn = change_occupancy_fn
        self._get_current_oat_fn = get_current_oat_fn
        self._scheduler_fn = scheduler_fn
        self._sync_occupancy_state_fn = sync_occupancy_state_fn
        self._optimal_start_greenlet = None
        self._reinforce_greenlet = None
        self.cooling_lockout_temp = -100.0
        self.clg_lockout_active = False
        self.electric_heat_lockout_temp = 200.0
        self.electric_heat_lockout_active = False
        self.optimal_start_lockout_temp = -100
        self.optimal_start_lockout_active = False
        self.economizer_switchover_setpoint = None
        self.has_economizer = False
        self.is_heatpump = False

    def update_configuration(self,
                             cooling_lockout_temp: float = -100.0,
                             heating_lockout_temp: float = 200.0,
                             economizer_setpoint: float = 50.0,
                             optimal_start_lockout_temperature: float | None = None,
                             has_economizer: int = 0,
                             is_heatpump: int = 0,
                             **kwargs):
        """
        Update the configuration settings with the provided data.

        .. code-block:: python

            data:  {
                'cooling_lockout_temp': 45,
                'heating_lockout_temp': 30,
                'economizer_setpoint': 45,
                'optimal_start_lockout_temperature': 25
            }

        :param cooling_lockout_temp: low temperature threshold to lockout mechanical cooling
        :type cooling_lockout_temp: float
        :param heating_lockout_temp: high temperature threshold to lockout electric heating
        :type heating_lockout_temp: float
        :param economizer_setpoint: outdoor-air temperature switchover setpoint for economizer
        :type economizer_setpoint: float
        :param optimal_start_lockout_temperature: Disable optimal start when OAT is less than this value
        :type optimal_start_lockout_temperature: float | None
        :param has_economizer: Flag to indicate unit has an economizer system
        :type has_economizer: int
        :param is_heatpump: Flag to indicate unit is a heat pump (vs. RTU)
        :type is_heatpump: int

        :return: None
        :rtype: None

        """
        _log.debug(f'Updating Lockout Manager configuration: {self.clg_lockout_active} -- {self.has_economizer}')
        if bool(has_economizer) != self.has_economizer:
            self.release_all()
        if self.is_heatpump != bool(is_heatpump):
            self.release_all()
        self.has_economizer = bool(has_economizer)
        self.is_heatpump = bool(is_heatpump)
        self.cooling_lockout_temp = cooling_lockout_temp
        self.economizer_switchover_setpoint = economizer_setpoint
        self.electric_heat_lockout_temp = heating_lockout_temp
        self.optimal_start_lockout_temp = optimal_start_lockout_temperature
        self._configure_optimal_start_schedule()
        if self.has_economizer:
            self._control_fn(Points.economizersetpoint.value, self.economizer_switchover_setpoint)

    def _cancel_greenlet(self, attr: str):
        """
        Cancels a specific greenlet attribute if it exists.

        This method checks for the existence of a greenlet object tied to a given
        attribute name. If the greenlet is found, it calls its `cancel` method and
        sets the attribute to None. This ensures cleanup of the greenlet and resets
        the state of the specified attribute.

        :param attr: The name of the attribute, as a string, that holds a reference
                     to the greenlet to be canceled.
        :type attr: str
        """
        greenlet = getattr(self, attr, None)
        if greenlet is not None:
            greenlet.cancel()
            setattr(self, attr, None)

    def _configure_optimal_start_schedule(self):
        """
        Configures the optimal start schedule by managing the greenlet and scheduling
        the evaluation of the optimal start lockout based on the current
        `optimal_start_lockout_temp`.

        This method adjusts the cron schedule to run in an hourly manner and ensures
        that the greenlet responsible for evaluating the optimal start lockout is
        appropriately canceled or initialized. It also updates the state of
        `optimal_start_lockout_active` and synchronizes the occupancy state
        accordingly when necessary.

        :return: None
        """
        self._cancel_greenlet('_optimal_start_greenlet')
        if self.optimal_start_lockout_temp is not None:
            self._optimal_start_greenlet = self._scheduler_fn(
                cron('0 * * * *'), self.evaluate_optimal_start_lockout
            )
        elif self.optimal_start_lockout_active:
            self.optimal_start_lockout_active = False
            self._sync_occupancy_state_fn()

    def evaluate_optimal_start_lockout(self) -> None:
        """
        Evaluate whether the optimal start lockout should be active based on weather forecast.

        If the forecast minimum temperature is below the optimal start lockout temperature,
        the lockout is activated and occupancy is set to OCCUPIED.

        If the forecast cannot be evaluated, or the forecast minimum temperature is at or above
        the optimal start lockout temperature, the lockout is released if currently active.
        """
        gevent.sleep(30)

        forecast = self._get_forecast_fn()
        _log.debug(f"Evaluate optimal start lockout with weather: {forecast}")

        should_lockout = False

        try:
            min_temp = min(forecast or [])
        except ValueError as ex:
            _log.debug(f"No valid weather forecast, cannot evaluate optimal start lockout: {ex}")
        else:
            _log.debug(
                f"Optimal Start Lockout - OAT {min_temp} -- {self.optimal_start_lockout_temp}"
            )
            should_lockout = min_temp < self.optimal_start_lockout_temp

        if should_lockout:
            self._change_occupancy_fn(OccupancyTypes.OCCUPIED)
            self.optimal_start_lockout_active = True
        elif self.optimal_start_lockout_active:
            self.optimal_start_lockout_active = False
            self._sync_occupancy_state_fn()

    def evaluate(self) -> None:
        """
        Called by manager.py when new data is received.

        Checks for stale data, gets current OAT, and evaluates lockouts.
        """
        current_time = get_aware_utc_now()
        timestamp, oat = self._get_current_oat_fn()

        _log.debug(
            f"Evaluate lockouts with OAT: {oat} -- {timestamp} -- {current_time}"
        )

        lockout_active = self.clg_lockout_active or self.electric_heat_lockout_active
        missing_timestamp = timestamp is None
        stale_data = (
                timestamp is not None
                and current_time - timestamp > STALE_DATA_TIMEOUT
        )

        if (missing_timestamp or stale_data) and lockout_active:
            self.release_all()
            return

        self.evaluate_electric_heating_lockout(oat)

        if self.has_economizer:
            self.evaluate_cooling_lockout(oat)

    def evaluate_electric_heating_lockout(self, oat: float):
        """
        Evaluate whether the electric heating lockout should be active or not.

        This function checks the current outdoor-air temperature measurement (oat) against the electric heating
        lockout temperature.  If the oat is greater than the electric heating lockout temperature and the electric
        heating lockout is not already active, it deactivates the electric heating by setting the AUX_HEAT_CMD value
        to 0 and sets the electric_heat_lockout_active flag to True.

        If the difference between the electric heating lockout temperature and the oat is greater than 1.0 and the
        electric heating lockout is active, then deactivates the electric heating by setting the AUX_HEAT_CMD value
        to None and sets the electric_heat_lockout_active flag to False.

        :param oat: Current outdoor-air temperature measurement
        :type oat: float
        """
        if oat > self.electric_heat_lockout_temp and not self.electric_heat_lockout_active:
            self._control_fn(Points.auxiliaryheatcommand.value, 0)
            self.electric_heat_lockout_active = True
            self._reinforce_greenlet = self._scheduler_fn(periodic(TIME_CONSTANT_SECONDS,
                                                                   start=td(seconds=TIME_CONSTANT_SECONDS)),
                                                                   self._reinforce_active_lockouts)
        elif (self.electric_heat_lockout_active
              and (self.electric_heat_lockout_temp is None
                   or self.electric_heat_lockout_temp - oat > LOCKOUT_DEADBAND)):
            self._control_fn(Points.auxiliaryheatcommand.value, None)
            self.electric_heat_lockout_active = False
            self._cancel_greenlet('_reinforce_greenlet')

    def evaluate_cooling_lockout(self, oat: float):
        """
        Evaluate whether the compressor cooling lockout should be active or not.

        :param oat: Current outdoor-air temperature measurement
        :type oat: float
        """
        if oat < self.cooling_lockout_temp and not self.clg_lockout_active:
            self._set_cooling_stages(0)
            self.clg_lockout_active = True
            self._reinforce_greenlet = self._scheduler_fn(periodic(TIME_CONSTANT_SECONDS,
                                                                   start=td(seconds=TIME_CONSTANT_SECONDS)),
                                                                   self._reinforce_active_lockouts)
        elif self.clg_lockout_active and (
                self.cooling_lockout_temp is None
                or oat - self.cooling_lockout_temp > LOCKOUT_DEADBAND):
            self._set_cooling_stages(None)
            self.clg_lockout_active = False
            self._cancel_greenlet('_reinforce_greenlet')

    def _reinforce_active_lockouts(self):
        """
        Ensures active lockouts for heating and cooling systems are enforced by appropriately
        adjusting controls or cancelling associated tasks. It checks the current state of
        electric heat lockout and cooling lockout and executes the respective control actions
        using predefined functions and methods.

        :return: None
        """
        _log.debug('Reinforcing active lockout controls')
        if self.electric_heat_lockout_active:
            self._control_fn(Points.auxiliaryheatcommand.value, 0)
        elif self.clg_lockout_active:
            self._set_cooling_stages(0)
        else:
            self._cancel_greenlet('_reinforce_greenlet')

    def release_all(self):
        """
        Release all lockouts.

        :return: None
        :rtype: None

        """
        if self.is_heatpump:
            # Release electric heat lockout
            self.release_heating_lockout()
        if self.has_economizer:
            # Release cooling lockout
            self.release_cooling_lockout()
        self._cancel_greenlet('_reinforce_greenlet')

    def release_cooling_lockout(self):
        """
        Releases the cooling lockout by iterating through all cooling stages and
        attempting to reset them. Logs a warning if any issue arises during the
        reset process. Sets the `clg_lockout_active` attribute to `False` after
        processing all cooling stages.

        :param self: The instance of the class on which this method is called.

        :return: None
        """
        self._set_cooling_stages(None)
        self.clg_lockout_active = False

    def release_heating_lockout(self):
        """
        Releases the heating lockout by deactivating the electric heat lockout.
        This ensures that the system can re-enable  electric heating functionality.

        :param self: Represents the instance of the class on which this method is invoked.
        :return: None
        """
        self._control_fn(Points.auxiliaryheatcommand.value, None)
        self.electric_heat_lockout_active = False

    def _set_cooling_stages(self, value):
        """
        Set the cooling stages with the specified value.

        This method iterates through each cooling stage to update its
        associated point to the provided value. It performs actions via
        the `_control_fn` method and logs information regarding the process.

        :param value: The desired value to set for the cooling stages.
        :type value: Any
        :return: None
        """
        for stage in cooling.stages:
            _log.debug(f'Cooling lockout: {stage.point} -> {value}')
            result = self._control_fn(stage.point, value)
            if isinstance(result, str):
                _log.warning(f'Setting {stage.point} to {value}: {result}')