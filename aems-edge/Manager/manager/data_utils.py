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

# Devices and the outdoor-air topic publish once a minute. A reading may stand in
# for at most this many following minutes (missed publishes); longer gaps stay
# missing.
MINUTE_FILL_LIMIT = 2


def _utc_index(index: pd.Index, timezone=None) -> pd.DatetimeIndex:
    """
    ``index`` as a UTC DatetimeIndex.

    Aware timestamps (including mixed UTC offsets, as in a CSV spanning a DST
    change) are converted; naive timestamps are taken as ``timezone`` (UTC if
    None). Ambiguous or nonexistent local times become NaT.
    """
    if isinstance(index, pd.DatetimeIndex) and index.tz is None:
        return index.tz_localize(timezone or 'UTC', ambiguous='NaT', nonexistent='NaT').tz_convert('UTC')
    return pd.DatetimeIndex(pd.to_datetime(index, utc=True))


def to_minute_rows(df: Optional[pd.DataFrame], *, timezone=None,
                   fill_limit: int = MINUTE_FILL_LIMIT) -> Optional[pd.DataFrame]:
    """
    One row per minute, combining every publish received in that minute.

    The buffer holds one row per publish, so a device publish and an outdoor-air
    publish in the same minute are separate, half-empty rows. This merges each
    minute into one row (the last value received for each column in that minute),
    lets a value cover at most ``fill_limit`` following minutes with no reading,
    and drops minutes that still have no zone temperature, so a longer outage
    shows up as a gap in time rather than as copied values.

    :param df: Time-indexed publishes (oldest first).
    :param timezone: Timezone of the result; also used for naive timestamps.
        None keeps UTC.
    :param fill_limit: Most minutes a value may be carried forward.
    :return: Per-minute data (minute-start labels), or ``df`` if it is None/empty.
    """
    if df is None or df.empty:
        return df
    out = df.drop(columns=['ts'], errors='ignore').copy()
    out.index = _utc_index(out.index, timezone)
    out = out[out.index.notna()].sort_index()
    out = out.resample('1min').last().ffill(limit=fill_limit)
    if dfpts.zonetemperature.value in out.columns:
        out = out.dropna(subset=[dfpts.zonetemperature.value])
    else:
        out = out.dropna(how='all')
    if timezone is not None:
        out.index = out.index.tz_convert(timezone)
    out.index.name = 'ts'
    return out


def last_reading_time(df: Optional[pd.DataFrame], column: str, timezone=None) -> Optional[pd.Timestamp]:
    """
    Time of the last real (not filled) value of ``column``.

    :param df: Time-indexed publishes, before any filling.
    :param column: Column name.
    :param timezone: Timezone for naive timestamps (UTC if None).
    :return: UTC timestamp, or None if the column has no value.
    """
    if df is None or df.empty or column not in df.columns:
        return None
    present = df[column].notna().to_numpy()
    if not present.any():
        return None
    times = _utc_index(df.index[present], timezone)
    times = times[times.notna()]
    return times.max() if len(times) else None


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

    def read(self) -> Optional[pd.DataFrame]|None:
        """
        Reads data from the file and returns it as a pandas DataFrame.

        :return: A pandas DataFrame containing the data read from the file (indext by 'ts' column), or None if the file could not be read.
        :rtype: Optional[pd.DataFrame]
        """
        try:
            return pd.read_csv(self.datafile, index_col='ts', parse_dates=True)
        except pd.errors.EmptyDataError:
            _log.debug(f'Empty data file: {self.datafile}')
            return None

    def write(self, df: pd.DataFrame) -> None:
        """
        Writes a pandas DataFrame to the file.

        :param df: The pandas DataFrame to write to the file.
        :type df: pd.DataFrame
        """
        df.to_csv(self.datafile.as_posix())

    def append(self, df: pd.DataFrame) -> None:
        """
        Append rows to the file without a header. The caller must ensure the
        columns match the existing file header.
        """
        df.to_csv(self.datafile.as_posix(), mode='a', header=False)

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
    Buffer of today's device measurements, mirrored to a CSV file so it
    survives restarts.

    Rows are buffered in memory and appended to the CSV one line at a time;
    the DataFrame is only built (and cached) when :attr:`df` is read. The file
    is fully rewritten only when a previously unseen column appears.

    :param timezone: Local timezone used for timestamps.
    :param data_accessor: File accessor for the live CSV.
    :param setpoint_offset: Optional offset widening the occupied setpoints.
    """
    def __init__(self, *, timezone: tz.tz.tzfile, data_accessor: DataFileAccess, setpoint_offset: float | None = None):
        self.current_dt = dt.now()
        self.timezone = timezone
        self.setpoint_offset = setpoint_offset
        self._file_accessor = data_accessor

        self._base_df: Optional[pd.DataFrame] = None  # rows loaded from disk at startup
        self._rows: list[dict] = []                    # rows received since then
        self._df_cache: Optional[pd.DataFrame] = None
        self._file_columns: Optional[list[str]] = None

        if self._file_accessor.datafile.is_file():
            self._base_df = data_accessor.read()
            if self._base_df is not None:
                self._base_df = self._base_df.drop(columns=['ts'], errors='ignore')
                self._file_columns = list(self._base_df.columns)

    @property
    def df(self) -> Optional[pd.DataFrame]:
        """Today's data indexed by timestamp, or None if nothing has been received."""
        if self._df_cache is None and (self._rows or self._base_df is not None):
            frames = [] if self._base_df is None else [self._base_df]
            if self._rows:
                frames.append(pd.DataFrame(self._rows).set_index('ts'))
            self._df_cache = pd.concat(frames, axis=0) if len(frames) > 1 else frames[0]
        return self._df_cache

    @df.setter
    def df(self, value: Optional[pd.DataFrame]) -> None:
        self._base_df = value
        self._rows = []
        self._df_cache = None
        self._file_columns = None if value is None else list(value.columns)

    def assign_local_tz(self, _dt: dt) -> dt:
        """Convert an aware (UTC) timestamp to the local timezone; naive values pass through."""
        if _dt.tzinfo is None or _dt.tzinfo.utcoffset(_dt) is None:
            return _dt
        return _dt.astimezone(self.timezone)

    def process_data(self):
        """
        Rotate the live CSV to a dated file (one row per minute, see
        :func:`to_minute_rows`) and clear the buffer. If the rotation fails the
        live file is removed anyway so the next day's data never mixes with stale
        rows.
        """
        try:
            df = self.df
            if df is not None:
                self._file_accessor.write_date_file(to_minute_rows(df, timezone=self.timezone))
        except Exception as ex:
            _log.warning(f'Error rotating data file: {ex}')
            self._file_accessor.reset_date_file()
        finally:
            self.df = None

    def update_data(self, data: dict, header: dict):
        """
        Store a device publish in today's buffer.

        :param data: data payload from device driver
        :param header: header payload from device driver, contains timestamp
        """
        current_dt = self.assign_local_tz(parser.parse(header[headers_mod.TIMESTAMP]))
        self.current_dt = current_dt
        stored_data = {
            point.name: data[point.value] for point in Points.values() if point.value in data
        }

        csp, hsp = dfpts.coolingsetpoint.value, dfpts.heatingsetpoint.value
        if self.setpoint_offset is not None:
            if csp in stored_data:
                stored_data[csp] += self.setpoint_offset
            if hsp in stored_data:
                stored_data[hsp] -= self.setpoint_offset

        adjust = stored_data.get(dfpts.warmcooladjust.value)
        if adjust is not None:
            if csp in stored_data:
                stored_data[csp] += adjust
            if hsp in stored_data:
                stored_data[hsp] += adjust

        vlv = stored_data.get(dfpts.reversingvalve.value)
        comp = stored_data.get(dfpts.compressorcommand.value)
        if vlv is not None and comp is not None:
            heating = 1 if comp and not vlv else 0
            cooling = 1 if comp and vlv else 0
            stored_data[dfpts.heating.value] = heating
            stored_data[dfpts.cooling.value] = cooling

        if stored_data:
            self.append_df(stored_data, current_dt)

    def append_df(self, data: dict, current_dt: dt):
        """
        Append one row (``{column: value}``) at ``current_dt`` to the buffer and CSV.

        :param data: Column values; scalars or single-element lists.
        :param current_dt: Row timestamp.
        """
        row = {k: (v[0] if isinstance(v, list) else v) for k, v in data.items() if k != 'ts'}
        self._rows.append({'ts': current_dt, **row})
        self._df_cache = None

        try:
            if self._file_columns is not None and set(row) <= set(self._file_columns) \
                    and self._file_accessor.datafile.is_file():
                line = pd.DataFrame([row], index=pd.Index([current_dt], name='ts'),
                                    columns=self._file_columns)
                self._file_accessor.append(line)
            else:
                df = self.df
                self._file_accessor.write(df)
                self._file_columns = list(df.columns)
        except Exception as ex:
            _log.warning(f'Error writing data file: {ex}')

    def get_current_oat(self) -> tuple[dt | None, float | None]:
        """
        Get the last valid measurement of outdoor air temperature.

        :return: The timestamp and value of the last valid measurement of outdoor air temperature.
        """
        oat = Points.outdoortemperature.name
        for row in reversed(self._rows):
            value = row.get(oat)
            if value is not None and not pd.isna(value):
                return row['ts'], value
        if self._base_df is not None and oat in self._base_df.columns:
            series = self._base_df[oat].dropna()
            if not series.empty:
                return series.index[-1], series.iloc[-1]
        return None, None
