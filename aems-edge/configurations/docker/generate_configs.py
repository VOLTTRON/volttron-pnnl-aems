#import parseargs
import os
import sys
import shutil
import argparse as ArgumentParser
from pathlib import Path
import io
import csv
import configargparse


schneider_registry = """
Reference Point Name,Volttron Point Name,Units,Unit Details,BACnet Object Type,Property,Writable,Index,Write Priority,Notes
Effective Setpoint,EffectiveZoneTemperatureSetPoint,degreesFahrenheit,,analogInput,presentValue,TRUE,329,16,
PI Heating Demand,HeatingDemand,percent,(default 100.0),analogOutput,presentValue,TRUE,21,16,
PI Cooling Demand,CoolingDemand,percent,(default 0.0),analogOutput,presentValue,TRUE,22,16,
Economizer Demand,EconomizerDemand,percent,(default 0.0),analogOutput,presentValue,TRUE,23,16,
Analog Output Heat Demand,ModulatingHeatingDemand,percent,(default 0.0),analogOutput,presentValue,TRUE,24,16,
UO11 Analog Output,UO11 Analog Output,volts,(default 0.0),analogOutput,presentValue,TRUE,123,16,
UO12 Analog Output,UO12 Analog Output,volts,(default 0.0),analogOutput,presentValue,TRUE,124,16,
UO9 Analog Output,UO9 Analog Output,volts,(default 0.0),analogOutput,presentValue,TRUE,125,16,
UO10 Analog Output,EconomizerVoltageOutput,volts,(default 0.0),analogOutput,presentValue,TRUE,126,16,
DR Flag,DemandResponseFlag,enum,,analogValue,presentValue,TRUE,29,8,
HeartBeat,HeartBeat,enum,,analogValue,presentValue,TRUE,30,8,
Occupied Heat Setpoint,OccupiedHeatingSetPoint,degreesFahrenheit,(default 72.0),analogValue,presentValue,TRUE,39,16,
Occupied Cool Setpoint,OccupiedCoolingSetPoint,degreesFahrenheit,(default 75.0),analogValue,presentValue,TRUE,40,16,
Unoccupied Heat Setpoint,UnoccupiedHeatingSetPoint,degreesFahrenheit,(default 62.0),analogValue,presentValue,TRUE,43,16,
Unoccupied Cool Setpoint,UnoccupiedCoolingSetPoint,degreesFahrenheit,(default 80.0),analogValue,presentValue,TRUE,44,16,
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
UI23 Temperature,OutdoorAirTemperature,degreesFahrenheit,(default -40.0),analogValue,presentValue,TRUE,122,16,
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
Application,Application,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,119,9,1=Heatpump
"""

# TODO: Add a configuration file
config_file = 'config.ini'

# TODO: Device ID should be the device number without padding
device_config_template = '''{{
  "driver_config": {{
    "device_address": "{device_address}",
    "device_id": {device_id},
    "min_priority": 2
  }},
  "interval": 60,
  "driver_type": "bacnet",
  "heart_beat_point": "HeartBeat",
  "registry_config": "config://registry_configs/schneider.csv"
}}'''

manager_config_store_template = """{{
    "campus": "{campus}",
    "building": "{building}",
    "system": "{device_name}",
    "system_status_point": "OccupancyCommand",
    "setpoint_control": 1,
    "local_tz": "{timezone}",
    "default_setpoints": {{"UnoccupiedHeatingSetPoint": 65, "UnoccupiedCoolingSetPoint": 78, "DeadBand": 3, "OccupiedSetPoint": 71}},
    "setpoint_validate_frequency": 300,
    "zone_point_names": {{ "zonetemperature": "ZoneTemperature",
        "coolingsetpoint": "OccupiedCoolingSetPoint",
        "heatingsetpoint": "OccupiedHeatingSetPoint",
        "supplyfanstatus": "SupplyFanStatus",
        "outdoorairtemperature": "OutdoorAirTemperature",
        "heating": "FirstStageHeating",
        "cooling": "FirstStageCooling"
    }},
    "optimal_start": {{
        "earliest_start_time": 120,
        "latest_start_time": 10,
        "optimal_start_lockout_temperature": 30,
        "allowable_setpoint_deviation": 1
    }},
    "schedule": {{
        "Monday": {{
            "start": "6:00",
            "end": "18:00"
        }},
        "Tuesday": {{
            "start": "6:00",
            "end": "18:00"
        }},
        "Wednesday": {{
            "start": "6:00",
            "end": "18:00"
        }},
        "Thursday": {{
            "start": "6:00",
            "end": "18:00"
        }},
        "Friday": {{
            "start": "6:00",
            "end": "18:00"
        }},
        "Saturday": "always_off",
        "Sunday": "always_off"
    }},
    "occupancy_values": {{
        "occupied": 2,
        "unoccupied": 3
    }}
}} """

bacnet_proxy_config_template = """{{
    device_address: {gateway_prefix}.162/24,
    object_id: 648
}}"""

platform_config_template = """ # Properties to be added to the root config file
# the properties should be ingestible for volttron
# the values will be presented in the config file
# as key=value
config:
  vip-address: tcp://0.0.0.0:22916
  # For rabbitmq this should match the hostname specified in
  # in the docker compose file hostname field for the service.
  bind-web-address: https://0.0.0.0:8443
  volttron-central-address: https://0.0.0.0:8443
  instance-name: volttron1
  message-bus: zmq # allowed values: zmq, rmq
  # volttron-central-serverkey: a different key

# Agents dictionary to install. The key must be a valid
# identity for the agent to be installed correctly.
agents:

  # Each agent identity.config file should be in the configs
  # directory and will be used to install the agent.
  listener:
    source: $VOLTTRON_ROOT/examples/ListenerAgent
    config: $CONFIG/listener.config
    tag: listener

  platform.bacnet_proxy:
    source: $VOLTTRON_ROOT/services/core/BACnetProxy
    config: $CONFIG/bacnet.proxy.config
    priority: "10"

  platform.driver:
    source: $VOLTTRON_ROOT/services/core/PlatformDriverAgent
    config_store:
      registry_configs/schneider.csv:
        file: $CONFIG/configuration_store/platform.driver/registry_configs/schneider.csv
        type: --csv
{devices_block}
    tag: driver

  # TLDR: If you want to install a Volttron Central Platform agent, you must first install the
  # Platform Driver before installing VCP agent
  # Additional: VolttronCentralPlatform requires Bacpypes, which gets installed only when Platform Driver is installed.
  # This is an unfortunate and not ideal setup, however, this issue will be addresed in a later PR so that VCP Agent
  # can be installed on its own without having to install Platform Driver first.
#   platform.agent:
#     source: $VOLTTRON_ROOT/services/core/VolttronCentralPlatform
#     config: $CONFIG/vcp.config
#     tag: vcp
# 
#   platform.actuator:
#     source: $VOLTTRON_ROOT/services/core/ActuatorAgent
#     tag: actuator

  platform.historian:
    source: $VOLTTRON_ROOT/services/core/SQLHistorian
    config: $CONFIG/historian.config
    tag: historian

{manager_agents_block}

#  volttron.central:
#    source: $VOLTTRON_ROOT/services/core/VolttronCentral
#    config: $CONFIG/vc.config
#    tag: vc

#  weather:
#    source: $VOLTTRON_ROOT/examples/DataPublisher
#    config: $CONFIG/weather.config

#  price:
#    source: $VOLTTRON_ROOT/examples/DataPublisher
#    config: $CONFIG/price.config
"""

def generate_device_address(gateway_address, n):
    """
    Generates a unique device address based on the provided gateway address and a device number. The function
    parses the gateway address, determines its format, and appends a properly formatted identifier for the
    device, ensuring compliance with expected conventions for either IPv4-style or alternative address formats.

    The method ensures consistency by zero-padding the device number when using a dotted address style.

    Args:
        gateway_address: The base address of the gateway, either in IPv4 style (e.g., '192.168.1.1') or in
            an alternative format.
        n: An integer representing the device identifier, which is used to generate the device id.

    Returns:
        tuple: A tuple containing:
            - address: A string representing the full device address created based on the input parameters.
            - device_number: An integer reflecting the input device number, potentially formatted differently
                within the device address.
    """
    device_number = n
    if '.' in gateway_address:
        gateway_prefix = '.'.join(gateway_address.split('.')[:-1])
        device_number = str(n).zfill(2)
        device_address = f"{gateway_prefix}.1{device_number}"
    else:
        device_address = f"{gateway_address}:{device_number}"
    return device_address, device_number


def generate_platform_config_manager_agent_block(num_configs, prefix, campus, building):
    manager_agent_block_template = '''  manager.{device_name}:
    source: $AEMS/aems-edge/Manager
    config: $CONFIG/configuration_store/manager.{device_name}/devices/{campus}/{building}/manager.{device_name}.config
    tag: {device_name}
'''

    manager_agent_section_block = ''
    for config_num in range(1,num_configs+1):
        config_num_expanded = str(config_num).zfill(2)
        device_name = '{}{}'.format(prefix, config_num_expanded)
        manager_agent_block = manager_agent_block_template.format(device_name=device_name, campus=campus, building=building)
        manager_agent_section_block += manager_agent_block

    return manager_agent_section_block

def generate_platform_config_platform_driver_devices_block(num_configs, prefix, campus, building):
    platform_driver_devices_block_template = '''      devices/{campus}/{building}/{device_name}:
        file: $CONFIG/configuration_store/platform.driver/devices/{campus}/{building}/{device_name}
'''

    platform_driver_devices_section_block = ''
    for config_num in range(1,num_configs+1):
        config_num_expanded = str(config_num).zfill(2)
        device_name = '{}{}'.format(prefix, config_num_expanded)
        platform_driver_devices_block = platform_driver_devices_block_template.format(device_name=device_name, campus=campus, building=building)
        platform_driver_devices_section_block += platform_driver_devices_block

    return platform_driver_devices_section_block

def generate_platform_config(num_configs, output_dir, prefix, campus, building, gateway_address):
    '''This function generates the platform config that lists out all the agents and where their configs are located'''
    manager_agent_block = generate_platform_config_manager_agent_block(num_configs, prefix, campus, building)
    platform_driver_devices_block = generate_platform_config_platform_driver_devices_block(num_configs, prefix, campus, building)

    platform_config = platform_config_template.format(devices_block=platform_driver_devices_block, manager_agents_block=manager_agent_block)

    with open(os.path.join(output_dir, 'platform_config.yml'), 'w') as f:
        f.write(platform_config)
    
def generate_platform_driver_configs(num_configs, output_dir, registry_file_path, prefix, campus, building, gateway_address):
    # TODO: should split this into two parts. First, generate the platform driver config, second,
    # copy the driver csv file to the correct location.
    # The configs will go into devices/campus/building and be named <prefix><device_number>
    # The csv files will go into registry_configs and be named
    # <building>-<prefix><device_number>.csv
    # The config needs to be updated with the correct csv file name in the registry_config field.
    # For now, we will just copy the csv file and call it schneider.csv since all the devices for
    # this first iteration are going to use the same csv file.


    for config_num in range(1,num_configs+1):
        device_address, device_id = generate_device_address(gateway_address, config_num)
        config_num_expanded = str(config_num).zfill(2)
        device_config = device_config_template.format(device_number=config_num_expanded, device_id=device_id, device_address=device_address)
        filename = '{}{}'.format(prefix, config_num_expanded)

        file_path = Path(os.path.join(output_dir,'platform.driver', 'devices', campus, building))
        file_path.mkdir(parents=True, exist_ok=True)

        with open(os.path.join(str(file_path), filename), 'w') as f:
            f.write(device_config)

        registry_config_path = Path(os.path.join(output_dir, 'platform.driver', 'registry_configs'))
        if os.path.exists(f'{registry_config_path}/schneider.csv'):
            print('Registry file already exists!')
            continue
        registry_config_path.mkdir(parents=True, exist_ok=True)

        # Now copy the csv file to the correct location
        if registry_file_path:
            print(f'Registry path: {registry_file_path}')
            shutil.copy(registry_file_path, str(registry_config_path))
        else:
            with io.StringIO(schneider_registry) as csvfile:
                csv_reader = csv.reader(csvfile)
                _path = f'{registry_config_path}/schneider.csv'
                with open(_path, 'w', newline='') as outfile:
                    csv_writer = csv.writer(outfile)
                    for row in csv_reader:
                        csv_writer.writerow(row)

def generate_manager_configs(num_configs, output_dir, prefix, campus, building, timezone):
    for config_num in range(1,num_configs+1):
        config_num_expanded = str(config_num).zfill(2)
        device_name = '{}{}'.format(prefix, config_num_expanded)
        device_config = manager_config_store_template.format(campus=campus, building = building, timezone=timezone, device_name=device_name)
        filename = 'manager.{}.config'.format(device_name)

        file_path = Path(os.path.join(output_dir,'manager.{}{}'.format(prefix, config_num_expanded),  'devices', campus, building))
        file_path.mkdir(parents=True, exist_ok=True)

        with open(os.path.join(str(file_path), filename), 'w') as f:
            f.write(device_config)

def generate_bacnet_proxy_config(output_dir, building, gateway_address):
    gateway_prefix = '.'.join(gateway_address.split('.')[:-1])
    bacnet_proxy_config = bacnet_proxy_config_template.format(building=building, gateway_prefix=gateway_prefix)

    with open(os.path.join(output_dir, 'bacnet.proxy.config'), 'w') as f:
        f.write(bacnet_proxy_config)

if __name__ == "__main__":
    # Identfiy arguments to be parsed
    parser = configargparse.ArgParser(default_config_files=['./config.ini'],description='Generate config files for the simulation')
    parser.add('-n', '--num-configs', type=int, help='Number of config files to generate')
    parser.add('--output-dir', help='Output directory for config files')
    parser.add('--config-subdir', help='Subdirectory for config files', default='configs')
    parser.add('--campus', help='Campus name')
    parser.add('--building', help='Building name')
    parser.add('--prefix', help='Device prefix', default='rtu')
    parser.add('--bacnet-address', help='bacnet address', default=None)
    parser.add('--registry-file-path', help='registry file path', default="")
    parser.add('-g', '--gateway-address', help='Gateway address', default='192.168.0.1')
    parser.add('-t', '--timezone', help='Timezone', default='America/Los_Angeles')

    args = parser.parse_args()

    #print(args)
    #print(parser.format_values())
    shutil.rmtree('configs')
    device_address = args.bacnet_address if args.bacnet_address is not None else args.gateway_address
    generate_platform_driver_configs(args.num_configs, args.output_dir + '/' + args.config_subdir + "/configuration_store", args.registry_file_path, args.prefix, args.campus, args.building, device_address)
    generate_manager_configs(args.num_configs, args.output_dir + '/' + args.config_subdir + "/configuration_store", args.prefix, args.campus, args.building, args.timezone)
    generate_bacnet_proxy_config(args.output_dir + '/' + args.config_subdir, args.building, args.gateway_address)
    generate_platform_config(args.num_configs, args.output_dir, args.prefix, args.campus, args.building, args.gateway_address)
