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
import logging
from datetime import timedelta as td

from volttron.platform.agent.utils import get_aware_utc_now
from volttron.platform.scheduling import cron

from .points import OccupancyTypes, Points, cooling

_log = logging.getLogger(__name__)


class LockOutManager:
    """
    Evaluates heating and cooling lockouts based on current outdoor air temperature.
    Optimal start is locked out for heat pump systems with electric heat using outdoor-air
    temperature forecast.
    """

    def __init__(self, *, get_forecast_fn: callable, control_fn: callable, change_occupancy_fn: callable,
                 get_current_oat_fn: callable, scheduler_fn: callable):
        """
        Initialize the LockOutManager object.

        :param get_forecast_fn: A callable function to get the forecast.
        :param control_fn: A callable function for controlling the system.
        :param change_occupancy_fn: A callable function for changing the occupancy status.
        :param get_current_oat_fn: A callable function to get the current outdoor air temperature.
        :param scheduler_fn: A callable function for scheduling tasks.
        """
        self._get_forecast_fn = get_forecast_fn
        self._control_fn = control_fn
        self._change_occupancy_fn = change_occupancy_fn
        self._get_current_oat_fn = get_current_oat_fn
        self._scheduler_fn = scheduler_fn
        self._optimal_start_lockout_greenlet = None
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

        :param cooling_lockout_temp:
        :type cooling_lockout_temp:
        :param heating_lockout_temp:
        :type heating_lockout_temp:
        :param economizer_setpoint:
        :type economizer_setpoint:
        :param optimal_start_lockout_temperature: Disable optimal start when OAT is less than this value
        :type optimal_start_lockout_temperature: float | None
        :param has_economizer: Flag to indicate unit has an economizer system
        :type has_economizer: int
        :param is_heatpump: Flag to indicate unit is a heat pump (vs. RTU)
        :type is_heatpump: int

        :return: None
        :rtype: None

        """
        self.has_economizer = bool(has_economizer)
        self.is_heatpump = bool(is_heatpump)
        self.cooling_lockout_temp = cooling_lockout_temp
        self.economizer_switchover_setpoint = economizer_setpoint
        self.electric_heat_lockout_temp = heating_lockout_temp
        self.optimal_start_lockout_temp = optimal_start_lockout_temperature
        self.economizer_switchover_setpoint = economizer_setpoint
        if self.optimal_start_lockout_temp is not None:
            if self._optimal_start_lockout_greenlet is not None:
                self._optimal_start_lockout_greenlet.cancel()
            self._optimal_start_lockout_greenlet = self._scheduler_fn(cron('0 * * * *'),
                                                                      self.evaluate_optimal_start_lockout)
        else:
            if self._optimal_start_lockout_greenlet is not None:
                self._change_occupancy_fn(OccupancyTypes.RELEASE)
                self._optimal_start_lockout_greenlet.cancel()
                self._optimal_start_lockout_greenlet = None
        if self.has_economizer:
            self._control_fn(Points.economizersetpoint.value, self.economizer_switchover_setpoint)

    def evaluate_optimal_start_lockout(self):
        """
        Evaluate whether the optimal start lockout should be active based on weather forecast.

        If the forecast indicates that the temperature is below the optimal start lockout temperature,
        the optimal start lockout will be activated, and the occupancy type will be set to OCCUPIED.
        If the temperature is above the optimal start lockout temperature and the lockout is currently active,
        the occupancy type will be set to RELEASE and the lockout will be deactivated.

        :return: None
        :rtype: None
        """

        forecast = self._get_forecast_fn()
        _log.debug(f'Forecast: {forecast}')
        if not forecast:
            _log.debug(f'No weather forecast, cannot evaluate optimal start lockout!')
            return

        _log.debug(f'Optimal Start Lockout - oat {min(forecast)} -- {self.optimal_start_lockout_temp}')
        # If the temperature is below the optimal start lockout temperature, activate the lockout
        if min(forecast) < self.optimal_start_lockout_temp:
            self._change_occupancy_fn(OccupancyTypes.OCCUPIED)
            self.optimal_start_lockout_active = True
            return

        # If the lockout is currently active and the temperature is above the optimal start lockout temperature,
        # deactivate the lockout
        if self.optimal_start_lockout_active:
            self._change_occupancy_fn(OccupancyTypes.RELEASE)
            self.optimal_start_lockout_active = False

    def evaluate(self):
        """
        Called by manager.py when new data is received.
        Checks for stale data, gets current OAT, evaluates lockouts.

        :return: None
        :rtype: None
        """
        current_time = get_aware_utc_now()
        timestamp, oat = self._get_current_oat_fn()
        # TODO: make the stale data time configurable
        if timestamp is None or current_time - timestamp > td(seconds=900):
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
        if ((self.electric_heat_lockout_temp - oat > 1.0 or self.electric_heat_lockout_temp is None)
                and self.electric_heat_lockout_active):
            self._control_fn(Points.auxiliaryheatcommand.value, None)
            self.electric_heat_lockout_active = False

    def evaluate_cooling_lockout(self, oat: float):
        """
        Evaluate whether the compressor cooling lockout should be active or not.

        :param oat: Current outdoor-air temperature measurement
        :type oat: float
        """
        # Check if outdoor-air temperature is below the cooling
        # lockout temperature and the lockout is not active
        if oat < self.cooling_lockout_temp and not self.clg_lockout_active:
            # Set all cooling stages to 0 and log any errors
            for stage in cooling.stages:
                result = self._control_fn(stage.point, 0)
                if isinstance(result, str):
                    _log.warning(f'Setting {stage.point} to 0: {result}')
            # Set the cooling lockout to active
            self.clg_lockout_active = True
        # Check if outdoor-air temperature is above the cooling lockout
        # temperature by more than 1 degree or if the lockout temperature
        # is not set, and the lockout is active
        if ((oat - self.cooling_lockout_temp > 1.0 or self.cooling_lockout_temp is None) and self.clg_lockout_active):
            # Set all cooling stages to None and log any errors
            for stage in cooling.stages:
                result = self._control_fn(stage.point, None)
                if isinstance(result, str):
                    _log.warning(f'Setting {stage.point} to None: {result}')
            # Set the cooling lockout to inactive
            self.clg_lockout_active = False

    def release_all(self):
        """
        Release all lockouts.

        :return: None
        :rtype: None

        """
        if self.is_heatpump:
            # Release electric heat lockout
            self._control_fn(Points.auxiliaryheatcommand.value, None)
            self.electric_heat_lockout_active = False
        if self.has_economizer:
            # Release cooling lockout
            for stage in cooling.stages:
                result = self._control_fn(stage.point, None)
                if isinstance(result, str):
                    _log.warning(f'Setting {stage.point} to 0: {result}')
            self.clg_lockout_active = False