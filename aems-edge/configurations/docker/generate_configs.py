import os
import sys
import shutil
from pathlib import Path
import io
import csv
import configargparse

ADDRESS_OFFSET_DEFAULT = 2
SCHNEIDER_CSV_NAME = 'schneider.csv'
MANAGER_CONFIG_FILENAME_TEMPLATE = "manager.{device_name}.config"
DEVICE_BLOCK_TEMPLATE = '''      devices/{campus}/{building}/{device_name}:
        file: $CONFIG/configuration_store/platform.driver/devices/{campus}/{building}/{device_name}
'''



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
Application,Application,State,State count: 2 (default 1),multiStateValue,presentValue,TRUE,119,9,1=Heatpump"""

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
    device_address: "{gateway_prefix}.4/24",
    object_id: 648
}}"""

historian_config_template = """{
    "connection": {
        "type": "postgresql",
        "params": {
            "dbname": "volttron",
            "host": "127.0.0.1",
            "port": 5432,
            "user": "volttron",
            "password": "volttron"
        }
    }
}"""

weather_config_template = """{{
     "database_file": "weather.sqlite",
     "max_size_gb": 1,
     "poll_locations": [{station}],
     "poll_interval": 60
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
    tag: listener

  platform.bacnet_proxy:
    source: $VOLTTRON_ROOT/services/core/BACnetProxy
    config: $CONFIG/bacnet.proxy.config
    priority: "10"

  platform.driver:
    source: $VOLTTRON_ROOT/services/core/PlatformDriverAgent
    tag: driver
    config_store:
      registry_configs/schneider.csv:
        file: $CONFIG/configuration_store/platform.driver/registry_configs/schneider.csv
        type: --csv
{devices_block}
  platform.actuator:
    source: $VOLTTRON_ROOT/services/core/ActuatorAgent
    tag: actuator

  platform.historian:
    source: $VOLTTRON_ROOT/services/core/SQLHistorian
    config: $CONFIG/historian.config
    tag: historian

{manager_agents_block}
  weather:
    source: $VOLTTRON_ROOT/services/core/WeatherDotGov
    config: $CONFIG/weather.config
    tag: weather
"""


def get_gateway_prefix(address: str) -> str:
    """Extract the prefix from an IPv4 address (everything except the last segment)."""
    return '.'.join(address.split('.')[:-1])


def generate_device_address(gateway_address: str, device_index: int, offset: int = ADDRESS_OFFSET_DEFAULT) -> tuple[str, int]:
    """
    Generate a unique device address based on a gateway address and device index.

    Args:
        gateway_address (str): Base address of the gateway, in IPv4 style (e.g., '192.168.1.1') or another format.
        device_index (int): Integer representing the device identifier.
        offset (int): Optional offset added to the device index to generate the final address. Default is 2.

    Returns:
        Tuple[str, int]: (Full device address, formatted device number or identifier)
    """
    def _format_device_number(index: int, ipv4: bool = True) -> str:
        """Format the device index for inclusion in an address."""
        return str(index).zfill(2) if ipv4 else str(index)

    formatted_device_index = device_index + offset
    if '.' in gateway_address:  # IPv4-style address
        gateway_prefix = get_gateway_prefix(gateway_address)
        device_number_str = _format_device_number(device_index)
        full_device_address = f"{gateway_prefix}.1{device_number_str}"
    else:  # Alternative address style
        full_device_address = f"{gateway_address}:{formatted_device_index}"

    return full_device_address, formatted_device_index


def generate_platform_config_manager_agent_block(num_configs: int, device_prefix: str, campus: str, building: str) -> str:
    """
    Generates a block of configuration for manager agents.

    Args:
        num_configs: The number of configurations to generate.
        device_prefix: The prefix for the device names.
        campus: The campus where the devices are located.
        building: The building where the devices are located.

    Returns:
        A string containing the configuration block for the manager agents.
    """

    manager_agent_block_template = """\
  manager.{device_vip}:
    source: $AEMS/aems-edge/Manager
    config: $CONFIG/configuration_store/manager.{device_name}/devices/{campus}/{building}/manager.{device_name}.config
    tag: {device_name}
"""

    manager_agent_section_block = ""
    for config_num in range(1, num_configs + 1):
        device_name = f"{device_prefix}{str(config_num).zfill(2)}"
        device_vip = f"{device_prefix.lower()}{str(config_num).zfill(2)}"
        manager_agent_block = manager_agent_block_template.format(
            device_vip=device_vip, device_name=device_name, campus=campus, building=building
        )
        manager_agent_section_block += manager_agent_block

    return manager_agent_section_block


def generate_platform_config_driver_device_block(num_configs: int, prefix: str, campus: str, building: str) -> str:
    """Generate a platform driver configuration block for devices.

    This function creates a configuration block for a specified number of devices.
    Each device block is generated using a template and includes information about
    its name, campus, and building.

    Args:
        num_configs: The number of device configurations to generate.
        prefix: The prefix to use for naming the devices.
        campus: The campus where the devices are located.
        building: The building where the devices are located.

    Returns:
        A string containing the concatenated configuration blocks for all devices.
    """

    def _generate_device_block(device_name: str, campus: str, building: str) -> str:
        """Generate a single device block for the platform driver."""
        return DEVICE_BLOCK_TEMPLATE.format(device_name=device_name, campus=campus, building=building)

    devices = [
        _generate_device_block(f"{prefix}{str(i).zfill(2)}", campus, building)
        for i in range(1, num_configs + 1)
    ]
    return ''.join(devices)


def generate_platform_config(num_configs: int, output_dir: str, prefix, campus, building, gateway_address):
    """
    Generates a platform configuration file for a specified number of configurations, including
    blocks for manager agents and driver devices. The generated configuration file is saved in
    a specified output directory.

    The configuration file is constructed by formatting a template with provided information
    about the campus, building, and gateway address, under a designated prefix for naming.

    Args:
        num_configs (int): Number of configurations to generate.
        output_dir (str): Directory path where the configuration file will be saved.
        prefix: Prefix to use for generated configuration names.
        campus: Name of the campus for which the configuration is generated.
        building: Name of the building for which the configuration is generated.
        gateway_address: Gateway address for the platform configuration.

    """
    manager_agent_block = generate_platform_config_manager_agent_block(num_configs, prefix, campus, building)
    platform_driver_devices_block = generate_platform_config_driver_device_block(num_configs, prefix, campus, building)

    platform_config = platform_config_template.format(devices_block=platform_driver_devices_block, manager_agents_block=manager_agent_block)

    with open(os.path.join(output_dir, 'platform_config.yml'), 'w') as f:
        f.write(platform_config)


def generate_device_config(config_num: int, prefix: str, gateway_address: str,
                           campus: str, building: str, output_dir: str):
    """
    Generates device configuration file based on provided parameters and writes
    it to the specified directory. The configuration file includes the device
    number, device ID, and device address, derived from the given inputs, and is
    stored in a directory structure based on campus and building names.

    Args:
        config_num (int): The configuration number for the device. Used to generate
            the device number and ID.
        prefix (str): The file name prefix for the configuration file.
        gateway_address (str): The gateway IP address from which to generate the
            device address.
        campus (str): The campus name for the configuration file directory
            structure.
        building (str): The building name for the configuration file directory
            structure.
        output_dir (str): The base output directory where the configuration file
            will be stored.

    """
    device_address, device_id = generate_device_address(gateway_address, config_num)
    device_number = str(config_num).zfill(2)
    device_config = device_config_template.format(device_number=device_number,
                                                  device_id=device_id,
                                                  device_address=device_address)
    device_config_dir = Path(os.path.join(output_dir, 'platform.driver', 'devices', campus, building))
    device_config_dir.mkdir(parents=True, exist_ok=True)

    device_filename = f"{prefix}{device_number}"
    device_file_path = device_config_dir / device_filename
    with open(device_file_path, 'w') as config_file:
        config_file.write(device_config)


def handle_registry_csv(output_dir: str, registry_file_path: str, registry_content: str):
    """
    Handles the creation or copying of a Schneider registry CSV file into a designated
    directory. If a path to an existing registry CSV file is provided, it is copied to
    the target directory. Otherwise, a new registry CSV file is generated using provided
    content. The operation is skipped if the output file already exists.

    Args:
        output_dir (str): The base directory where the registry configuration folder
            and CSV file will be written.
        registry_file_path (str): The path to an existing registry CSV file to copy
            into the target directory. If None, a new CSV file will be created using
            the registry_content.
        registry_content (str): The CSV-formatted string content used to generate a
            new registry file if `registry_file_path` is not provided.
    """
    registry_config_dir = Path(os.path.join(output_dir, 'platform.driver', 'registry_configs'))
    registry_config_dir.mkdir(parents=True, exist_ok=True)

    # Skip if the target registry CSV already exists
    csv_output_path = registry_config_dir / SCHNEIDER_CSV_NAME
    if csv_output_path.exists():
        return

    if registry_file_path:
        # Copy provided registry file to the target path
        shutil.copy(registry_file_path, str(csv_output_path))
    else:
        # Generate the registry CSV file from `registry_content`
        with io.StringIO(registry_content) as csvfile:
            csv_reader = csv.reader(csvfile)
            with open(csv_output_path, 'w', newline='') as outfile:
                csv_writer = csv.writer(outfile)
                csv_writer.writerows(csv_reader)


def generate_platform_driver_configs(num_configs: int, output_dir: str, registry_file_path: str,
                                     prefix: str, campus: str, building: str, gateway_address: str):
    """
    Generate platform driver configuration files and handle the registry CSV file.

    This function creates platform driver configuration files for each device based
    on the specified number of configurations, directory structure, and other
    metadata. Additionally, it handles the registry CSV file operations.

    Args:
        num_configs (int): The number of platform driver configuration files to be
            generated.
        output_dir (str): The directory where the configuration files will be
            stored.
        registry_file_path (str): The path to the registry CSV file that contains
            metadata for devices.
        prefix (str): A prefix to use for configuration file-related identifiers.
        campus (str): The campus associated with the devices for directory
            structuring or configuration.
        building (str): The building within the campus where the devices are
            located.
        gateway_address (str): The address of the gateway used for device
            communication.

    """
    # Generate platform driver configs for each device
    for config_num in range(1, num_configs + 1):
        generate_device_config(config_num, prefix, gateway_address, campus, building, output_dir)

    # Handle the registry CSV file
    handle_registry_csv(output_dir, registry_file_path, schneider_registry)


def generate_manager_configs(num_configs: int, output_dir: str, prefix: str, campus: str, building: str, timezone: str):
    """
    Generates manager configuration files and organizes them into structured directories.

    This function creates a series of configuration files based on a specified template,
    organizing them in directories that are named according to the given parameters. The
    number of configurations, destination output directory, prefixes, and location specifics
    like campus, building, and timezone influence the resulting directory structure and
    file contents.

    Each configuration file is stored in a directory using the following convention:
    "output_dir/manager.prefixXX/devices/campus/building/configuration_file", where 'XX'
    is the configuration number, zero-padded. The function ensures the necessary directory
    structure exists before creating files.

    Args:
        num_configs: The number of configuration files to generate.
        output_dir: The base directory in which all configurations and subdirectories are created.
        prefix: A naming prefix to be included in the configuration file or directory names.
        campus: The campus identification for the directory structure and file contents.
        building: The building identification for the directory structure and file contents.
        timezone: The timezone to include in the configuration file template.
    """
    def create_output_directory(output_dir: str, prefix: str, config_num: int, campus: str, building: str):
        device_directory = Path(
            os.path.join(output_dir, f"manager.{prefix}{str(config_num).zfill(2)}", "devices", campus, building)
        )
        device_directory.mkdir(parents=True, exist_ok=True)
        return device_directory

    for config_num in range(1, num_configs + 1):
        device_name = f"{prefix}{str(config_num).zfill(2)}"
        device_config = manager_config_store_template.format(
            campus=campus, building=building, timezone=timezone, device_name=device_name
        )
        directory = create_output_directory(output_dir, prefix, config_num, campus, building)
        filename = MANAGER_CONFIG_FILENAME_TEMPLATE.format(device_name=device_name)
        with open(directory / filename, 'w') as f:
            f.write(device_config)


def generate_bacnet_proxy_config(output_dir: str, building: str, gateway_address: str):
    """
    Generates and writes a BACnet proxy configuration file for a specific building and gateway address.

    This function retrieves the gateway prefix based on the provided gateway address and uses that
    along with the building name to create a BACnet proxy configuration file. The resulting
    configuration is saved in the specified output directory as 'bacnet.proxy.config'.

    Args:
        output_dir: The directory path where the configuration file will be written.
        building: The name of the building for which the configuration is being generated.
        gateway_address: The network address of the gateway used to derive the prefix.
    """
    gateway_prefix = get_gateway_prefix(gateway_address)
    bacnet_proxy_config = bacnet_proxy_config_template.format(building=building, gateway_prefix=gateway_prefix)
    with open(os.path.join(output_dir, 'bacnet.proxy.config'), 'w') as f:
        f.write(bacnet_proxy_config)


def generate_historian_config(output_dir: str, config_content: str=historian_config_template):
    """Writes the historian configuration to a file.

    Args:
        output_dir: The directory where the file should be written.
        config_content: The content to write to the historian config file.
    """
    historian_config_path = os.path.join(output_dir, 'historian.config')
    with open(historian_config_path, 'w') as f:
        f.write(config_content)


def generate_weather_config(output_dir: str, station: str):
    """
    Generates the weather station configuration file.

    Args:
        output_dir: The directory to save the configuration file.
        station: The name of the weather station.  If empty, the station field will be omitted.
    """
    print(f'Configure weather station: {station}')
    station_config = f'"station": "{station}"' if station else ''
    weather_config = weather_config_template.format(station=station_config)
    weather_config_file_path = os.path.join(output_dir, 'weather.config')
    with open(weather_config_file_path, 'w') as f:
        f.write(weather_config)


def main():
    # Argument parsing
    parser = configargparse.ArgParser(default_config_files=['./config.ini'],
                                      description='Generate config files for the simulation')
    parser.add('-n', '--num-configs', type=int, help='Number of config files to generate', required=True)
    parser.add('--output-dir', help='Output directory for config files', required=True)
    parser.add('--config-subdir', help='Subdirectory for config files', default='configs')
    parser.add('--campus', help='Campus name', required=True)
    parser.add('--building', help='Building name', required=True)
    parser.add('--prefix', help='Device prefix', default='rtu')
    parser.add('--bacnet-address', help='bacnet address', default=None)
    parser.add('--registry-file-path', help='registry file path', default="")
    parser.add('--weather-station', help='weather station', default="")
    parser.add('-g', '--gateway-address', help='Gateway address', default='192.168.0.1')
    parser.add('-t', '--timezone', help='Timezone', default='America/Los_Angeles')
    args = parser.parse_args()

    output_path = os.path.join(args.output_dir, args.config_subdir)
    config_store_path = os.path.join(output_path, "configuration_store")

    # Remove existing configs directory
    if os.path.exists(output_path):
        shutil.rmtree(output_path)
    os.makedirs(output_path, exist_ok=True)
    os.makedirs(config_store_path, exist_ok=True)

    device_address = args.bacnet_address if args.bacnet_address is not None else args.gateway_address

    # Generate configurations
    generate_platform_driver_configs(args.num_configs, config_store_path, args.registry_file_path, args.prefix,
                                     args.campus, args.building, device_address)
    generate_manager_configs(args.num_configs, config_store_path, args.prefix,
                             args.campus, args.building, args.timezone)
    generate_bacnet_proxy_config(output_path, args.building, args.gateway_address)
    generate_historian_config(output_path)
    generate_weather_config(output_path, args.weather_station)
    generate_platform_config(args.num_configs, output_path, args.prefix,
                             args.campus, args.building, args.gateway_address)

    # Copy docker-compose file
    shutil.copy('docker-compose-aems.yml', os.path.join(output_path, 'docker-compose-aems.yml'))


if __name__ == "__main__":
    main()

