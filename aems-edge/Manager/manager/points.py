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

from dataclasses import dataclass, field
from enum import Enum, IntEnum
from typing import List


@dataclass
class Cooling:
    point: str


@dataclass
class MultiStageCooling:
    stages: list[Cooling] = field(default_factory=list)

    def __post_init__(self):
        if not self.stages:
            raise ValueError('MultiStageCooling must have at least one stage.')


# Currently limiting to support for 2-stages of cooling
cooling = MultiStageCooling(stages=[
    Cooling(point='FirstStageCooling'),
    Cooling(point='SecondStageCooling')
])


class SetpointControlType(Enum):
    CommonSetpoint = 0
    DetatchedSetpoint = 1
    AttachedSetpoint = 2


class OccupancyTypes(Enum):
    OCCUPIED = 'occupied'
    UNOCCUPIED = 'unoccupied'
    RELEASE = None


class DFPoints(Enum):
    """
    A class representing the data points in the dataframe used within the manager.

    Each data point is represented as an enumeration constant.

    Attributes:
        zonetemperature (str): The zone temperature.
        coolingsetpoint (str): The cooling setpoint.
        heatingsetpoint (str): The heating setpoint.
        supplyfanstatus (str): The supply fan status.
        outdoorairtemperature (str): The outdoor air temperature.
        heating (str): The heating status.
        cooling (str): The cooling status.
        occupancy (str): The occupancy status.
        auxiliaryheatcommand (str): The auxiliary heat command.
        economizersetpoint (str): The economizer setpoint.
        deadband (str): The deadband.
        unoccupiedheatingsetpoint (str): The unoccupied heating setpoint.
        unoccupiedcoolingsetpoint (str): The unoccupied cooling setpoint.
        occupiedsetpoint (str): The occupied setpoint.
        conditioning (str): The conditioning status.
        tempdiff (str): The temperature difference.
    """
    zonetemperature = 'zonetemperature'
    coolingsetpoint = 'coolingsetpoint'
    heatingsetpoint = 'heatingsetpoint'
    supplyfanstatus = 'supplyfanstatus'
    outdoorairtemperature = 'outdoorairtemperature'
    heating = 'heating'
    cooling = 'cooling'
    occupancy = 'occupancy'
    auxiliaryheatcommand = 'auxiliaryheatcommand'
    economizersetpoint = 'economizersetpoint'
    deadband = 'deadband'
    unoccupiedheatingsetpoint = 'unoccupiedheatingsetpoint'
    unoccupiedcoolingsetpoint = 'unoccupiedcoolingsetpoint'
    occupiedsetpoint = 'occupiedsetpoint'
    conditioning = 'conditioning'
    tempdiff = 'tempdiff'
    reversingvalve = 'reversingvalve'
    compressorcommand = 'compressorcommand'
    warmcooladjust = 'warmcooladjust'


@dataclass
class PointValue:
    value: str
    name: str


class _Points:
    def __init__(self):
        self._points: dict[str, PointValue] = {}
        self._curitter = None

    def add_item(self, key: str, value: str):
        self._points[key] = PointValue(value, key)

    def __getattr__(self, key: str) -> PointValue:
        return self._points[key]

    def keys(self) -> List[str]:
        return list(self._points.keys())

    def values(self) -> List[PointValue]:
        return list(self._points.values())

    def __iter__(self):
        self._curitter = iter(self._points)
        return self._curitter

    def __len__(self):
        return len(self._points)

    def __next__(self):
        item = next(self._curitter)
        return item


Points = _Points()
Points.add_item(DFPoints.zonetemperature.name, 'ZoneTemperature')
Points.add_item(DFPoints.coolingsetpoint.name, 'OccupiedCoolingSetPoint')
Points.add_item(DFPoints.heatingsetpoint.name, 'OccupiedHeatingSetPoint')
Points.add_item(DFPoints.supplyfanstatus.name, 'SupplyFanStatus')
Points.add_item(DFPoints.outdoorairtemperature.name, 'OutdoorAirTemperature')
Points.add_item(DFPoints.heating.name, 'FirstStageHeating')
Points.add_item(DFPoints.cooling.name, 'FirstStageCooling')
Points.add_item(DFPoints.occupancy.name, 'OccupancyCommand')
Points.add_item(DFPoints.auxiliaryheatcommand.name, 'AuxiliaryHeatCommand')
Points.add_item(DFPoints.economizersetpoint.name, 'EconomizerSwitchOverSetPoint')
Points.add_item(DFPoints.deadband.name, 'DeadBand')
Points.add_item(DFPoints.unoccupiedheatingsetpoint.name, 'UnoccupiedHeatingSetPoint')
Points.add_item(DFPoints.unoccupiedcoolingsetpoint.name, 'UnoccupiedCoolingSetPoint')
Points.add_item(DFPoints.occupiedsetpoint.name, 'OccupiedSetPoint')


class DaysOfWeek(IntEnum):
    Monday = 0
    Tuesday = 1
    Wednesday = 2
    Thursday = 3
    Friday = 4
    Saturday = 5
    Sunday = 6