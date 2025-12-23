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
        "platform.emailer": {"source": "$VOLTTRON_ROOT/services/core/ops/EmailerAgent",
                             "config": "$CONFIG/emailer.config", "tag": "emailer"}
    },
    "ilc": ilc_block
}

bacnet_proxy_agent_block = {
    "platform.bacnet_proxy": {"source": "$VOLTTRON_ROOT/services/core/BACnetProxy",
                              "config": "$CONFIG/bacnet_proxy.config", "priority": "10"},
    "platform.actuator": {"source": "$VOLTTRON_ROOT/services/core/ActuatorAgent", "tag": "actuator"},
}

def get_gateway_prefix(address: str) -> str:
    return '.'.join(address.split('.')[:-1])


def generate_device_address(bacnet_network: str, device_index: int, offset: int = ADDRESS_OFFSET_DEFAULT) -> tuple[str, int]:
    formatted_device_index = device_index + offset
    if '.' in bacnet_network:
        gateway_prefix = get_gateway_prefix(bacnet_network)
        device_number_str = str(device_index).zfill(2)
        full_device_address = f"{gateway_prefix}.1{device_number_str}"
    else:
        full_device_address = f"{bacnet_network}:{formatted_device_index}"
    return full_device_address, formatted_device_index


def generate_platform_config_manager_agent_block(num_configs: int, device_prefix: str, campus: str, building: str):
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
    devices_block = {}
    for i in range(1, num_configs + 1):
        device_name = f"{prefix}{str(i).zfill(2)}"
        devices_block.update(DEVICE_BLOCK_DICT(campus, building, device_name))
    devices_block.update(DEVICE_BLOCK_DICT(campus, building, meter_prefix))
    return devices_block

def generate_platform_config_bacnet_proxy(platform_config):
    platform_config['agents'].update(bacnet_proxy_agent_block)
    platform_config['agents']['platform.driver']['source'] = "$VOLTTRON_ROOT/services/core/PlatformDriverAgent"
    return platform_config


def generate_platform_config(num_configs: int, output_dir: str | bytes,
                             prefix: str, campus: str,
                             building, gateway_address: str,
                             bacnet_deployment: str,  meter_prefix, generate_ilc: bool):
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
    device_config = device_config_dict_template(device_address, device_id, registry_file_name)
    device_config.pop("heart_beat_point")
    device_config_dir = Path(output_dir, 'platform.driver', 'devices', campus, building)
    device_config_dir.mkdir(parents=True, exist_ok=True)
    device_file_path = device_config_dir / prefix
    with open(device_file_path, 'w') as f:
        json.dump(device_config, f, indent=4)


def handle_registry_csv(output_dir: str | bytes, registry_file_path: str, registry_content: str, file_name: str):
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
    interface_ip_address = None
    gateway_prefix = get_gateway_prefix(gateway_address)
    if not gateway_prefix:
        raise ValueError('gateway-address is not set!')
    interfaces = ni.interfaces()
    for interface in interfaces:
        try:
            ip_address = ni.ifaddresses(interface)[ni.AF_INET][0]['addr']
        except KeyError:
            continue
        if gateway_prefix in ip_address:
            interface_ip_address = ip_address
            break
    if interface_ip_address is None:
        raise ValueError('IP address is not found!  Verify gateway address')
    proxy_config = bacnet_proxy_dict_template(interface_ip_address)
    interface_config = bacnet_interface_template(interface_ip_address)
    bacnet_output_dir = Path(output_dir)
    with open(bacnet_output_dir / 'bacnet_proxy.config', 'w') as _file:
        json.dump(proxy_config, _file, indent=4)
    with open(bacnet_output_dir / 'bacnet.config', 'w') as _file:
        json.dump(interface_config, _file, indent=4)


def generate_historian_config(db_name: str, db_user: str, db_password: str,
                              db_address: str, db_port: int, output_dir: str | bytes):
    historian_config = historian_dict_template(db_name, db_user, db_password, db_address, db_port)
    historian_config_dir = Path(output_dir)
    historian_config_dir.mkdir(parents=True, exist_ok=True)
    with open(historian_config_dir / 'historian.config', 'w') as _file:
        json.dump(historian_config, _file, indent=4)


def generate_driver_config(timezone: str, output_dir: str | bytes):
    driver_config = platform_driver_config(timezone)
    driver_config_dir = Path(output_dir)
    driver_config_dir.mkdir(parents=True, exist_ok=True)
    with open(driver_config_dir / 'driver.config', 'w') as _file:
        json.dump(driver_config, _file, indent=4)


def generate_emailer_config(smtp_address: str, smtp_username: str, smtp_password: str,
                            smtp_port: int, smtp_tls: bool, to_addresses: str,
                            allow_frequency_minutes: int, output_dir: str | bytes):
    emailer_config = emailer_dict_template(smtp_address, smtp_username, smtp_password,
                                           smtp_port, smtp_tls, to_addresses, allow_frequency_minutes)
    emailer_config_dir = Path(output_dir)
    with open(emailer_config_dir / 'emailer.config', 'w') as _file:
        json.dump(emailer_config, _file, indent=4)


def generate_weather_config(station: list, output_dir: str):
    weather_config = weather_dict_template(station)
    weather_config_dir = Path(output_dir)
    weather_config_dir.mkdir(parents=True, exist_ok=True)
    with open(weather_config_dir / 'weather.config', 'w') as _file:
        json.dump(weather_config, _file, indent=4)


def main():
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
    parser.add('--generate_ilc', type=bool, default=False)
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
