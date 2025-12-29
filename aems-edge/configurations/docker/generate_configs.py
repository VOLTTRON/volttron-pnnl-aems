import os
import sys
import shutil
from pathlib import Path
import io
import csv
import configargparse
import netifaces as ni
import json
import yaml
import ipaddress

ADDRESS_OFFSET_DEFAULT = 0
SCHNEIDER_CSV_NAME = 'schneider.csv'
SCHNEIDER_OAT_CSV_NAME = 'schneider_oat.csv'
DENT_CSV_NAME = 'dent.csv'
MANAGER_CONFIG_FILENAME_TEMPLATE = "manager.{device_name}.config"

DEVICE_BLOCK_DICT = lambda campus, building, device_name: {
    f"devices/{campus}/{building}/{device_name}": {
        "file": f"$CONFIG/configuration_store/platform.driver/devices/{campus}/{building}/{device_name}"
    }
}



schneider_registry = \
"""Reference Point Name,Volttron Point Name,Units,Unit Details,BACnet Object Type,Property,Writable,Index,Write Priority,Notes
Effective Setpoint,EffectiveZoneTemperatureSetPoint,degreesFahrenheit,,analogInput,presentValue,TRUE,329,16,
PI Heating Demand,HeatingDemand,percent,(default 100.0),analogOutput,presentValue,TRUE,21,16,
PI Cooling Demand,CoolingDemand,percent,(default 0.0),analogOutput,presentValue,TRUE,22,16,
Economizer Demand,EconomizerDemand,percent,(default 0.0),analogOutput,presentValue,TRUE,23,16,
Analog Output Heat Demand,ModulatingHeatingDemand,percent,(default 0.0),analogOutput,presentValue,TRUE,24,16,
UO11 Analog Output,UO11 Analog Output,volts,(default 0.0),analogOutput,presentValue,TRUE,123,16,
UO12 Analog Output,UO12 Analog Output,volts,(default 0.0),analogOutput,presentValue,TRUE,124,16,
UO9 Analog Output,UO9 Analog Output,volts,(default 0.0),analogOutput,presentValue,TRUE,125,16,
UO10 Analog Output,EconomizerVoltageOutput,volts,(default 0.0),analogOutput,presentValue,TRUE,126,16,
StandbyTime,StandbyTime,noUnits,(default 0.0),analogValue,presentValue,TRUE,25,16,Param. A (AV25)
ActOcc,EffectiveOccupancy,noUnits,(default 0.0),analogValue,presentValue,FALSE,26,,Only Used on PIR
SptPriorValue,SptPriorValue,noUnits,(default 0.0),analogValue,presentValue,TRUE,27,16,Param. C (AV27)
CommFailTmr,CommunicationFailureTimer,noUnits,(default 0.0),analogValue,presentValue,TRUE,28,16,Param. D (AV28)
DR Flag,DemandResponseFlag,enum,,analogValue,presentValue,TRUE,29,8,
HeartBeat,HeartBeat,enum,,analogValue,presentValue,TRUE,30,8,
Occupied Heat Setpoint,OccupiedHeatingSetPoint,degreesFahrenheit,(default 72.0),analogValue,presentValue,TRUE,39,16,
Occupied Cool Setpoint,OccupiedCoolingSetPoint,degreesFahrenheit,(default 75.0),analogValue,presentValue,TRUE,40,16,
Unoccupied Heat Setpoint,UnoccupiedHeatingSetPoint,degreesFahrenheit,(default 62.0),analogValue,presentValue,TRUE,43,16,
Unoccupied Cool Setpoint,UnoccupiedCoolingSetPoint,degreesFahrenheit,(default 80.0),analogValue,presentValue,TRUE,44,16,
Standby Temperature Differential,StandbyTemperatureOffset,deltaDegreesFahrenheit,(default 4.0),analogValue,presentValue,TRUE,46,16,
Heating Setpoint Limit,HeatingSetpointLimit,degreesFahrenheit,(default 90.0),analogValue,presentValue,TRUE,58,16,
Cooling Setpoint Limit,CoolingSetpointLimit,degreesFahrenheit,(default 54.0),analogValue,presentValue,TRUE,59,16,
Minimum Deadband,DeadBand,deltaDegreesFahrenheit,(default 3.0),analogValue,presentValue,TRUE,63,16,
Proportional Band,ProportionalBand,noUnits,(default 3.0),analogValue,presentValue,TRUE,65,16,
Calibrate Outside Temperature Sensor,CalibrateOutsideTemperatureSensor,deltaDegreesFahrenheit,(default 0.0),analogValue,presentValue,TRUE,74,16,
Number of Cooling Stages,NumberCoolingStages,noUnits,(default 2.0),analogValue,presentValue,TRUE,75,16,
Economizer Minimum Position,EconomizerMinimumPosition,percent,(default 0.0),analogValue,presentValue,TRUE,78,16,
Economizer Maximum Position,EconomizerMaximumPosition,percent,(default 100.0),analogValue,presentValue,TRUE,81,16,
High balance point,HighBalancePoint,degreesFahrenheit,(default 90.0),analogValue,presentValue,TRUE,82,16,
Low balance point,LowBalancePoint,degreesFahrenheit,(default -12.0),analogValue,presentValue,TRUE,83,16,
Anti Short Cycle Time,AntiShortCycleTime,minutes,(default 2.0),analogValue,presentValue,TRUE,86,16,
Number of Heating Stages,NumberHeatingStages,noUnits,(default 2.0),analogValue,presentValue,TRUE,87,16,
Heating Lockout from Outside Air Temperature,HeatingLockoutOutdoorAirTemperature,degreesFahrenheit,(default 120.0),analogValue,presentValue,TRUE,91,16,
Cooling Lockout,CoolingLockoutOutdoorAirTemperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,93,16,
Changeover Setpoint,EconomizerSwitchOverSetPoint,degreesFahrenheit,(default 55.0),analogValue,presentValue,TRUE,95,16,
Room Temperature,ZoneTemperature,degreesFahrenheit,(default 68.70000457763672),analogValue,presentValue,TRUE,100,16,
UI22 Supply Temperature,UI22 Supply Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,102,16,
Room Humidity,ZoneHumidity,percentRelativeHumidity,(default 14.0),analogValue,presentValue,TRUE,103,16,
UI19 Temperature,UI19 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,104,16,
UI20 Remote Temperature,UI20 Remote Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,105,16,
UI19 Analog Input,UI19 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,108,16,
UI24 Temperature,UI24 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,109,16,
UI16 Analog Input,UI16 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,111,16,
UI17 Analog Input,UI17 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,112,16,
UI20 Analog Input,ZoneTemperatureVoltage,volts,(default 0.0),analogValue,presentValue,TRUE,113,16,
UI22 Analog Input,UI22 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,114,16,
UI23 Analog Input,UI23 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,115,16,
UI24 Analog Input,UI24 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,116,16,
UI16 Temperature,UI16 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,117,16,
UI17 Temperature,UI17 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,118,16,
UI20 Temperature,UI20 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,120,16,
UI22 Temperature,SupplyAirTemperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,121,16,
Mixed Air Temperature,MixedAirTemperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,125,16,
G Fan Status,SupplyFanStatus,Enum,0-1 (default 1),binaryOutput,presentValue,TRUE,25,16,
Y1 Status,FirstStageCooling,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,26,16,
Y2 Status,SecondStageCooling,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,27,16,
W1 Status,FirstStageHeating,Enum,0-1 (default 1),binaryOutput,presentValue,TRUE,28,16,
W2/OB Status,ReversingValve,Enum,0-1 (default 1),binaryOutput,presentValue,TRUE,29,16,
UO10 Binary Output,UO10 Binary Output,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,94,16,
BO1 Auxiliary Binary Output,AuxiliaryHeatCommand,Enum,0-1 (default 1),binaryOutput,presentValue,TRUE,98,16,
UO11 Binary Output,UO11 Binary Output,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,101,16,
UO12 Binary Output,UO12 Binary Output,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,102,16,
Smart Recovery Status,Smart Recovery Status,Enum,0-1 (default 0),binaryValue,presentValue,TRUE,40,16,
Frost Protection Alarm,FrostProtectionAlarm,Enum,0-1 (default 0),binaryValue,presentValue,TRUE,43,16,
Effective Occupancy,EffectiveOccupancy,State,State count: 4,multiStateInput,presentValue,TRUE,33,16,"1=Unoccupied, 2=Override, 3=Standby"
Effective temperature sensor,Effective temperature sensor,State,State count: 23,multiStateInput,presentValue,TRUE,309,16,"1=Internal, 2=WL IO, 3=WL 1, 4=WL 2, 5=WL 3, 6=WL 4, 7=WL 5, 8=WL 6, 9=WL 7, 10=WL 8, 11=WL 9, 12=WL 10, 13=WL 11, 14=WL 12, 15=WL 13, 16=WL 14, 17=WL 15, 18=WL 16, 19=WL 17, 20=WL 18, 21=WL 19, 22=WL 20"
Effective System Mode,EffectiveSystemMode,State,State count: 2,multiStateInput,presentValue,TRUE,314,16,1=Heat
Time source,TimeSource,State,State count: 5,multiStateInput,presentValue,TRUE,325,16,"1=Local, 2=BACnet, 3=NTP, 4=Cloud"
Fan Speed Status,FanSpeedStatus,State,State count: 4,multiStateInput,presentValue,TRUE,326,16,"1=Low, 2=Med, 3=High"
Occupancy Command,OccupancyCommand,State,State count: 3 (default 2),multiStateValue,presentValue,TRUE,10,16,"1=Occupied, 2=Unocc."
Fan Delay,FanDelay,State,State count: 2 (default 2),multiStateValue,presentValue,TRUE,12,16,1=On
System Mode,SystemMode,State,State count: 4 (default 4),multiStateValue,presentValue,TRUE,16,16,"1=Auto, 2=Cool, 3=Heat"
Fan Mode,FanMode,State,State count: 3 (default 2),multiStateValue,presentValue,TRUE,17,16,"1=Auto, 2=Smart"
Frost Protection,FrostProtection,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,55,16,1=On
Setpoint Function,SetpointFunction,State,State count: 2 (default 2),multiStateValue,presentValue,TRUE,58,9,1=Attach SP
Enable Smart Recovery,EnableSmartRecovery,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,71,9,1=On
Economizer Configuration,HasEconomizer,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,72,9,1=On
Mechanical Cooling Allowed,MechanicalCoolingDuringEconomizing,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,79,9,1=On
BO1 Auxiliary Output Configuration,BO1 Auxiliary Output Configuration,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,92,9,1=NC
Fan Control in Heating Mode,FanControlHeatingMode,State,State count: 2 (default 2),multiStateValue,presentValue,TRUE,95,9,1=On
UO9 Configuration,UO9 Configuration,State,State count: 4 (default 4),multiStateValue,presentValue,TRUE,96,9,"1=Binary, 2=Relay RC, 3=Relay RH"
UO10 Configuration,UO10 Configuration,State,State count: 3 (default 1),multiStateValue,presentValue,TRUE,97,9,"1=Binary, 2=Relay RC"
UO11 Configuration,UO11 Configuration,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,98,9,1=Binary
UO12 Configuration,UO12 Configuration,State,State count: 2 (default 2),multiStateValue,presentValue,TRUE,99,9,1=Binary
Comfort or economy mode,Comfort or economy mode,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,116,9,1=Economy
Reversing valve operation,ReversingValveOperation,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,117,9,1=B
Compressor - auxiliary interlock,CompressorAuxiliaryInterlock,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,118,9,1=On
Application,Application,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,119,9,1=Heatpump"""


schneider_oat_registry = \
"""Reference Point Name,Volttron Point Name,Units,Unit Details,BACnet Object Type,Property,Writable,Index,Write Priority,Notes
Effective Setpoint,EffectiveZoneTemperatureSetPoint,degreesFahrenheit,,analogInput,presentValue,TRUE,329,16,
PI Heating Demand,HeatingDemand,percent,(default 100.0),analogOutput,presentValue,TRUE,21,16,
PI Cooling Demand,CoolingDemand,percent,(default 0.0),analogOutput,presentValue,TRUE,22,16,
Economizer Demand,EconomizerDemand,percent,(default 0.0),analogOutput,presentValue,TRUE,23,16,
Analog Output Heat Demand,ModulatingHeatingDemand,percent,(default 0.0),analogOutput,presentValue,TRUE,24,16,
UO11 Analog Output,UO11 Analog Output,volts,(default 0.0),analogOutput,presentValue,TRUE,123,16,
UO12 Analog Output,UO12 Analog Output,volts,(default 0.0),analogOutput,presentValue,TRUE,124,16,
UO9 Analog Output,UO9 Analog Output,volts,(default 0.0),analogOutput,presentValue,TRUE,125,16,
UO10 Analog Output,EconomizerVoltageOutput,volts,(default 0.0),analogOutput,presentValue,TRUE,126,16,
StandbyTime,StandbyTime,noUnits,(default 0.0),analogValue,presentValue,TRUE,25,16,Param. A (AV25)
ActOcc,EffectiveOccupancy,noUnits,(default 0.0),analogValue,presentValue,FALSE,26,,Only Used on PIR
SptPriorValue,SptPriorValue,noUnits,(default 0.0),analogValue,presentValue,TRUE,27,16,Param. C (AV27)
CommFailTmr,CommunicationFailureTimer,noUnits,(default 0.0),analogValue,presentValue,TRUE,28,16,Param. D (AV28)
DR Flag,DemandResponseFlag,enum,,analogValue,presentValue,TRUE,29,8,
HeartBeat,HeartBeat,enum,,analogValue,presentValue,TRUE,30,8,
Occupied Heat Setpoint,OccupiedHeatingSetPoint,degreesFahrenheit,(default 72.0),analogValue,presentValue,TRUE,39,16,
Occupied Cool Setpoint,OccupiedCoolingSetPoint,degreesFahrenheit,(default 75.0),analogValue,presentValue,TRUE,40,16,
Unoccupied Heat Setpoint,UnoccupiedHeatingSetPoint,degreesFahrenheit,(default 62.0),analogValue,presentValue,TRUE,43,16,
Unoccupied Cool Setpoint,UnoccupiedCoolingSetPoint,degreesFahrenheit,(default 80.0),analogValue,presentValue,TRUE,44,16,
Standby Temperature Differential,StandbyTemperatureOffset,deltaDegreesFahrenheit,(default 4.0),analogValue,presentValue,TRUE,46,16,
Heating Setpoint Limit,HeatingSetpointLimit,degreesFahrenheit,(default 90.0),analogValue,presentValue,TRUE,58,16,
Cooling Setpoint Limit,CoolingSetpointLimit,degreesFahrenheit,(default 54.0),analogValue,presentValue,TRUE,59,16,
Minimum Deadband,DeadBand,deltaDegreesFahrenheit,(default 3.0),analogValue,presentValue,TRUE,63,16,
Proportional Band,ProportionalBand,noUnits,(default 3.0),analogValue,presentValue,TRUE,65,16,
Calibrate Outside Temperature Sensor,CalibrateOutsideTemperatureSensor,deltaDegreesFahrenheit,(default 0.0),analogValue,presentValue,TRUE,74,16,
Number of Cooling Stages,NumberCoolingStages,noUnits,(default 2.0),analogValue,presentValue,TRUE,75,16,
Economizer Minimum Position,EconomizerMinimumPosition,percent,(default 0.0),analogValue,presentValue,TRUE,78,16,
Economizer Maximum Position,EconomizerMaximumPosition,percent,(default 100.0),analogValue,presentValue,TRUE,81,16,
High balance point,HighBalancePoint,degreesFahrenheit,(default 90.0),analogValue,presentValue,TRUE,82,16,
Low balance point,LowBalancePoint,degreesFahrenheit,(default -12.0),analogValue,presentValue,TRUE,83,16,
Anti Short Cycle Time,AntiShortCycleTime,minutes,(default 2.0),analogValue,presentValue,TRUE,86,16,
Number of Heating Stages,NumberHeatingStages,noUnits,(default 2.0),analogValue,presentValue,TRUE,87,16,
Heating Lockout from Outside Air Temperature,HeatingLockoutOutdoorAirTemperature,degreesFahrenheit,(default 120.0),analogValue,presentValue,TRUE,91,16,
Cooling Lockout,CoolingLockoutOutdoorAirTemperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,93,16,
Changeover Setpoint,EconomizerSwitchOverSetPoint,degreesFahrenheit,(default 55.0),analogValue,presentValue,TRUE,95,16,
Room Temperature,ZoneTemperature,degreesFahrenheit,(default 68.70000457763672),analogValue,presentValue,TRUE,100,16,
Outdoor Temperature,OutdoorAirTemperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,101,16,
UI22 Supply Temperature,UI22 Supply Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,102,16,
Room Humidity,ZoneHumidity,percentRelativeHumidity,(default 14.0),analogValue,presentValue,TRUE,103,16,
UI19 Temperature,UI19 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,104,16,
UI20 Remote Temperature,UI20 Remote Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,105,16,
UI19 Analog Input,UI19 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,108,16,
UI24 Temperature,UI24 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,109,16,
UI16 Analog Input,UI16 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,111,16,
UI17 Analog Input,UI17 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,112,16,
UI20 Analog Input,ZoneTemperatureVoltage,volts,(default 0.0),analogValue,presentValue,TRUE,113,16,
UI22 Analog Input,UI22 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,114,16,
UI23 Analog Input,UI23 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,115,16,
UI24 Analog Input,UI24 Analog Input,volts,(default 0.0),analogValue,presentValue,TRUE,116,16,
UI16 Temperature,UI16 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,117,16,
UI17 Temperature,UI17 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,118,16,
UI20 Temperature,UI20 Temperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,120,16,
UI22 Temperature,SupplyAirTemperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,121,16,
Mixed Air Temperature,MixedAirTemperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,125,16,
G Fan Status,SupplyFanStatus,Enum,0-1 (default 1),binaryOutput,presentValue,TRUE,25,16,
Y1 Status,FirstStageCooling,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,26,16,
Y2 Status,SecondStageCooling,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,27,16,
W1 Status,FirstStageHeating,Enum,0-1 (default 1),binaryOutput,presentValue,TRUE,28,16,
W2/OB Status,ReversingValve,Enum,0-1 (default 1),binaryOutput,presentValue,TRUE,29,16,
UO10 Binary Output,UO10 Binary Output,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,94,16,
BO1 Auxiliary Binary Output,AuxiliaryHeatCommand,Enum,0-1 (default 1),binaryOutput,presentValue,TRUE,98,16,
UO11 Binary Output,UO11 Binary Output,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,101,16,
UO12 Binary Output,UO12 Binary Output,Enum,0-1 (default 0),binaryOutput,presentValue,TRUE,102,16,
Smart Recovery Status,Smart Recovery Status,Enum,0-1 (default 0),binaryValue,presentValue,TRUE,40,16,
Frost Protection Alarm,FrostProtectionAlarm,Enum,0-1 (default 0),binaryValue,presentValue,TRUE,43,16,
Effective Occupancy,EffectiveOccupancy,State,State count: 4,multiStateInput,presentValue,TRUE,33,16,"1=Unoccupied, 2=Override, 3=Standby"
Effective temperature sensor,Effective temperature sensor,State,State count: 23,multiStateInput,presentValue,TRUE,309,16,"1=Internal, 2=WL IO, 3=WL 1, 4=WL 2, 5=WL 3, 6=WL 4, 7=WL 5, 8=WL 6, 9=WL 7, 10=WL 8, 11=WL 9, 12=WL 10, 13=WL 11, 14=WL 12, 15=WL 13, 16=WL 14, 17=WL 15, 18=WL 16, 19=WL 17, 20=WL 18, 21=WL 19, 22=WL 20"
Effective System Mode,EffectiveSystemMode,State,State count: 2,multiStateInput,presentValue,TRUE,314,16,1=Heat
Time source,TimeSource,State,State count: 5,multiStateInput,presentValue,TRUE,325,16,"1=Local, 2=BACnet, 3=NTP, 4=Cloud"
Fan Speed Status,FanSpeedStatus,State,State count: 4,multiStateInput,presentValue,TRUE,326,16,"1=Low, 2=Med, 3=High"
Occupancy Command,OccupancyCommand,State,State count: 3 (default 2),multiStateValue,presentValue,TRUE,10,16,"1=Occupied, 2=Unocc."
Fan Delay,FanDelay,State,State count: 2 (default 2),multiStateValue,presentValue,TRUE,12,16,1=On
System Mode,SystemMode,State,State count: 4 (default 4),multiStateValue,presentValue,TRUE,16,16,"1=Auto, 2=Cool, 3=Heat"
Fan Mode,FanMode,State,State count: 3 (default 2),multiStateValue,presentValue,TRUE,17,16,"1=Auto, 2=Smart"
Frost Protection,FrostProtection,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,55,16,1=On
Setpoint Function,SetpointFunction,State,State count: 2 (default 2),multiStateValue,presentValue,TRUE,58,9,1=Attach SP
Enable Smart Recovery,EnableSmartRecovery,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,71,9,1=On
Economizer Configuration,HasEconomizer,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,72,9,1=On
Mechanical Cooling Allowed,MechanicalCoolingDuringEconomizing,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,79,9,1=On
BO1 Auxiliary Output Configuration,BO1 Auxiliary Output Configuration,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,92,9,1=NC
Fan Control in Heating Mode,FanControlHeatingMode,State,State count: 2 (default 2),multiStateValue,presentValue,TRUE,95,9,1=On
UO9 Configuration,UO9 Configuration,State,State count: 4 (default 4),multiStateValue,presentValue,TRUE,96,9,"1=Binary, 2=Relay RC, 3=Relay RH"
UO10 Configuration,UO10 Configuration,State,State count: 3 (default 1),multiStateValue,presentValue,TRUE,97,9,"1=Binary, 2=Relay RC"
UO11 Configuration,UO11 Configuration,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,98,9,1=Binary
UO12 Configuration,UO12 Configuration,State,State count: 2 (default 2),multiStateValue,presentValue,TRUE,99,9,1=Binary
Comfort or economy mode,Comfort or economy mode,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,116,9,1=Economy
Reversing valve operation,ReversingValveOperation,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,117,9,1=B
Compressor - auxiliary interlock,CompressorAuxiliaryInterlock,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,118,9,1=On
Application,Application,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,119,9,1=Heatpump"""

dent_meter_registry = \
"""Reference Point Name,Volttron Point Name,Units,Unit Details,BACnet Object Type,Property,Writable,Index,Write Priority,Notes
Current Avg Element A,Current,amperes,,analogInput,presentValue,FALSE,1141,,
Current CH1 A,CurrentA,amperes,,analogInput,presentValue,FALSE,1143,,
Current CH2 A,CurrentB,amperes,,analogInput,presentValue,FALSE,1145,,
Current CH3 A,CurrentC,amperes,,analogInput,presentValue,FALSE,1147,,
Voltage L to N Avg element A,VoltageN,volts,,analogInput,presentValue,FALSE,1149,,
Voltage L1 to N A,VoltageAN,volts,,analogInput,presentValue,FALSE,1151,,
Voltage L2 to N A,VoltageBN,volts,,analogInput,presentValue,FALSE,1153,,
Voltage L3 to N A,VoltageCN,volts,,analogInput,presentValue,FALSE,1155,,
AC Voltage L to L Avg Element A,VoltageLL,volts,,analogInput,presentValue,FALSE,1157,,
Voltage L1 to L2 A,VoltageAB,volts,,analogInput,presentValue,FALSE,1159,,
Voltage L2 to L3 A,VoltageBC,volts,,analogInput,presentValue,FALSE,1161,,
Voltage L3 to L1 A,VoltageCA,volts,,analogInput,presentValue,FALSE,1163,,
Line Frequency,Frequency,hertz,,analogInput,presentValue,FALSE,1165,,
Power Sum Element A,WholeBuildingPower,kilowatts,,analogInput,presentValue,FALSE,1167,,
Power CH1 A,PowerA,kilowatts,,analogInput,presentValue,FALSE,1169,,
Power CH2 A,PowerB,kilowatts,,analogInput,presentValue,FALSE,1171,,
Power CH3 A,PowerC,kilowatts,,analogInput,presentValue,FALSE,1173,,
VA Sum Element A,ApparentPower,kilovoltAmperes,,analogInput,presentValue,FALSE,1175,,
VA CH1 A,ApparentPowerA,kilovoltAmperes,,analogInput,presentValue,FALSE,1177,,
VA CH2 A,ApparentPowerB,kilovoltAmperes,,analogInput,presentValue,FALSE,1179,,
VA CH3 A,ApparentPowerC,kilovoltAmperes,,analogInput,presentValue,FALSE,1181,,
VAR Sum Element A,ReactivePower,kilovoltAmperesReactive,,analogInput,presentValue,FALSE,1183,,
VAR CH1 A,ReactivePowerA,kilovoltAmperesReactive,,analogInput,presentValue,FALSE,1185,,
VAR CH2 A,ReactivePowerB,kilovoltAmperesReactive,,analogInput,presentValue,FALSE,1187,,
VAR CH3 A,ReactivePowerC,kilovoltAmperesReactive,,analogInput,presentValue,FALSE,1189,,
Apparent PF Element A,PowerFactor,powerFactor,,analogInput,presentValue,FALSE,1191,,
Apparent PF CH1 A,PowerFactorA,powerFactor,,analogInput,presentValue,FALSE,1193,,
Apparent PF CH2 A,PowerFactorB,powerFactor,,analogInput,presentValue,FALSE,1195,,
Apparent PF CH3 A,PowerFactorC,powerFactor,,analogInput,presentValue,FALSE,1197,,
THD Element A,TotalHarmonicDistortion,percent,,analogInput,presentValue,FALSE,2324,,
THD CH1 A,TotalHarmonicDistortionA,percent,,analogInput,presentValue,FALSE,2326,,
THD CH2 A,TotalHarmonicDistortionB,percent,,analogInput,presentValue,FALSE,2328,,
THD CH3 A,TotalHarmonicDistortionC,percent,,analogInput,presentValue,FALSE,2330,,
Theta CH1 A,ThetaA,degreesAngular,,analogInput,presentValue,FALSE,2371,,
Theta CH2 A,ThetaB,degreesAngular,,analogInput,presentValue,FALSE,2373,,
Theta CH3 A,ThetaC,degreesAngular,,analogInput,presentValue,FALSE,2375,,
Theta Element A,Theta,degreesAngular,,analogInput,presentValue,FALSE,2391,,
Reset to User Defaults,Reset to User Defaults,Enum,0-1,binaryValue,presentValue,FALSE,2105,,
Service Type A,ServiceType,State,State count: 5,multiStateValue,presentValue,FALSE,2207,,"1=3-wire, 3-Phase, 2=2-wire, 1-Phase, 3=3-wire, 1-Phase, 4=Disable Element"""""


platform_driver_config = lambda timezone: {
    "timezone": timezone,
    "publish_multi_depth": False,
    "publish_all_depth": True
}

device_config_dict_template = lambda device_address, device_id, registry_file_name: {
    "driver_config": {
        "device_address": device_address,
        "device_id": device_id,
        "min_priority": 2
    },
    "interval": 60,
    "all_publish_interval": 60,
    "driver_type": "bacnet",
    "heart_beat_point": "HeartBeat",
    "registry_config": f"config://registry_configs/{registry_file_name}"
}


manager_config_store_dict_template = lambda campus, building, device_name, timezone: {
    "campus": campus,
    "building": building,
    "system": device_name,
    "system_status_point": "OccupancyCommand",
    "setpoint_control": 1,
    "local_tz": timezone,
    "default_setpoints": {
        "UnoccupiedHeatingSetPoint": 65,
        "UnoccupiedCoolingSetPoint": 78,
        "DeadBand": 3,
        "OccupiedSetPoint": 71
    },
    "setpoint_validate_frequency": 300,
    "zone_point_names": {
        "zonetemperature": "ZoneTemperature",
        "coolingsetpoint": "OccupiedCoolingSetPoint",
        "heatingsetpoint": "OccupiedHeatingSetPoint",
        "supplyfanstatus": "SupplyFanStatus",
        "outdoorairtemperature": "OutdoorAirTemperature",
        "heating": "FirstStageHeating",
        "cooling": "FirstStageCooling"
    },
    "optimal_start": {
        "earliest_start_time": 120,
        "latest_start_time": 10,
        "optimal_start_lockout_temperature": 30,
        "allowable_setpoint_deviation": 1
    },
    "schedule": {
        "Monday": {"start": "6:00", "end": "18:00"},
        "Tuesday": {"start": "6:00", "end": "18:00"},
        "Wednesday": {"start": "6:00", "end": "18:00"},
        "Thursday": {"start": "6:00", "end": "18:00"},
        "Friday": {"start": "6:00", "end": "18:00"},
        "Saturday": "always_off",
        "Sunday": "always_off"
    },
    "occupancy_values": {"occupied": 2, "unoccupied": 3}
}

bacnet_proxy_dict_template = lambda interface_ip_address: {
    "device_address": f"{interface_ip_address}/24",
    "object_id": 648
}


bacnet_interface_template = lambda interface_ip_address: {
    "local_interface": f"{interface_ip_address}/24",
    "device_id": 648,
    "time_synchronization_interval": 1440
}

historian_dict_template = lambda db_name, db_user, db_password, db_address, db_port: {
    "connection": {
        "type": "postgresql",
        "params": {
            "dbname": db_name,
            "host": db_address,
            "port": db_port,
            "user": db_user,
            "password": db_password
        }
    }
}

weather_dict_template = lambda station: {
    "database_file": "weather.sqlite",
    "max_size_gb": 1,
    "poll_locations": station,
    "poll_interval": 60
}
emailer_dict_template = lambda smtp_address, smtp_username, smtp_password, smtp_port, smtp_tls, to_addresses, allow_frequency_minutes: {
  "smtp-address": smtp_address,
  "smtp-username": smtp_username,
  "smtp-password": smtp_password,
  "smtp-port": smtp_port,
  "smtp-tls": True,
  "from-address": "no-reply@aems.pnl.gov",
  "to-addresses": to_addresses,
  "allow-frequency-minutes": allow_frequency_minutes
}

platform_config_dict_template = lambda devices_block, manager_agents_block, ilc_block: {
    "config": {
        "vip-address": "tcp://0.0.0.0:22916",
        "bind-web-address": "https://0.0.0.0:8443",
        "volttron-central-address": "https://0.0.0.0:8443",
        "instance-name": "volttron1",
        "message-bus": "zmq"
    },
    "web_users": {
        "username": "admin",
        "password": "admin",
        "groups": ["admin", "vui"]
    },
    "agents": {
        "listener": {"source": "$VOLTTRON_ROOT/examples/ListenerAgent", "tag": "listener"},

        "platform.driver": {
            "source": "/code/volttron-platform-driver",
            "tag": "driver",
            "config_store": {
                "registry_configs/schneider.csv": {
                    "file": "$CONFIG/configuration_store/platform.driver/registry_configs/schneider.csv",
                    "type": "--csv"
                },
                "registry_configs/schneider_oat.csv": {
                    "file": "$CONFIG/configuration_store/platform.driver/registry_configs/schneider_oat.csv",
                    "type": "--csv"
                },
                "registry_configs/dent.csv": {
                    "file": "$CONFIG/configuration_store/platform.driver/registry_configs/dent.csv",
                    "type": "--csv"
                },
                "interfaces/bacnet": {
                    "file": "$CONFIG/bacnet.config",
                },
                "config": {
                    "file": "$CONFIG/driver.config",
                },
                **devices_block
            }
        },
        **manager_agents_block,
        "platform.historian": {"source": "$VOLTTRON_ROOT/services/core/SQLHistorian",
                               "config": "$CONFIG/historian.config", "tag": "historian"},
        "platform.topic_watcher": {"source": "$VOLTTRON_ROOT/services/ops/TopicWatcher",
                                   "config": "$CONFIG/topic_watcher.config", "tag": "watcher"},
        "platform.weather": {"source": "$VOLTTRON_ROOT/services/core/WeatherDotGov",
                             "config": "$CONFIG/weather.config", "tag": "weather"},
        "platform.emailer": {"source": "$VOLTTRON_ROOT/services/ops/EmailerAgent",
                             "config": "$CONFIG/emailer.config", "tag": "emailer"},
        **ilc_block
    },
}

bacnet_proxy_agent_block = {
    "platform.bacnet_proxy": {"source": "$VOLTTRON_ROOT/services/core/BACnetProxy",
                              "config": "$CONFIG/bacnet_proxy.config", "priority": "10"},
    "platform.actuator": {"source": "$VOLTTRON_ROOT/services/core/ActuatorAgent", "tag": "actuator"},
}

def get_gateway_prefix(address: str) -> str:
    """
    Extracts the gateway prefix from the given IP address.

    The gateway prefix is the portion of the IP address excluding the last
    octet. This function splits the address by its dots and joins all but the
    last segment to generate the prefix.

    Args:
        address (str): The input IPv4 address in string format.

    Returns:
        str: The gateway prefix of the provided IP address.
    """
    return '.'.join(address.split('.')[:-1])


def generate_device_address(bacnet_network: str, device_index: int, offset: int = ADDRESS_OFFSET_DEFAULT) -> tuple[str, int]:
    """
    Generates a BACnet device address based on the provided network identifier, device index,
    and an optional offset value. Depending on the format of the BACnet network identifier,
    it creates either a fully qualified gateway-prefixed address or a concatenated network
    and formatted device index. The function is used to define the representation and
    routing address of a BACnet device in the network.

    Args:
        bacnet_network (str): The BACnet network identifier. Can be structured with a gateway
            component (e.g., '192.168.1.1') or a network number in a basic format.
        device_index (int): The numeric index of the device to generate an address for.
        offset (int, optional): The offset value added to the device index for the final
            address calculation. Default value is ADDRESS_OFFSET_DEFAULT.

    Returns:
        tuple[str, int]: A tuple containing the generated BACnet device address as a string
        and the formatted device index as an integer.
    """
    formatted_device_index = device_index + offset
    if '.' in bacnet_network:
        gateway_prefix = get_gateway_prefix(bacnet_network)
        device_number_str = str(device_index).zfill(2)
        full_device_address = f"{gateway_prefix}.1{device_number_str}"
    else:
        full_device_address = f"{bacnet_network}:{formatted_device_index}"
    return full_device_address, formatted_device_index


def generate_platform_config_manager_agent_block(num_configs: int, device_prefix: str, campus: str, building: str):
    """
    Generates a dictionary containing configuration information for platform config
    manager agents based on input parameters.

    This function constructs a dictionary where each key is a manager agent identifier
    and each value is a dictionary of configuration details like source, configuration
    file path, and a tag for a specified number of devices.

    Args:
        num_configs (int): The number of platform config manager agents to generate.
        device_prefix (str): A prefix used in the device name and VIP value.
        campus (str): The campus in which the devices are located.
        building (str): The building in which the devices are located.

    Returns:
        dict: A dictionary containing configuration details for platform config
        manager agents.
    """
    manager_agents = {}
    for config_num in range(1, num_configs + 1):
        device_name = f"{device_prefix}{str(config_num).zfill(2)}"
        device_vip = f"{device_prefix.lower()}{str(config_num).zfill(2)}"
        manager_agents[f"manager.{device_vip}"] = {
            "source": "$AEMS/aems-edge/Manager",
            "config": f"$CONFIG/configuration_store/manager.{device_name}/devices/{campus}/{building}/manager.{device_name}.config",
            "tag": device_name
        }
    return manager_agents

def generate_platform_config_driver_device_block(num_configs: int, prefix: str,
                                                 campus: str, building: str, meter_prefix: str):
    """
    Generates a dictionary representing the platform configuration driver device
    block.

    This function creates a configuration dictionary for devices based on the
    provided inputs. It iterates to produce device names with incremental
    indexing, appending prefixes and other supplied components.

    Args:
        num_configs (int): Number of devices to configure.
        prefix (str): Prefix for naming the devices.
        campus (str): Name of the campus where devices belong.
        building (str): Name of the building where devices are located.
        meter_prefix (str): Prefix for naming meter related devices.

    Returns:
        dict: A dictionary containing the generated device blocks.
    """
    devices_block = {}
    for i in range(1, num_configs + 1):
        device_name = f"{prefix}{str(i).zfill(2)}"
        devices_block.update(DEVICE_BLOCK_DICT(campus, building, device_name))
    devices_block.update(DEVICE_BLOCK_DICT(campus, building, meter_prefix))
    return devices_block

def generate_platform_config_bacnet_proxy(platform_config):
    """
    Updates the platform configuration dictionary to include the BACnet Proxy agent configuration
    and sets the source for the platform driver agent.

    This function modifies the given platform configuration dictionary by adding a predefined
    BACnet Proxy agent block to the agents section. Additionally, it updates the source path
    for the Platform Driver Agent within the dictionary.

    Args:
        platform_config (dict): A dictionary representing the platform configuration. It must
            contain the 'agents' key, which is expected to be a dictionary that can be updated
            with the BACnet Proxy agent configuration.

    Returns:
        dict: The updated platform configuration dictionary, including the BACnet Proxy agent
            block and updated source for the Platform Driver Agent.
    """
    platform_config['agents'].update(bacnet_proxy_agent_block)
    platform_config['agents']['platform.driver']['source'] = "$VOLTTRON_ROOT/services/core/PlatformDriverAgent"
    return platform_config


def generate_platform_config(num_configs: int, output_dir: str | bytes,
                             prefix: str, campus: str,
                             building, gateway_address: str,
                             bacnet_deployment: str,  meter_prefix, generate_ilc: bool):
    """
    Generates a platform configuration file based on the provided parameters.

    This function creates a platform configuration YAML file with several blocks
    such as manager agents, driver devices, and optionally an ILC block. Based on
    the bacnet deployment type, adjustments to the configuration are made. The
    final configuration is written to the specified output directory.

    Args:
        num_configs (int): Number of configurations to generate.
        output_dir (str | bytes): Directory where the platform configuration YAML
            file will be saved.
        prefix (str): Prefix to be used in the generated configuration.
        campus (str): Name of the campus in the configuration.
        building: Name of the building in the configuration.
        gateway_address (str): Address of the gateway to be used in the configuration.
        bacnet_deployment (str): Type of BACnet deployment to be used
            ('proxy' or other values).
        meter_prefix: Prefix for the meters in the configuration.
        generate_ilc (bool): Flag to indicate whether ILC block should be generated.

    """
    manager_agents_block = generate_platform_config_manager_agent_block(num_configs, prefix, campus, building)
    devices_block = generate_platform_config_driver_device_block(num_configs, prefix, campus, building, meter_prefix)
    ilc_block = {"agent.ilc": {"source": "$ILC", "tag": "ilc"}} if generate_ilc else {}
    platform_config = platform_config_dict_template(devices_block, manager_agents_block, ilc_block)
    if bacnet_deployment == 'proxy':
        platform_config = generate_platform_config_bacnet_proxy(platform_config)
    with open(os.path.join(output_dir, 'platform_config.yml'), 'w') as f:
        yaml.dump(platform_config, f, sort_keys=False)


def generate_device_config(config_num: int, prefix: str, gateway_address: str,
                           campus: str, building: str, output_dir: str | bytes, registry_file_name: str = 'schneider.csv'):
    """
    Generates a device configuration file based on the provided parameters. The function creates
    a configuration dictionary for a device using the specified parameters and saves it as a
    JSON file to the appropriate directory structure under the output directory. If the directory
    structure does not exist, it is created automatically.

    Args:
        config_num (int): Configuration number for the device.
        prefix (str): Prefix for the device configuration file name.
        gateway_address (str): Address of the gateway associated with the device.
        campus (str): Campus identifier for the device.
        building (str): Building identifier for the device.
        output_dir (str | bytes): Base directory to store the generated configuration files.
        registry_file_name (str): Name of the registry file to include in the device configuration.
            Defaults to 'schneider.csv'.

    """
    device_address, device_id = generate_device_address(gateway_address, config_num)
    device_config = device_config_dict_template(device_address, device_id, registry_file_name)
    device_config_dir = Path(output_dir, 'platform.driver', 'devices', campus, building)
    device_config_dir.mkdir(parents=True, exist_ok=True)
    device_file_path = device_config_dir / f"{prefix}{str(config_num).zfill(2)}"
    with open(device_file_path, 'w') as f:
        json.dump(device_config, f, indent=4)


def generate_meter_config(device_address: str, device_id: int, prefix: str,
                        campus: str, building: str, output_dir: str | bytes,
                        registry_file_name: str = 'dent.csv'):
    """
    Generates and saves the configuration for a meter device.

    This function creates a device configuration file for a specified meter device
    using provided parameters. The configuration is saved in a directory that
    is automatically created if it does not already exist. The generated configuration
    excludes the "heart_beat_point" field.

    Args:
        device_address: The address of the device.
        device_id: The unique identifier for the device.
        prefix: The name prefix for the generated configuration file.
        campus: The name of the campus where the device is located.
        building: The name of the building where the device is located.
        output_dir: The root output directory where the configuration files will be saved.
        registry_file_name: The name of the registry file to be used. Defaults to
            'dent.csv'.
    """
    device_config = device_config_dict_template(device_address, device_id, registry_file_name)
    device_config.pop("heart_beat_point")
    device_config_dir = Path(output_dir, 'platform.driver', 'devices', campus, building)
    device_config_dir.mkdir(parents=True, exist_ok=True)
    device_file_path = device_config_dir / prefix
    with open(device_file_path, 'w') as f:
        json.dump(device_config, f, indent=4)


def handle_registry_csv(output_dir: str | bytes, registry_file_path: str, registry_content: str, file_name: str):
    """
    Handles the creation and management of a registry CSV file in a specified output
    directory. The method ensures the appropriate directories are created, checks if
    the file already exists to avoid overwriting, and either copies an existing file
    or writes provided content to a new file.

    Args:
        output_dir: A string or bytes object representing the base output directory
            where the registry configurations directory will be created.
        registry_file_path: A string representing the file path of an existing
            registry file to copy. If None, registry_content will be written to a
            new file instead.
        registry_content: A string containing the registry content to write into a
            new file if registry_file_path is None.
        file_name: A string representing the name of the registry CSV file to be
            created or copied.
    """
    registry_config_dir = Path(output_dir, 'platform.driver', 'registry_configs')
    registry_config_dir.mkdir(parents=True, exist_ok=True)
    csv_output_path = registry_config_dir / file_name
    if csv_output_path.exists():
        return
    if registry_file_path:
        shutil.copy(registry_file_path, csv_output_path)
    else:
        with open(csv_output_path, 'w', newline='') as outfile:
            outfile.write(registry_content)


def generate_platform_driver_configs(num_configs: int, output_dir: str | bytes,
                                     registry_file_path: str, prefix: str, meter_prefix: str,
                                     campus: str, building: str, bacnet_network: str,
                                     gateway_address: str, rtu_oat_sensor: int, meter_ip: bool):
    """
    Generates platform driver configuration files and handles registry CSV files based on the inputs provided.

    This function generates configuration files for platform drivers for the specified
    number of devices and also handles registry files to ensure the mappings for various
    devices are updated accordingly. It creates device and meter configurations, as well
    as registers them to the specified output directory.

    Args:
        num_configs (int): The number of device configurations to generate.
        output_dir (str | bytes): The directory where the generated configurations
            will be stored.
        registry_file_path (str): The file path for the registry that needs to
            be updated.
        prefix (str): The prefix to be used in the configuration for devices.
        meter_prefix (str): The prefix for meter device configurations.
        campus (str): The campus name to associate with the devices.
        building (str): The building name to associate with the devices.
        bacnet_network (str): The BacNet network identifier for the devices.
        gateway_address (str): The address of the gateway used for the BacNet
            communication.
        rtu_oat_sensor (int): The RTU OAT sensor's specific configuration index in
            the range of devices.
        meter_ip (bool): Indicates whether the meter is addressed via an IP address.
    """
    for config_num in range(1, num_configs + 1):
        registry_file_name = SCHNEIDER_OAT_CSV_NAME if config_num == rtu_oat_sensor else SCHNEIDER_CSV_NAME
        generate_device_config(config_num, prefix, bacnet_network, campus, building, output_dir, registry_file_name)
    device_id = 100
    if meter_ip:
        gateway_prefix = get_gateway_prefix(gateway_address)
        device_address = f"{gateway_prefix}.100"
    else:
        device_address =  f"{bacnet_network}:100"
    generate_meter_config(device_address, device_id, meter_prefix, campus, building, output_dir, "dent.csv")
    handle_registry_csv(output_dir, registry_file_path, schneider_registry, SCHNEIDER_CSV_NAME)
    handle_registry_csv(output_dir, registry_file_path, schneider_oat_registry, SCHNEIDER_OAT_CSV_NAME)
    handle_registry_csv(output_dir, registry_file_path, dent_meter_registry, DENT_CSV_NAME)


def generate_manager_config(config_num: int, prefix: str, campus: str, building: str,
                            output_dir: str | bytes, timezone: str, rtu_oat_sensor: int = 0) -> None:
    """
    Generates a manager configuration file for a specified device.

    This function creates a manager configuration dictionary for a device using its
    campus, building, and device name. It stores this configuration file in a
    directory structure that mirrors the device's specification. If the configuration
    number corresponds to an outdoor air temperature sensor, an additional topic
    related to the outdoor temperature will be added to the configuration.

    Args:
        config_num: The unique configuration number used to generate the device name.
        prefix: A string used as a prefix in the device name generation.
        campus: The campus identifier where the device is located.
        building: The building identifier where the device is located.
        output_dir: The root directory where the manager configuration file will
            be stored.
        timezone: The timezone identifier to be used in the device's configuration.
        rtu_oat_sensor: The configuration number of the outdoor air temperature
            sensor, used to include the related topic in the configuration. Defaults
            to 0.

    """
    device_name = f"{prefix}{str(config_num).zfill(2)}"
    manager_config = manager_config_store_dict_template(campus, building, device_name, timezone)
    if config_num != rtu_oat_sensor:
        manager_config['outdoor_temperature_topic'] = f"devices/{campus}/{building}/rtu{str(rtu_oat_sensor).zfill(2)}/all"
    manager_config_dir = Path(output_dir, 'configuration_store', f'manager.{device_name}', 'devices', campus, building)
    manager_config_dir.mkdir(parents=True, exist_ok=True)
    manager_config_file = manager_config_dir / f"{MANAGER_CONFIG_FILENAME_TEMPLATE.format(device_name=device_name)}"
    with open(manager_config_file, 'w') as _file:
        json.dump(manager_config, _file, indent=4)


def generate_topic_watcher_config(num_configs: int, prefix: str, campus: str,
                                  building: str, meter_prefix: str, output_dir: str | bytes) -> None:
    """
    Generates a topic watcher configuration file based on specified parameters.

    This function creates a configuration dictionary for devices and a meter group
    with corresponding MQTT topics and timeout values. It outputs the configuration
    to a specified file in the given directory.

    Args:
        num_configs (int): The number of device configurations to generate.
        prefix (str): The prefix for device names.
        campus (str): The campus name included in the topic structure.
        building (str): The building name included in the topic structure.
        meter_prefix (str): The prefix for the meter group topic.
        output_dir (str | bytes): The directory where the configuration file will
            be saved.

    Raises:
        OSError: If there is an issue with file creation or writing.
    """
    topic_watcher_config = {}
    for config_num in range(1, num_configs + 1):
        device_name = f"{prefix}{str(config_num).zfill(2)}"
        topic_key = "_".join([device_name, "group"])
        topic_watcher_config[topic_key] = {f"devices/{campus}/{building}/{device_name}": 600}
    topic_watcher_config["meter_group"] = {f"devices/{campus}/{building}/{meter_prefix}": 600}
    topic_watcher_output_dir = Path(output_dir)
    with open(topic_watcher_output_dir / 'topic_watcher.config', 'w') as _file:
        json.dump(topic_watcher_config, _file, indent=4)


def generate_bacnet_proxy_config(gateway_address: str, output_dir: str | bytes):
    """
    Generates BACnet proxy configuration files based on the provided gateway address
    and output directory. The function attempts to identify a matching network
    interface on the system for the provided gateway address. If a matching address
    is not found, it defaults to using the gateway address directly.

    The generated configuration files are written to the specified output directory.

    Args:
        gateway_address: A string representing the gateway address in IPv4 format.
            This is used to identify the appropriate network interface.
        output_dir: A string or bytes type specifying the output directory path where
            the configuration files will be created. The path must already exist.

    Raises:
        ValueError: If the provided gateway address format is invalid.
    """
    interface_ip_address = None
    try:
        gateway_network = ipaddress.ip_network(gateway_address + '/24', strict=False)
    except ValueError:
        raise ValueError('Invalid gateway-address format!')

    interfaces = ni.interfaces()
    for interface in interfaces:
        try:
            addr_info = ni.ifaddresses(interface).get(ni.AF_INET)
            if addr_info:
                ip_address_str = addr_info[0]['addr']
                ip_address_obj = ipaddress.ip_address(ip_address_str)
                if ip_address_obj in gateway_network:
                    interface_ip_address = ip_address_str
                    break
        except (KeyError, IndexError):
            continue

    if interface_ip_address is None:
        sys.stderr.write("WARNING: Could not find a matching IP address for the gateway. "
                         "Falling back to using the gateway address directly. "
                         "This may not work in all environments.\n")
        interface_ip_address = gateway_address
    proxy_config = bacnet_proxy_dict_template(interface_ip_address)
    interface_config = bacnet_interface_template(interface_ip_address)
    bacnet_output_dir = Path(output_dir)
    with open(bacnet_output_dir / 'bacnet_proxy.config', 'w') as _file:
        json.dump(proxy_config, _file, indent=4)
    with open(bacnet_output_dir / 'bacnet.config', 'w') as _file:
        json.dump(interface_config, _file, indent=4)


def generate_historian_config(db_name: str, db_user: str, db_password: str,
                              db_address: str, db_port: int, output_dir: str | bytes):
    """
    Generates a historian configuration file based on specified database connection
    details and saves it to the provided output directory.

    This function creates a configuration dictionary using the provided database
    connection parameters, prepares the output directory, and writes the configuration
    to a JSON file named 'historian.config' in the specified directory.

    Args:
        db_name: Name of the database to connect to.
        db_user: Username for the database connection.
        db_password: Password for the database connection.
        db_address: Address of the database host.
        db_port: Port number to connect to the database.
        output_dir: Directory in which the 'historian.config' file is created and saved.

    """
    historian_config = historian_dict_template(db_name, db_user, db_password, db_address, db_port)
    historian_config_dir = Path(output_dir)
    historian_config_dir.mkdir(parents=True, exist_ok=True)
    with open(historian_config_dir / 'historian.config', 'w') as _file:
        json.dump(historian_config, _file, indent=4)


def generate_driver_config(timezone: str, output_dir: str | bytes):
    """
    Generates and saves a platform driver configuration file based on the provided
    timezone and output directory. The configuration is written to a JSON file named
    'driver.config' in the specified output directory. If the directory does not exist,
    it will be created.

    Args:
        timezone: The timezone to be used for generating the driver configuration.
        output_dir: The directory where the configuration file will be saved. It can
            be a string or bytes representing the file path.
    """
    driver_config = platform_driver_config(timezone)
    driver_config_dir = Path(output_dir)
    driver_config_dir.mkdir(parents=True, exist_ok=True)
    with open(driver_config_dir / 'driver.config', 'w') as _file:
        json.dump(driver_config, _file, indent=4)


def generate_emailer_config(smtp_address: str, smtp_username: str, smtp_password: str,
                            smtp_port: int, smtp_tls: bool, to_addresses: str,
                            allow_frequency_minutes: int, output_dir: str | bytes):
    """
    Generate an emailer configuration file based on the provided parameters.

    This function generates a configuration for an emailer in the JSON format, using
    the input parameters such as SMTP details, recipient addresses, frequency of
    email notifications, and output directory. It writes the configuration file
    named `emailer.config` to the specified output directory.

    Args:
        smtp_address (str): Address of the SMTP server.
        smtp_username (str): Username for the SMTP server authentication.
        smtp_password (str): Password for the SMTP server authentication.
        smtp_port (int): Port of the SMTP server.
        smtp_tls (bool): Indicates whether TLS is required for the SMTP server.
        to_addresses (str): Comma-separated list of recipient email addresses.
        allow_frequency_minutes (int): Minimum time interval in minutes to allow
            between consecutive email notifications.
        output_dir (str | bytes): Directory path where the configuration file will
            be created.

    """
    emailer_config = emailer_dict_template(smtp_address, smtp_username, smtp_password,
                                           smtp_port, smtp_tls, to_addresses, allow_frequency_minutes)
    emailer_config_dir = Path(output_dir)
    with open(emailer_config_dir / 'emailer.config', 'w') as _file:
        json.dump(emailer_config, _file, indent=4)


def generate_weather_config(station: list, output_dir: str):
    """
    Generates a weather configuration file based on the provided station list and
    saves it to the specified output directory.

    This function takes a list of weather station information, transforms it into
    a weather configuration dictionary using a predefined template, and writes it
    to a `weather.config` file in the given directory. The directory is created
    if it does not exist.

    Args:
        station (list): A list of weather station data to be used for generating
            the weather configuration.
        output_dir (str): The directory where the weather configuration file will
            be saved. The directory is created if it does not exist.
    """
    weather_config = weather_dict_template(station)
    weather_config_dir = Path(output_dir)
    weather_config_dir.mkdir(parents=True, exist_ok=True)
    with open(weather_config_dir / 'weather.config', 'w') as _file:
        json.dump(weather_config, _file, indent=4)


def main():
    """
    Main function to parse command-line arguments and generate configuration files.

    This function uses the `configargparse` library to parse command-line arguments and generate
    various configurations required for platform deployment. It handles input validation, creates
    necessary directories, and executes multiple configuration generation procedures.

    Args:
        --num-configs (int): Number of device configurations to generate (default: 2).
        --output-dir (str): Directory where configurations will be output, required.
        --config-subdir (str): Subdirectory for configuration files (default: '').
        --prefix (str): Prefix for device configurations (default: 'RTU').
        --meter-prefix (str): Prefix for meter configurations (default: 'METER').
        --campus (str): Campus name, required.
        --building (str): Building name, required.
        --gateway-address (str): Gateway address, required.
        --bacnet-address (str): BACnet address (default: None).
        --timezone (str): Timezone configuration (default: 'UTC').
        --registry-file-path (str): Path to the registry file (default: None).
        --rtu-oat-sensor (int): RTU OAT sensor configuration (default: 1).
        --generate_ilc (bool): Flag to enable generating ILC configurations (default: False).
        --db-name (str): Database name for historian service (default: 'volttron').
        --db-user (str): Database user for historian service (default: 'volttron').
        --db-password (str): Database password for historian service (default: 'volttron').
        --db-address (str): Database host address (default: 'localhost').
        --db-port (int): Database port (default: 5432).
        --weather-station (str): Weather station name (default: '').
        --smtp-address (str): SMTP server address (default: '').
        --smtp-username (str): SMTP server username (default: '').
        --smtp-password (str): SMTP server password (default: '').
        --smtp-port (int): SMTP server port (default: 587).
        --smtp-tls (bool): Whether to use TLS for SMTP server (default: True).
        --from-address (str): From address for email notifications (default: 'no-reply@aems.pnl.gov').
        --to-addresses (list[str]): List of email addresses for notifications (default: []).
        --allow-frequency-minutes (int): Minimum minutes interval to allow frequency alerts (default: 60).
        --meter-ip (bool): Enable/disable configurations for meter IP (default: True).
        --bacnet (str): Deployment type for BACnet driver ('driver' or 'proxy', default: 'driver').

    Raises:
        SystemExit: If invalid arguments are provided or required arguments are missing.

    """
    parser = configargparse.ArgParser(default_config_files=['config.ini'])
    parser.add('--num-configs', type=int, default=2, help='Number of devices')
    parser.add('--output-dir', type=str, required=True, help='Directory to output configs')
    parser.add('--config-subdir', help='Subdirectory for config files', default='')
    parser.add('--prefix', type=str, default='RTU', help='Device prefix')
    parser.add('--meter-prefix', type=str, default='METER', help='Meter prefix') ## ADD
    parser.add('--campus', type=str, required=True)
    parser.add('--building', type=str, required=True)
    parser.add('--gateway-address', type=str, required=True)
    parser.add('--bacnet-address', help='bacnet address', default=None)
    parser.add('--timezone', type=str, default='UTC')
    parser.add('--registry-file-path', type=str, default=None)
    parser.add('--rtu-oat-sensor', type=int, default=1)
    parser.add('--generate_ilc', type=bool, default=True)
    parser.add('--db-name', type=str, default='volttron')
    parser.add('--db-user', type=str, default='volttron')
    parser.add('--db-password', type=str, default='volttron')
    parser.add('--db-address', type=str, default='localhost')
    parser.add('--db-port', type=int, default=5432)
    parser.add('--weather-station', type=str, default='')
    parser.add('--smtp-address', type=str, default='') ## ADD
    parser.add('--smtp-username', type=str, default='') ## ADD
    parser.add('--smtp-password', type=str, default='') ## ADD
    parser.add('--smtp-port', type=int, default=587)
    parser.add('--smtp-tls', type=bool, default=True)
    parser.add('--from-address', type=str, default='no-reply@aems.pnl.gov')
    parser.add('--to-addresses', action='append', help='A list of notify email addresses.', default=[]) ## ADD
    parser.add('--allow-frequency-minutes', type=int, default=60)
    parser.add('--meter-ip', type=bool, default=True)
    parser.add('--bacnet', type=str, default='driver')

    args = parser.parse_args()

    output_path = os.path.join(args.output_dir, args.config_subdir)
    config_store_path = os.path.join(output_path, "configuration_store")

    # Remove existing configs directory
    if os.path.exists(output_path):
        shutil.rmtree(output_path)
    os.makedirs(output_path, exist_ok=True)
    os.makedirs(config_store_path, exist_ok=True)


    bacnet_network = args.bacnet_address if args.bacnet_address is not None else args.gateway_address
    bacnet_deployment = args.bacnet if args.bacnet in ["driver", "proxy"] else "driver"
    # Generate device configs
    generate_platform_driver_configs(
        num_configs=args.num_configs,
        output_dir=config_store_path,
        registry_file_path=args.registry_file_path,
        prefix=args.prefix,
        meter_prefix=args.meter_prefix,
        campus=args.campus,
        building=args.building,
        bacnet_network=bacnet_network,
        gateway_address=args.gateway_address,
        rtu_oat_sensor=args.rtu_oat_sensor,
        meter_ip=args.meter_ip
    )

    # Generate manager configs
    for config_num in range(1, args.num_configs + 1):
        generate_manager_config(config_num, args.prefix, args.campus, args.building,
                                output_path, args.timezone, args.rtu_oat_sensor)

    # Generate canonical "config" for platform.driver
    generate_driver_config(args.timezone, output_path)
    # Generate BACnet proxy config
    generate_bacnet_proxy_config(args.gateway_address, output_path)
    generate_bacnet_proxy_config(args.gateway_address, output_path)
    # Generate historian config
    generate_historian_config(args.db_name, args.db_user, args.db_password,
                              args.db_address, args.db_port, output_path)

    # Generate weather config
    weather_station = [args.weather_station] if args.weather_station else []
    generate_weather_config(weather_station, output_path)

    # Generate topic watcher config
    generate_topic_watcher_config(args.num_configs, args.prefix, args.campus, args.building, args.meter_prefix, output_path)

    # Generate emailer config
    generate_emailer_config(args.smtp_address, args.smtp_username, args.smtp_password,
                            args.smtp_port, args.smtp_tls, args.to_addresses,
                            args.allow_frequency_minutes, output_path)

    # Generate platform config (with optional ILC agent)
    generate_platform_config(args.num_configs, output_path, args.prefix,
                             args.campus, args.building, args.gateway_address,
                             bacnet_deployment, args.meter_prefix, generate_ilc=args.generate_ilc)

    shutil.copy('docker-compose-aems.yml', os.path.join(output_path, 'docker-compose-aems.yml'))
    shutil.copy('docker-compose-ilc.yml', os.path.join(output_path, 'docker-compose-ilc.yml'))


if __name__ == "__main__":
    main()
