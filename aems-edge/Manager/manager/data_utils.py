"""
Copyright (c) 2024, Battelle Memorial Institute
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
from __future__ import annotations

import logging
import warnings
from datetime import datetime as dt
from pathlib import Path
from typing import Optional

import pandas as pd
from dateutil import parser, tz
from volttron.platform.agent.utils import format_timestamp
from volttron.platform.messaging import headers as headers_mod

from .points import DFPoints as dfpts
from .points import Points

warnings.filterwarnings('ignore', category=DeprecationWarning)

_log = logging.getLogger(__name__)


class DataFileAccess:
    """
    This class provides an interface for reading and writing data to a file using pandas DataFrame.

    :param datafile: The path to the data file. Can be a string or a Path object.
    :type datafile: str | Path

    :ivar datafile: The path to the data file.
    :vartype datafile: Path

    .. note:: This class uses pandas for data manipulation.

    .. warning:: This class does not validate the existence of the file at the provided path.

    .. method:: read() -> Optional[pd.DataFrame]

        Reads data from the file and returns it as a pandas DataFrame.

        :return: A pandas DataFrame containing the data read from the file, or None if the file could not be read.
        :rtype: Optional[pd.DataFrame]

    .. method:: write(df: pd.DataFrame) -> None

        Writes the provided pandas DataFrame to the file.

        :param df: The pandas DataFrame to write to the file.
        :type df: pd.DataFrame
    """
    def __init__(self, datafile: str | Path) -> None:
        if isinstance(datafile, str):
            self.datafile = Path(datafile)
        else:
            self.datafile = datafile
        _log.debug(f'Data file: {self.datafile} -- {self.datafile.as_posix()}')

    def read(self) -> Optional[pd.DataFrame]:
        """
        Reads data from the file and returns it as a pandas DataFrame.

        :return: A pandas DataFrame containing the data read from the file (indext by 'ts' column), or None if the file could not be read.
        :rtype: Optional[pd.DataFrame]
        """
        return pd.read_csv(self.datafile, index_col='ts', parse_dates=True)

    def write(self, df: pd.DataFrame) -> None:
        """
        Writes a pandas DataFrame to the file.

        :param df: The pandas DataFrame to write to the file.
        :type df: pd.DataFrame
        """
        df.to_csv(self.datafile.as_posix())

    def write_date_file(self, data: pd.DataFrame) -> None:
        """
        Write data to a new file with a timestamp in the filename.

        :param data: The data to write to the file.
        :type data: pd.DataFrame
        """
        _date = format_timestamp(dt.now())
        new_datafile: Path = self.datafile.parent / f'{self.datafile.stem}_{_date}.csv'
        data.to_csv(new_datafile.as_posix())
        self.datafile.unlink()

    def reset_date_file(self) -> None:
        """
        Reset the data file by deleting it.
        """
        self.datafile.unlink(missing_ok=True)


class Data:
    """
    This class represents a data object with timezone, data accessor, and setpoint offset.

    :param timezone: The timezone for the data.
    :type timezone: tz.tz.tzfile
    :param data_accessor: The data file accessor object.
    :type data_accessor: DataFileAccess
    :param setpoint_offset: The offset for the setpoint, defaults to None.
    :type setpoint_offset: float | None, optional

    :ivar current_dt: The current datetime.
    :vartype current_dt: datetime
    :ivar df: The pandas DataFrame containing the data, or None if the data file does not exist.
    :vartype df: pd.DataFrame | None
    :ivar timezone: The timezone for the data.
    :vartype timezone: tz.tz.tzfile
    :ivar _file_accessor: The data file accessor object.
    :vartype _file_accessor: DataFileAccess
    :ivar setpoint_offset: The offset for the setpoint.
    :vartype setpoint_offset: float | None
    """
    def __init__(self, *, timezone: tz.tz.tzfile, data_accessor: DataFileAccess, setpoint_offset: float | None = None):
        self.current_dt = dt.now()
        self.df = None
        self.timezone = timezone

        self._file_accessor = data_accessor
        if self._file_accessor.datafile.is_file():
            self.df = data_accessor.read()

        self.setpoint_offset = setpoint_offset

    def assign_local_tz(self, _dt: dt) -> dt:
        """
        Convert UTC time from driver to local time.

        :param _dt: datetime object
        :type _dt: datetime.datetime
        :return: localized datetime object
        :rtype: datetime.datetime
        """
        if _dt.tzinfo is None or _dt.tzinfo.utcoffset(_dt) is None:
            _log.debug(f'TZ: {_dt}')
            return _dt
        else:
            _dt = _dt.astimezone(self.timezone)
            _log.debug(f'TZ: {_dt}')
            return _dt

    def process_data(self):
        """
        Save data to disk using forward filled data.
        """
        try:
            self._file_accessor.write_date_file(self.df.fillna(method='ffill'))
        except Exception as ex:
            _log.debug(f'Error saving df csv!: {ex}')
        finally:
            self.df = None

    def update_data(self, data: dict, header: dict):
        """
        Store current data measurements in daily data df.

        :param payload: data payload from device driver
        :type payload: dict
        :param header: header payload from device driver, contains timestamp
        :type header: dict
        :return: None
        :rtype:
        """
        _now = parser.parse(header[headers_mod.TIMESTAMP])
        stored_data = {}
        current_dt = self.assign_local_tz(_now)
        self.current_dt = current_dt
        for point in Points.values():
            if point.value in data:
                value = data[point.value]
                stored_data[point.name] = [value]

        if self.setpoint_offset is not None:
            stored_data[dfpts.coolingsetpoint.value][0] += self.setpoint_offset
            stored_data[dfpts.heatingsetpoint.value][0] -= self.setpoint_offset

        if dfpts.warmcooladjust.value in stored_data:
            stored_data[dfpts.coolingsetpoint.value][0] += stored_data[dfpts.warmcooladjust.value][0]
            stored_data[dfpts.heatingsetpoint.value][0] += stored_data[dfpts.warmcooladjust.value][0]

        if dfpts.reversingvalve.value in stored_data and dfpts.compressorcommand.value in stored_data:
            vlv = stored_data[dfpts.reversingvalve.value][0]
            comp = stored_data[dfpts.compressorcommand.value][0]
            if not comp:
                stored_data[dfpts.heating.value] = [0]
                stored_data[dfpts.cooling.value] = [0]
            else:
                if not vlv:
                    stored_data[dfpts.heating.value] = [1]
                    stored_data[dfpts.cooling.value] = [0]
                else:
                    stored_data[dfpts.heating.value] = [0]
                    stored_data[dfpts.cooling.value] = [1]

        if stored_data:
            self.append_df(stored_data, current_dt)

    def append_df(self, data: dict, current_dt: dt):
        """
        Appends a dictionary of data to a pandas DataFrame and
        reindexes the DataFrame based upon ts.

        :param data: dict, The dictionary of data to append to the DataFrame.
        :param current_dt: dt, The current datetime.
        :return: None
        :rtype: None
        """
        data['ts'] = [current_dt]
        df = pd.DataFrame.from_dict(data)
        df.set_index(df['ts'], inplace=True)
        if self.df is not None:
            self.df = pd.concat([self.df, df], axis=0, ignore_index=False)
            self.df = self.df.drop(columns=['ts'])
        else:
            self.df = df

        self._file_accessor.write(self.df)

    def get_current_oat(self) -> tuple[dt | None, float | None]:
        """
        Get the last valid measurement of outdoor air temperature.

        :return: The timestamp and value of the last valid measurement of outdoor air temperature.
        :rtype: tuple[dt | None, float | None]
        """
        if not self.df.empty:
            if Points.outdoorairtemperature.name in self.df.columns:
                df = self.df[self.df[Points.outdoorairtemperature.name].notna()]
                return df.index[-1], df[Points.outdoorairtemperature.name].iloc[-1]
        return None, None
