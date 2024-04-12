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
import sys
from datetime import datetime as dt
from datetime import timedelta as td
from statistics import median

import dill
import gevent
import numpy as np
import pandas as pd
from dateutil.parser import parse
from volttron.platform.agent import utils
from volttron.platform.agent.utils import (format_timestamp, get_aware_utc_now,
                                           setup_logging)
from volttron.platform.jsonrpc import RemoteError
from volttron.platform.messaging import topics
from volttron.platform.scheduling import cron
from volttron.platform.vip.agent import RPC, Agent, Core

from .data_utils import Data
from .model import Carrier, Johnson, Sbs, Siemens

pd.set_option('display.max_rows', None)
__author__ = 'Robert Lutes, robert.lutes@pnnl.gov'
__version__ = '0.0.1'

setup_logging()
_log = logging.getLogger(__name__)


class Precondtioning(Agent):

    def __init__(self, config_path, **kwargs):
        super(Precondtioning, self).__init__(**kwargs)
        config = utils.load_config(config_path)
        # topic for device level data
        campus = config.get('campus', '')
        building = config.get('building', '')
        self.device = config.get('system', '')
        self.set_points = config.get('set_points')
        self.revert_value = {}
        self.revert = config.get('revert', None)
        self.results_topic = topics.RECORD(
            subtopic='/'.join([campus, building, self.device, 'Precondition']))
        self.results_model = topics.RECORD(
            subtopic='/'.join([campus, building, self.device, 'PreconditionModel']))

        self.system_rpc_path = topics.RPC_DEVICE_PATH(campus=campus,
                                                      building=building,
                                                      unit=self.device,
                                                      path='',
                                                      point=None)
        self.base_device_topic = topics.DEVICES_VALUE(campus=campus,
                                                      building=building,
                                                      unit='',
                                                      path=self.device,
                                                      point='all')
        # Configuration for data handler
        self.precondition_offset = config.get('precondition_offset', 1.0)
        self.early_start_offset = config.get('earliest_start_time', 60)
        timezone = config.get('local_tz', 'UTC')
        self.zone_point_names = config.get('zone_point_names')
        self.data_handler = Data(self.zone_point_names, timezone, self.device)

        # Controller parameters
        self.actuator = config.get('actuator', 'platform.actuator')
        # Time and schedule object initialization
        self.current_time = None
        self.start_obj = None
        self.end_obj = None
        self.mode = None
        self.trained = False
        # change to manager path for AEMS
        self.manager_path = os.path.expanduser('~/.manager')
        self.model_path = os.path.expanduser('~/.precondition_{}'.format(self.device))
        self.models = {'j': None, 's': None, 'c': None, 'sbs': None}
        self.config = config
        self.core.schedule(cron('1 0 * * *'), self.set_up_run)
        self.event_config = config.get('event', None)

    def load_models(self, config):
        """
        Create or load model pickle.
        :param config: dict of configurations
        :return: None
        """
        self.models = {'j': None, 's': None, 'c': None, 'sbs': None}
        if not os.path.exists(self.model_path):
            os.makedirs(self.model_path)
        if not os.listdir(self.model_path):
            _path = os.path.expanduser('~/models')
        else:
            _path = self.model_path
        for tag in self.models:
            try:
                _file = _path + '/{}_{}.pickle'.format(self.device, tag)
                with open(_file, 'rb') as f:
                    _cls = dill.load(f)
                self.models[tag] = _cls
            except Exception as ex:
                _log.debug('Exception loading pickle!: {}'.format(ex))
                continue
        if self.models['j'] is None:
            self.models['j'] = Johnson(config)
        if self.models['s'] is None:
            self.models['s'] = Siemens(config)
        if self.models['c'] is None:
            self.models['c'] = Carrier(config)
        if self.models['sbs'] is None:
            self.models['sbs'] = Sbs(config)
        for tag, cls in self.models.items():
            cls._start(config)

    @Core.receiver('onstart')
    def starting_base(self, sender, **kwargs):
        """
        Startup method:
         - Setup subscriptions to devices.
        :param sender:
        :param kwargs:
        :return:
        """
        _log.debug('Starting!')

        self.vip.pubsub.subscribe(peer='pubsub',
                                  prefix=self.base_device_topic,
                                  callback=self.update_data)
        _log.debug('Subscribing to %s', self.base_device_topic)
        self.load_models(self.config)
        _log.debug('Get event - %s', self.event_config)
        if self.event_config is not None:
            self.set_event(self.event_config)

    @RPC.export
    def set_event(self, data):
        _log.debug('Set event!')
        start_time = data.get('start_time')
        self.mode = data.get('mode', 'cooling')
        if start_time is not None:
            _log.debug('Set event time - %s --- %s', start_time, self.mode)
            start_time = parse(start_time)
            self.event_time = start_time
            early_start = start_time - td(minutes=self.early_start_offset)
            _log.debug('Set run_method - %s', early_start)
            self.event = self.core.schedule(early_start, self.run_method)

    def train_models(self):
        """
        Run daily after startup to update model coefficients.
        Save each model class as a pickle to allow saving state.
         - train each model with morning startup data.
         - Save model as pickle on disk for saving state.
        :return:
        """
        if not self.trained or not os.listdir(self.model_path):
            j = Johnson(self.config)
            s = Siemens(self.config)
            c = Carrier(self.config)
            sbs = Sbs(self.config)
            self.models = {'j': j, 's': s, 'c': c, 'sbs': sbs}
        for tag, model in self.models.items():
            try:
                data = self.data_handler.df
                start_time = self.start_time + td(minutes=1)
                model.train(data, start_time, self.event_time)
            except Exception as ex:
                _log.debug('ERROR training model {}: -- {}'.format(tag, ex))
                continue
            try:
                _file = self.model_path + '/{}_{}.pickle'.format(self.device, tag)
                with open(_file, 'wb') as f:
                    dill.dump(model, file=f)
            except Exception as ex:
                _log.debug('Could not store object %s -- %s', tag, ex)
            try:
                record = model.record
                _log.debug('MODEL parameters: {}'.format(record))
                if record:
                    headers = {'Date': format_timestamp(get_aware_utc_now())}
                    topic = self.results_model + '/{}'.format(tag)
                    self.vip.pubsub.publish('pubsub', topic, headers, record)
            except:
                _log.debug('ERROR publishing result!')
                continue

    def update_data(self, peer, sender, bus, topic, header, message):
        """
        Store current data measurements in daily data df.
        """
        _log.debug('Update data : %s', topic)
        self.data_handler.update_data(message, header)

    def set_up_run(self):
        """
        Run based daily based on cron schedule.  This method calculates the earliest start time
        and schedules the run_method.
        """
        _log.debug('Setting up run!')
        self.data_handler.process_data()

    def run_method(self):
        """
        Run at the earliest start time for the day.  Use models to calculate needed
        prestart time to meet room temperature requirements.
        """
        self.result = {}
        _log.debug('Run Method!')
        for tag, model in self.models.items():
            data = self.data_handler.df
            prestart_time = model.calculate_prestart(data, self.precondition_offset, self.mode)
            self.result[tag] = prestart_time
            _log.debug('Precondition each %s --- %s', tag, prestart_time)
        start_times = [item for item in self.result.values() if item > 0]
        median_time = median(start_times)
        _log.debug('Precondition all %s', median_time)
        self.start_time = self.event_time - td(minutes=median_time)
        current_time = dt.now()
        headers = {'Date': format_timestamp(get_aware_utc_now())}
        self.vip.pubsub.publish('pubsub', self.results_topic, headers, self.result).get(timeout=10)

        if self.start_time < current_time:
            self.start_time = current_time
        self.start_obj = self.core.schedule(self.start_time, self.start_preconditioning)
        self.end_obj = self.core.schedule(self.event_time, self.end_preconditioning)

    def end_preconditioning(self):
        """
        Makes RPC call to actuator agent to change zone control when zone transition to occupied
            or unoccupied mode.
        :param rpc_path: str; device path used by actuator agent set_point method
        :param control: dict; key - str for control point; value - value to set for control
        :return:
        """
        for topic, value in self.revert_value.items():
            try:
                result = self.vip.rpc.call(self.actuator, 'set_point', 'precondition', topic,
                                           value).get(timeout=30)
            except (RemoteError, gevent.Timeout) as ex:
                _log.warning('Failed to set {} to {}: {}'.format(topic, value, str(ex)))
                continue
        self.trained = True
        self.train_models()
        self.mode = None
        self.revert_value = {}

    def start_preconditioning(self):
        """
        Makes RPC call to actuator agent to change zone control when zone transition to occupied
            or unoccupied mode.
        :param rpc_path: str; device path used by actuator agent set_point method
        :param control: dict; key - str for control point; value - value to set for control
        :return:
        """
        set_value = None
        if self.mode is not None and self.mode in self.set_points:
            point = self.set_points[self.mode]
        else:
            _log.debug('No Mode Set!')
            return
        topic = self.system_rpc_path(point=point)
        try:
            result = self.vip.rpc.call(self.actuator, 'get_point', topic).get(timeout=30)
            if self.revert == 'store':
                self.revert_value[topic] = result
            else:
                self.revert_value[topic] = None
            if self.mode == 'cooling':
                set_value = result - self.precondition_offset
            elif self.mode == 'heating':
                set_value = result + self.precondition_offset
            result = self.vip.rpc.call(self.actuator, 'set_point', 'precondition', topic,
                                       set_value).get(timeout=30)
        except (RemoteError, gevent.Timeout) as ex:
            _log.warning('Failed to set {} to {}: {}'.format(topic, set_value, str(ex)))


def main(argv=sys.argv):
    """Main method called by the aip."""
    try:
        utils.vip_main(Precondtioning)
    except Exception as exception:
        _log.exception('unhandled exception')
        _log.error(repr(exception))


if __name__ == '__main__':
    # Entry point for script
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        pass
