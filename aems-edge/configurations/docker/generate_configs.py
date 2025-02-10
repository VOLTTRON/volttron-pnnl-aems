#import parseargs
import os
import sys
import shutil
import argparse as ArgumentParser
from pathlib import Path
import configargparse


# TODO: Add a configuration file
config_file = 'config.ini'

# TODO: Device ID should be the device number without padding
device_config_template = '''{{
  "driver_config": {{
    "device_address": "{gateway_prefix}.1{device_number}",
    "device_id": "{device_id}"
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
    object_id: 648,
    vip_identity: platform.bacnet_proxy_{building}
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
    
def generate_platform_driver_configs(num_configs, output_dir, prefix, campus, building, gateway_address):
    # TODO: should split this into two parts. First, generate the platform driver config, second,
    # copy the driver csv file to the correct location.
    # The configs will go into devices/campus/building and be named <prefix><device_number>
    # The csv files will go into registry_configs and be namded
    # <building>-<prefix><device_number>.csv
    # The config needs to be updated with the correct csv file name in the registry_config field.
    # For now, we will just copy the csv file and call it schneider.csv since all the devices for
    # this first iteration are going to use the same csv file.


    for config_num in range(1,num_configs+1):
        config_num_expanded = str(config_num).zfill(2)
        gateway_prefix = '.'.join(gateway_address.split('.')[:-1])
        device_config = device_config_template.format(device_number=config_num_expanded, device_id=config_num, gateway_prefix=gateway_prefix)
        filename = '{}{}'.format(prefix, config_num_expanded)

        file_path = Path(os.path.join(output_dir,'platform.driver', 'devices', campus, building))
        file_path.mkdir(parents=True, exist_ok=True)

        with open(os.path.join(str(file_path), filename), 'w') as f:
            f.write(device_config)

        registry_config_path = Path(os.path.join(output_dir, 'platform.driver', 'registry_configs'))
        registry_config_path.mkdir(parents=True, exist_ok=True)

        # Now copy the csv file to the correct location
        csv_file = 'schneider.csv'
        shutil.copy(csv_file, str(registry_config_path))

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
    parser.add('-g', '--gateway-address', help='Gateway address', default='192.168.0.1')
    parser.add('-t', '--timezone', help='Timezone', default='America/Los_Angeles')

    args = parser.parse_args()

    #print(args)
    #print(parser.format_values())

    generate_platform_driver_configs(args.num_configs, args.output_dir + '/' + args.config_subdir + "/configuration_store", args.prefix, args.campus, args.building, args.gateway_address)
    generate_manager_configs(args.num_configs, args.output_dir + '/' + args.config_subdir + "/configuration_store", args.prefix, args.campus, args.building, args.timezone)
    generate_bacnet_proxy_config(args.output_dir + '/' + args.config_subdir, args.building, args.gateway_address)
    generate_platform_config(args.num_configs, args.output_dir, args.prefix, args.campus, args.building, args.gateway_address)
