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
