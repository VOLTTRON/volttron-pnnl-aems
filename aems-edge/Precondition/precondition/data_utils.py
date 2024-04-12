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

import pandas as pd

warnings.filterwarnings('ignore', category=DeprecationWarning)
from datetime import datetime as dt
from datetime import timedelta as td

from dateutil import parser, tz
from volttron.platform.agent.utils import format_timestamp
from volttron.platform.messaging import headers as headers_mod
from volttron.platform.messaging import topics

_log = logging.getLogger(__name__)


class Data:

    def __init__(self, points, timezone, tag, data_dir=''):
        self.points = points
        self.current_time = dt.now()
        self.df = None
        try:
            self.local_tz = tz.gettz(timezone)
        except:
            self.local_tz = tz.gettz('UTC')
        if data_dir:
            data_file = data_dir + '/data_{}.csv'.format(tag)
        else:
            data_dir = os.path.expanduser('~/.precondition_data')
            data_file = data_dir + '/data_{}.csv'.format(tag)
        self.data_path = data_dir
        self.tag = tag
        _log.debug('Data file: {}'.format(data_file))
        if os.path.isfile(data_file):
            try:
                self.df = pd.read_csv(data_file, index_col='ts')
                self.df.index = pd.to_datetime(self.df.index).apply(self.assign_local_tz)
            except Exception as ex:
                _log.debug('No previous dataframe object: %s', ex)

    def assign_local_tz(self, _dt):
        """
        Convert UTC time from driver to local time.
        :param _dt: datetime object
        :type _dt: datetime.datetime
        :return: localized datetime object
        :rtype: datetime.datetime
        """
        if _dt.tzinfo is None or _dt.tzinfo.utcoffset(_dt) is None:
            _log.debug('TZ: %s', _dt)
            return _dt
        else:
            _dt = _dt.astimezone(self.local_tz)
            _log.debug('TZ: %s', _dt)
            return _dt

    def process_data(self):
        """
        Save data to disk, save 15 days of data.
        :return:
        :rtype:
        """
        _date = format_timestamp(dt.now())
        data_file = self.data_path + '/data_{}_{}.csv'.format(self.tag, _date)
        try:
            self.df.to_csv(data_file)
            self.df = None
        except Exception as ex:
            _log.debug('Error saving df csv!: %s', ex)
            self.df = None

    def update_data(self, payload, header):
        """
        Store current data measurements in daily data df.
        :param payload: data payload from device driver
        :type payload: dict
        :param header: header payload from device driver, contains timestamp
        :type header: dict
        :return: None
        :rtype:
        """
        data, meta = payload
        _now = parser.parse(header[headers_mod.TIMESTAMP])
        stored_data = {}
        current_time = self.assign_local_tz(_now)
        self.current_time = current_time
        for point, value in data.items():
            if point in self.points.values():
                _key = list(filter(lambda x: self.points[x] == point, self.points))[0]
                stored_data[_key] = [value]
        if 'reversingvalve' in stored_data and 'compressorcommand' in stored_data:
            vlv = stored_data['reversingvalve'][0]
            comp = stored_data['compressorcommand'][0]
            if not comp:
                stored_data['heating'] = [0]
                stored_data['cooling'] = [0]
            else:
                if not vlv:
                    stored_data['heating'] = [1]
                    stored_data['cooling'] = [0]
                else:
                    stored_data['heating'] = [0]
                    stored_data['cooling'] = [1]

        if stored_data:
            stored_data['ts'] = [current_time]
            df = pd.DataFrame.from_dict(stored_data)
            df['ts'] = pd.to_datetime(df['ts'])
            df.set_index(df['ts'], inplace=True)
            if self.df is not None:
                self.df = pd.concat([self.df, df], axis=0, ignore_index=False)
                self.df = self.df.drop(columns=['ts'])
            else:
                self.df = df
            data_path = self.data_path + '/data_{}.csv'.format(self.tag)
            self.df.to_csv(data_path)
