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
import os
import warnings
from abc import abstractmethod
from datetime import datetime as dt

import numpy as np
import pandas as pd
from volttron.platform.agent.utils import format_timestamp

from . import OptimalStartConfig
from .utils import (calculate_prestart_time, ema, get_operating_mode,
                    get_time_target, get_time_temp_diff, offset_time, parse_df,
                    trim)

warnings.filterwarnings('ignore', category=DeprecationWarning)

_log = logging.getLogger(__name__)


class Model:

    def __init__(self, config: OptimalStartConfig, schedule):
        self.config = config

        self.latest_start_time = config.latest_start_time
        self.earliest_start_time = config.earliest_start_time
        self.t_error = config.allowable_setpoint_deviation
        self.training_period_window = config.training_period_window
        self.schedule = schedule
        self.tz = os.environ.get('LOCAL_TZ', 'US/Pacific')
        self.record = {}

    def update_config(self, config: OptimalStartConfig, schedule: dict) -> None:
        """
        Update configurations from store or AEMS web interface

        :param config: dictionary of configuration parameters
        :type config: dict
        :param schedule: dictionary fo schedule information
        :type schedule: dict
        :return: None
        :rtype: None
        """
        self.config = config
        self.schedule = schedule
        self.load_config()

    def load_config(self):
        self.latest_start_time = self.config.latest_start_time
        self.earliest_start_time = self.config.earliest_start_time
        self.t_error = self.config.allowable_setpoint_deviation
        self.training_period_window = self.config.training_period_window

    def load_model(self, model_dict):
        """
        model_dict is the trained model coefficients stored in the volttron config store.

        :param model_dict: trained model parameters stored in volttron config store
        :type model_dict: dict
        """
        for name, value in model_dict.items():
            try:
                setattr(self, name, value)
            except Exception as ex:
                _log.debug(f'Problem initializing configuration parameter {name} - {value} -- {ex}')
                continue

    def train(self, data, start, end):
        """
        Train optimal start models with current days data.

        :param data: current days data for training optimal start model.
        :type data: pd.DataFrame
        :param start: current days start time prior to scheduled occupancy in minutes
        :type start: dt
        :param end: current days start time prior to scheduled occupancy in minutes
        :type end: dt
        :return: None
        :rtype: None
        """
        self.record = {}
        if data.empty:
            return
        data.index = pd.to_datetime(data.index, utc=True)
        data.index = data.index.tz_convert(self.tz)
        data = data.between_time(start.time(), end.time())
        data = data[data['supplyfanstatus'] != 0]
        data.drop(index=data.index[0], axis=0, inplace=True)
        data.to_csv('sort.csv')
        if data.empty:
            _log.debug('Supply fan is off entirety of training period!')
            return
        mode = get_operating_mode(data)
        data = parse_df(data, mode)
        if mode == 'cooling':
            data = parse_df(data, mode)
            data.to_csv('sort1.csv')
            self.train_cooling(data)
        elif mode == 'heating':
            data = parse_df(data, 'heating')
            data.to_csv('sort1.csv')
            self.train_heating(data)
        else:
            _log.debug('Unit had no active heating or cooling during training period!')

    @abstractmethod
    def train_cooling(self, data):
        pass

    @abstractmethod
    def train_heating(self, data):
        pass

    def heat_transfer_rate(self, data):
        df_list = []
        _range = np.linspace(0, 15, 61)
        for j in _range:
            try:
                min_slope = data[(data['temp_diff'][0] - data['temp_diff']) >= j].index[0]
                df_list.append(data.loc[min_slope])
            except (IndexError, ValueError) as ex:
                _log.debug('Model error getting heat transfer rate: %s', ex)
                continue
        if len(df_list) == 1 and data['temp_diff'][0] > self.t_error:
            df_list.append(data.iloc[-1])
        htr = pd.concat(df_list, axis=1).T
        htr = htr[~htr.index.duplicated(keep='first')]
        htr.to_csv('htr.csv')
        return htr

    def bound(self, optimal_time):
        if optimal_time is None:
            return (self.earliest_start_time + self.latest_start_time) / 2
        if not np.isfinite(optimal_time):
            if np.isposinf(optimal_time):
                return self.earliest_start_time
            elif np.isneginf(optimal_time):
                return self.latest_start_time
            else:
                return (self.earliest_start_time + self.latest_start_time) / 2
        return max(self.latest_start_time, min(self.earliest_start_time, optimal_time))


class Carrier(Model):

    def __init__(self, config):
        super(Carrier, self).__init__(config)
        self.c1 = []
        self.h1 = []
        self.oat_clg = []
        self.oat_htg = []
        self.adjust_time = 0

    def train_cooling(self, data):
        htr = self.heat_transfer_rate(data)
        if htr.empty:
            _log.debug('Carrier debug cooling htr returned empty!')
            return
        time_diff, temp_diff = get_time_temp_diff(htr, self.t_error)
        oat = htr['outdoortemperature'].mean()
        _log.debug('C: training {} -- {}'.format(temp_diff, time_diff))
        if not time_diff:
            _log.debug('Carrier debug cooling time_diff == 0!')
            return
        c1 = temp_diff / time_diff
        if not np.isfinite(c1):
            _log.debug('C - cooling model returned non-numeric coefficients!')
            return
        if c1 <= 0:
            _log.debug('C - cooling model returned negative coefficients!')
            return
        self.c1 = trim(self.c1, c1, self.training_period_window)
        self.oat_clg = trim(self.oat_clg, oat, self.training_period_window)
        self.record = {'date': format_timestamp(dt.now()), 'c1': c1, 'c1_array': self.c1}

    def train_heating(self, data):
        htr = self.heat_transfer_rate(data)
        if htr.empty:
            _log.debug('Carrier debug heating htr returned empty!')
            return
        time_diff, temp_diff = get_time_temp_diff(htr, self.t_error)
        oat = htr['outdoortemperature'].mean()
        if not time_diff:
            _log.debug('Carrier debug heating time_diff == 0!')
            return
        h1 = temp_diff / time_diff
        if not np.isfinite(h1):
            _log.debug('C - heating model returned non-numeric coefficients!')
            return
        if h1 <= 0:
            _log.debug('C - heating model returned negative coefficients!')
            return
        self.h1 = trim(self.h1, h1, self.training_period_window)
        self.oat_htg = trim(self.oat_htg, oat, self.training_period_window)
        self.record = {'date': format_timestamp(dt.now()), 'h1': h1, 'h1_array': self.h1}

    def calculate_prestart(self, data, offset, mode):
        if not data.empty:
            try:
                csp = data['coolingsetpoint'][-1]
                hsp = data['heatingsetpoint'][-1]
                zonetemp = data['zonetemperature'][-1]
                oat = data['outdoortemperature'][-1]
                if mode == 'cooling':
                    if not self.c1:
                        return (self.earliest_start_time + self.latest_start_time) / 2
                    target = csp - offset
                    zsp = zonetemp - target
                    coefficient1 = ema(self.c1)
                    oat_training = ema(self.oat) if self.oat else oat
                    _log.debug('C calc: %s -- %s -- %s -- %s -- %s -- %s', self.c1, coefficient1,
                               csp, hsp, zonetemp, oat)
                    start_time = zsp / ((100 - oat) / (100 - oat_training) * coefficient1)
                else:
                    if not self.h1:
                        return (self.earliest_start_time + self.latest_start_time) / 2
                    target = hsp + offset
                    zsp = hsp - target
                    coefficient1 = ema(self.h1)
                    oat_training = ema(self.oat) if self.oat else oat
                    start_time = zsp / ((0.0 - oat) / (0 - oat_training) * coefficient1)
            except IndexError as ex:
                _log.debug('Carrier error on calculate - %s -- %s', self.c1, ex)
                start_time = (self.earliest_start_time + self.latest_start_time) / 2
            return self.bound(start_time)


class Siemens(Model):

    def __init__(self, config):
        super(Siemens, self).__init__(config)
        self.c1 = []
        self.c2 = []
        self.h1 = []
        self.h2 = []
        self.adjust_time = 0

    def train_cooling(self, data):
        """
        Train coefficients (c1, c2) for optimal start cooling.
        :param data: RTU data to train optimal start
        :type data: DataFrame
        :return: None
        :rtype:
        """
        htr = self.heat_transfer_rate(data)
        if htr.empty:
            _log.debug('Siemens debug cooling htr returned empty!')
            return
        zcsp = htr['zonetemperature'][0] - htr['coolingsetpoint'][0]
        osp = htr['outdoortemperature'][0] - htr['coolingsetpoint'][0]
        time_diff, temp_diff = get_time_temp_diff(htr, self.t_error)
        if not time_diff:
            _log.debug('Siemens debug cooling time_diff == 0!')
            return
        time_avg = time_diff / temp_diff
        time_one_degree = get_time_target(data, 1.0)
        _log.debug(f'S: time_one_degree: {time_one_degree} -- time_avg: {time_avg}')
        if np.isnan(time_one_degree):
            _log.debug('Siemens cooling debug time_avg is nan')
            return
        precooling = time_diff
        # Calculate average value of time to change degree
        c1 = time_avg / 60
        c2 = ((precooling / 60 - c1 * zcsp) * 10.0) / (osp * zcsp)
        _log.debug('S - cooling: {} - c1: {} - zcsp: {} -- osp: {}'.format(precooling, self.c1, zcsp, osp))
        if not np.isfinite(c1) or not np.isfinite(c2):
            _log.debug('S: cooling model returned non-numeric coefficients!')
            return
        if c1 <= 0:
            _log.debug('S - cooling c1 model returned negative coefficients!')
            return
        if c2 <= 0:
            _log.debug('S - cooling c2 model returned negative coefficients!')
            c2 = 0
        self.c1 = trim(self.c1, c1, self.training_period_window)
        self.c2 = trim(self.c2, c2, self.training_period_window)
        self.record = {'date': format_timestamp(dt.now()), 'c1': c1, 'c1_array': self.c1, 'c2': c2, 'c2_array': self.c2}

    def train_heating(self, data):
        """
        Train coefficients (h1, h2) for optimal start heating.
        :param data: RTU data to train optimal start
        :type data: DataFrame
        :return: None
        :rtype:
        """
        htr = self.heat_transfer_rate(data)
        if htr.empty:
            _log.debug('Siemens debug cooling htr returned empty!')
            return
        # change htr to data?
        zhsp = htr['heatingsetpoint'][0] - htr['zonetemperature'][0]
        osp = htr['heatingsetpoint'][0] - htr['outdoortemperature'][0]
        time_diff, temp_diff = get_time_temp_diff(htr, self.t_error)
        if not time_diff:
            _log.debug('Siemens debug heating time_diff == 0!')
            return
        time_avg = time_diff / temp_diff
        time_one_degree = get_time_target(data, 1.0)
        _log.debug(f'S: time_one_degree: {time_one_degree} -- time_avg: {time_avg}')
        if np.isnan(time_one_degree):
            _log.debug('Siemens heating debug time_avg is nan')
            return
        h1 = time_one_degree / 60.0
        preheating = time_diff
        _log.debug('S - preheating: {} - h1: {} - zhsp: {} -- osp: {}'.format(preheating, self.h1, zhsp, osp))
        h2 = ((preheating / 60 - h1 * zhsp) * 10.0) / (osp * zhsp)
        if not np.isfinite(h1) or not np.isfinite(h2):
            _log.debug('S - heating model returned non-numeric coefficients!')
            return
        if h1 <= 0:
            _log.debug('S - heating h1 model returned negative coefficients!')
            return
        if h2 <= 0:
            _log.debug('S - heating h2 model returned negative coefficients!')
            h2 = 0
        self.h1 = trim(self.h1, h1, self.training_period_window)
        self.h2 = trim(self.h2, h2, self.training_period_window)
        self.record = {'date': format_timestamp(dt.now()), 'h1': h1, 'h1_array': self.h1, 'h2': h2, 'h2_array': self.h2}

    def calculate_prestart(self, data, offset, mode):
        """
        Calculate optimal start time using trained coefficients for heating and cooling.
        :param data: DataFrame with data to calculate optimal start time
        :type data: DataFrame
        :param offset: preconditioning offset
        :type offset: float
        :param mode: heating or cooling
        :type mode: str
        :return: time to precondition to reach target offset by DR Event
        :rtype: float
        """
        if not data.empty:
            try:
                csp = data['coolingsetpoint'][-1]
                hsp = data['heatingsetpoint'][-1]
                zonetemp = data['zonetemperature'][-1]
                oat = data['outdoortemperature'][-1]
                if mode == 'cooling':
                    if not self.c1:
                        return (self.earliest_start_time + self.latest_start_time) / 2
                    target = csp - offset
                    coefficient1 = ema(self.c1)
                    coefficient2 = ema(self.c2) if self.c2 else 0
                else:
                    if not self.h1:
                        return (self.earliest_start_time + self.latest_start_time) / 2
                    target = hsp + offset
                    coefficient1 = ema(self.h1)
                    coefficient2 = ema(self.h2) if self.h2 else 0
                zsp = zonetemp - target
                osp = oat - target
                start_time = (coefficient1 * zsp +
                              coefficient2 * zsp * osp / 10.0) * 60.0 + self.adjust_time
            except IndexError as ex:
                _log.debug('Siemens error on calculate - %s -- %s -- %s', self.c1, self.c2, ex)
                start_time = (self.earliest_start_time + self.latest_start_time) / 2
            return self.bound(start_time)


class Johnson(Model):

    def __init__(self, config):
        super(Johnson, self).__init__(config)
        self.c1 = 0
        self.c2 = 0
        self.h1 = 0
        self.h2 = 0
        self.c1_list = []
        self.c2_list = []
        self.h1_list = []
        self.h2_list = []
        self.cooling_heating_adjust = 0.025
        #self.cooling_heating_adjust = config.get('cooling_heating_adjust', 0.025)

    def train_cooling(self, data):
        # cooling trained flag checked
        temp_diff_begin = data['zonetemperature'][0] - data['coolingsetpoint'][0]
        # check if there is cooling data for the training data
        if not data.empty:
            htr = self.heat_transfer_rate(data)
            if htr.empty:
                _log.debug('Johnson debug cooling htr returned empty!')
                return
            time_diff, temp_diff = get_time_temp_diff(htr, self.t_error)
            if not time_diff:
                _log.debug('JCI debug cooling time_diff == 0!')
                return
            time_avg = time_diff / temp_diff
            c2 = get_time_target(data, 1.0)
            _log.debug(f'J: time_one_degree: {c2} -- time_avg: {time_avg}')
            precooling = time_diff
            if precooling - c2 >= 1:
                c1 = (precooling - c2) / (temp_diff_begin * temp_diff_begin)
            else:
                c1 = time_diff / (temp_diff * 10)
            _log.debug('J - cooling: {} - c1: {} - c2: {} -- zcsp: {}'.format(precooling, c1, c2, temp_diff_begin))
            if not np.isfinite(c1) or not np.isfinite(c2):
                _log.debug('J - cooling model returned non-numeric coefficients!')
                return
            if c1 <= 0 or c2 <= 0:
                _log.debug('J - cooling model returned negative coefficients!')
                return
            self.c1_list = trim(self.c1_list, c1, self.training_period_window)
            self.c1 = ema(self.c1_list)
            self.c2_list = trim(self.c2_list, c2, self.training_period_window)
            self.c2 = ema(self.c2_list)
            self.record = {
                'date': format_timestamp(dt.now()),
                'c1': c1,
                'c1_array': self.c1_list,
                'c2': c2,
                'c2_array': self.c2_list
            }

    def train_heating(self, data):
        temp_diff_begin = data['heatingsetpoint'][0] - data['zonetemperature'][0]
        # check if there is heating data for the training data
        if not data.empty:
            htr = self.heat_transfer_rate(data)
            if htr.empty:
                _log.debug('Johnson debug heating htr returned empty!')
                return
            time_diff, temp_diff = get_time_temp_diff(htr, self.t_error)
            if not time_diff:
                _log.debug('JCI debug heating time_diff == 0!')
                return
            time_avg = time_diff / temp_diff
            h2 = get_time_target(data, 1.0)
            _log.debug(f'J: time_one_degree: {h2} -- time_avg: {time_avg}')
            preheating = time_diff
            if preheating - h2 >= 1:
                h1 = (preheating - h2) / (temp_diff_begin * temp_diff_begin)
            else:
                h1 = time_diff / (temp_diff * 10)
            _log.debug('J - heating: {} - h1: {} - h2: {} -- zhsp: {}'.format(preheating, h1, h2, temp_diff_begin))
            if not np.isfinite(h1) or not np.isfinite(h2):
                _log.debug('J - heating model returned non-numeric coefficients!')
                return
            if h1 <= 0 or h2 <= 0:
                _log.debug('J - heating model returned negative coefficients!')
                return
            self.h1_list = trim(self.h1_list, h1, self.training_period_window)
            self.h1 = ema(self.h1_list)
            self.h2_list = trim(self.h2_list, h2, self.training_period_window)
            self.h2 = ema(self.h2_list)
            self.record = {
                'date': format_timestamp(dt.now()),
                'h1': h1,
                'h1_array': self.h1_list,
                'h2': h2,
                'h2_array': self.h2_list
            }

    def calculate_prestart(self, data, offset, mode):
        if not data.empty:
            try:
                csp = data['coolingsetpoint'][-1]
                hsp = data['heatingsetpoint'][-1]
                zonetemp = data['zonetemperature'][-1]
                if mode == 'cooling':
                    target = csp - offset
                    zsp = zonetemp - target
                    coefficient1 = self.c1
                    coefficient2 = self.c2
                else:
                    target = hsp + offset
                    zsp = target - zonetemp
                    coefficient1 = self.h1
                    coefficient2 = self.h2
                start_time = coefficient1 * zsp * zsp + coefficient2
            except Exception as ex:
                _log.debug(
                    f'JCI error on calculate - {ex} - {self.c1_list} - {self.c2_list} - {self.h1_list} - {self.h2_list}'
                )
                start_time = (self.earliest_start_time + self.latest_start_time) / 2
            return self.bound(start_time)


class Sbs(Model):

    def __init__(self, config):
        super(Sbs, self).__init__(config)
        self.e_last = 0
        self.sXY = 0
        self.sX2 = 0
        self.ctime = 0
        self.sp_error_occ = 0
        default_start = (self.earliest_start_time + self.latest_start_time)
        self.alpha = np.exp(-1 / default_start)
        self.train_heating = self.train_cooling
        self.alpha_list = []

    def reset_estimation(self):
        # initialize estimation parameters
        self.sXY = 0
        self.sX2 = 0
        # resset timer
        self.ctime = 0

    def deadband(self, row):
        # apply deadband
        e_b = row['e_b']
        db = row['db']
        if np.abs(e_b) <= db / 2:
            e_a = 0
        elif e_b > db / 2:
            e_a = e_b - db / 2
        else:
            e_a = e_b + db / 2
        return e_a

    def train_cooling(self, data):
        self.reset_estimation()
        data['sp'] = (data['coolingsetpoint'] + data['heatingsetpoint']) / 2
        data['db'] = data['coolingsetpoint'] - data['heatingsetpoint']
        data['e_b'] = data['sp'] - data['zonetemperature']
        data['e_a'] = data.apply(self.deadband, axis=1)
        data['timediff'] = data.index.to_series().diff().dt.total_seconds() / 60
        time_avg = data['timediff'].mean()
        for index, row in data.iterrows():
            self.ctime = self.ctime + time_avg
            # need this to start only after error has jumped due to mode change
            x = self.e_last  # + (self.sp - self.sp_last)
            y = row['e_a']
            self.sX2 = self.sX2 + x**2
            self.sXY = self.sXY + x * y
            _log.debug(f'sbs train -  x: {x} -- y: {y}  --sXy: {self.sXY} -- sX2: {self.sX2}')
            # update previous values
            self.e_last = row['e_a']
        new_alpha = None
        if self.sX2 * self.sXY > 0:
            new_alpha = self.sXY / self.sX2
            # put upper and lower bounds on alpha based on min/max start times
            new_alpha = max(0.001, min(0.999, new_alpha))
            # EWMA of alpha estimate
            self.alpha_list = trim(self.alpha_list, new_alpha, self.training_period_window)
            self.alpha = ema(self.alpha_list)
        _log.debug(f'sbs train2 - new_alpha: {new_alpha} -- alpha: {self.alpha}')
        self.record = {
            'date': format_timestamp(dt.now()),
            'new_alpha': new_alpha,
            'alpha': self.alpha,
            'alpha_array': self.alpha_list
        }

    def calculate_prestart(self, data, offset, mode):
        # set target setpoint and deadband
        try:
            # current room temperature
            yp = data['zonetemperature'][-1]
            if mode == 'cooling':
                rt = data['coolingsetpoint'][-1] - offset
                e0 = yp - rt
            else:
                rt = data['heatingsetpoint'][-1] + offset
                e0 = rt - yp
            if e0 > self.t_error:
                # zone_logger.info("Calculating start time with temperature error")
                prestart_time = np.log(self.t_error / e0) / np.log(self.alpha)
            else:
                prestart_time = self.latest_start_time
            # zone_logger.info("Calculating final start time")
            prestart_time = max(prestart_time, self.latest_start_time)
            prestart_time = min(prestart_time, self.earliest_start_time)
            # zone_logger.info("Calculated final start time")
            # calculate error at start time (time to occupancy in units of dt)
            self.sp_error_occ = e0 * np.power(self.alpha, self.earliest_start_time)
            _log.debug('OPTIMIZE_I: -- %s -- %s', e0, self.sp_error_occ)
        except Exception as ex:
            _log.debug(f'SBS error on calculate {ex} - alpha: {self.alpha}')
            prestart_time = (self.earliest_start_time + self.latest_start_time) / 2
        return self.bound(prestart_time)
