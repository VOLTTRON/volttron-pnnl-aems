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

def asdict_factory(data):

    return {
        field: value.value if isinstance(value, Enum) else value
        for field, value in data
    }

class DFPoints(Enum):
    """Enumeration of data field points.

    Defines a set of standardized fields that represent various operational
    and environmental parameters related to heating, ventilation, and air
    conditioning (HVAC) systems. This enumeration is used to provide a
    uniform way of referencing these parameters across the system.

    :ivar zonetemperature: Represents the temperature of a specified zone.
    :type zonetemperature: str
    :ivar coolingsetpoint: Represents the cooling setpoint of a zone.
    :type coolingsetpoint: str
    :ivar heatingsetpoint: Represents the heating setpoint of a zone.
    :type heatingsetpoint: str
    :ivar supplyfanstatus: Indicates the status of the supply fan.
    :type supplyfanstatus: str
    :ivar outdoortemperature: Represents the outdoor temperature.
    :type outdoortemperature: str
    :ivar heating: Indicates if heating is active.
    :type heating: str
    :ivar cooling: Indicates if cooling is active.
    :type cooling: str
    :ivar occupancy: Indicates if a zone is occupied.
    :type occupancy: str
    :ivar auxiliaryheatcommand: Represents the auxiliary heat command.
    :type auxiliaryheatcommand: str
    :ivar economizersetpoint: Represents the economizer setpoint.
    :type economizersetpoint: str
    :ivar deadband: Represents the deadband setting.
    :type deadband: str
    :ivar unoccupiedheatingsetpoint: Represents the heating setpoint for unoccupied periods.
    :type unoccupiedheatingsetpoint: str
    :ivar unoccupiedcoolingsetpoint: Represents the cooling setpoint for unoccupied periods.
    :type unoccupiedcoolingsetpoint: str
    :ivar occupiedsetpoint: Represents the setpoint when a zone is occupied.
    :type occupiedsetpoint: str
    :ivar conditioning: Indicates if conditioning (cooling or heating) is active.
    :type conditioning: str
    :ivar tempdiff: Represents the temperature difference.
    :type tempdiff: str
    :ivar timediff: Represents the time difference.
    :type timediff: str
    :ivar reversingvalve: Indicates the state of the reversing valve.
    :type reversingvalve: str
    :ivar compressorcommand: Represents the compressor command state.
    :type compressorcommand: str
    :ivar warmcooladjust: Represents the warm/cool adjust setting.
    :type warmcooladjust: str
    :ivar standbytemperatureoffset: Represents the standby temperature offset.
    :type standbytemperatureoffset: str
    """
    zonetemperature = 'zonetemperature'
    coolingsetpoint = 'coolingsetpoint'
    heatingsetpoint = 'heatingsetpoint'
    supplyfanstatus = 'supplyfanstatus'
    outdoortemperature = 'outdoortemperature'
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
    timediff = 'timediff'
    reversingvalve = 'reversingvalve'
    compressorcommand = 'compressorcommand'
    warmcooladjust = 'warmcooladjust'
    standbytemperatureoffset = 'standbytemperatureoffset'
    standbytime = 'standbytime'


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
Points.add_item(DFPoints.outdoortemperature.name, 'OutdoorAirTemperature')
Points.add_item(DFPoints.heating.name, 'FirstStageHeating')
Points.add_item(DFPoints.cooling.name, 'FirstStageCooling')
Points.add_item(DFPoints.occupancy.name, 'OccupancyCommand')
Points.add_item(DFPoints.auxiliaryheatcommand.name, 'AuxiliaryHeatCommand')
Points.add_item(DFPoints.economizersetpoint.name, 'EconomizerSwitchOverSetPoint')
Points.add_item(DFPoints.deadband.name, 'DeadBand')
Points.add_item(DFPoints.unoccupiedheatingsetpoint.name, 'UnoccupiedHeatingSetPoint')
Points.add_item(DFPoints.unoccupiedcoolingsetpoint.name, 'UnoccupiedCoolingSetPoint')
Points.add_item(DFPoints.occupiedsetpoint.name, 'OccupiedSetPoint')
Points.add_item(DFPoints.standbytemperatureoffset.name, 'StandbyTemperatureOffset')
Points.add_item(DFPoints.standbytime.name, 'StandbyTime')


class DaysOfWeek(IntEnum):
    Monday = 0
    Tuesday = 1
    Wednesday = 2
    Thursday = 3
    Friday = 4
    Saturday = 5
    Sunday = 6
