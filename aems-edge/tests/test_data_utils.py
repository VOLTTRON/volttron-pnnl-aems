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
import tempfile

import pytest
from manager.data_utils import DataFileAccess

data = """ts,zonetemperature,coolingsetpoint,heatingsetpoint,supplyfanstatus,outdoorairtemperature,heating,cooling
2024-02-12 05:29:41.084089-08:00,68.9000015258789,75.5,71.5,0,55.20000076293945,0,0
2024-02-12 05:30:40.845665-08:00,68.9000015258789,75.5,71.5,1,55.20000076293945,1,1
2024-02-12 05:31:40.777670-08:00,68.9000015258789,75.5,71.5,1,55.20000076293945,1,1
2024-02-12 05:32:40.994120-08:00,68.9000015258789,75.5,71.5,1,55.20000076293945,1,1
2024-02-12 05:33:40.948374-08:00,68.9000015258789,75.5,71.5,1,55.20000076293945,1,1
2024-02-12 05:34:40.847805-08:00,68.9000015258789,75.5,71.5,1,55.20000076293945,1,1
2024-02-12 05:35:40.804499-08:00,68.9000015258789,75.5,71.5,1,55.20000076293945,1,1
2024-02-12 05:36:40.812262-08:00,68.9000015258789,75.5,71.5,1,55.20000076293945,1,1
2024-02-12 05:37:40.845524-08:00,68.9000015258789,75.5,71.5,1,55.20000076293945,1,1
"""


@pytest.fixture
def datafile():
    file = tempfile.NamedTemporaryFile('w', prefix='data', suffix='.csv', delete=False)
    file.write(data)
    file.close()

    yield file.name

    file.unlink()


def test_datafile_endswithcsv():
    df = DataFileAccess(datafile='garbage')
    assert df.datafile.name.endswith('.csv')


def test_datafile_relative_path():
    dfh = DataFileAccess(datafile='garbage')
    assert dfh is not None


def test_datafile_handler(datafile):
    dfh = DataFileAccess(datafile=datafile)
    assert dfh is not None
    df = dfh.read()
    assert df is not None
    split_data = data.splitlines()
    assert len(split_data) - 1 == len(df.index)
    # ts is now a part of the index after read is called.
    assert len(split_data[0].split(',')) - 1 == len(df.columns)
