import argparse
import json
import subprocess

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def execute(cmd: str | list[str], write_to=None):
    """
    Executes a command in the shell and prints the output.

    Args:
        cmd (str | list[str]): The command to execute. If a string, it will be
        split into a list of arguments.

    Raises:
        subprocess.CalledProcessError: If the command returns a non-zero
        exit code.

    """
    if isinstance(cmd, str):
        cmd = cmd.split(' ')

    with subprocess.Popen(cmd, stdout=subprocess.PIPE,
                          universal_newlines=True) as p:
        for line in iter(p.stdout.readline, ''):
            if line.strip():
                write_to.write(f'{line.strip()}\n')

    p.wait()
    if p.returncode:
        raise subprocess.CalledProcessError(p.returncode, cmd=' '.join(cmd))


__auth__ = None


def make_request(*, method: str, payload: dict,
                 agent: str = 'manager.schneider'):
    global __auth__
    if not __auth__:
        resp = requests.post('https://130.20.24.164:8443/authenticate',
                             data={'username': 'admin', 'password': 'admin'},
                             verify=False)
        __auth__ = resp.json()['access_token']

    rpc_payload = {
        'jsonrpc': '2.0',
        'id': agent,
        'method': method,
        'params': {
            'authentication': __auth__,
            'data': payload
        }
    }
    print('x' * 80)
    print(method)

    resp = requests.post('https://130.20.24.164:8443/gs',
                         json=rpc_payload, verify=False)
    return resp.status_code, resp.text


def check_results(*, payload, response_text, agent: str, get_method: str):
    try:
        resp_obj = json.loads(response_text)
    except json.JSONDecodeError:
        print(f"Couldn't decode response: {response_text}")
        raise

    with open('temp.json', 'w') as buf:
        execute(f'vctl config get {agent} {get_method}', buf)

    with open('temp.json', 'r') as buf:
        config_obj = json.loads(buf.read())

    print(f'Payload:\n{json.dumps(payload, indent=4)}')
    print(f'Response:\n{json.dumps(resp_obj, indent=4)}')
    print(f'Config Store:\n{json.dumps(config_obj, indent=4)}\n')


agent = 'manager.schneider'


def set_temperature_setpoints():
    config_store_entry = 'set_points'

    payload = {'UnoccupiedHeatingSetPoint': 50, 'UnoccupiedCoolingSetPoint': 78,
            'DeadBand': 3, 'OccupiedSetPoint': 71}
    code, text = make_request(method='set_temperature_setpoints',
                              payload=payload)
    check_results(payload=payload, response_text=text,
                  agent=agent, get_method=config_store_entry)


def set_schedule():
    payload = {
        'Monday': {
            'start': '6:30',
            'end': '18:00'
        },
        'Tuesday': {
            'start': '6:30',
            'end': '18:00'
        },
        'Wednesday': 'always_off',
        'Thursday': {
            'start': '6:30',
            'end': '18:00'
        },
        'Friday': 'always_off',
        'Saturday': 'always_off',
        'Sunday': 'always_off'
    }
    config_store_entry = 'schedule'
    code, text = make_request(method='set_schedule',
                              payload=payload)
    check_results(payload=payload, response_text=text,
                  agent=agent, get_method=config_store_entry)


def set_occupancy_override():
    payload = {
        '2024-01-10': [{'start': '15:20', 'end': '15:50'}]
    }
    payload = {}
    config_store_entry = 'occupancy_overrides'
    code, text = make_request(method='set_occupancy_override',
                              payload=payload)
    check_results(payload=payload, response_text=text,
                  agent=agent, get_method=config_store_entry)


def set_holidays():
    payload = {
        'Memorial Day': {},
        'Independence Day': {},
        'Labor Day': {},
        'Thanksgiving': {},
        'Black Friday': {},
        'Christmas Eve': {},
        'Christmas': {},
        'Presidents Day': {},
        'test 22': {
            'month': 12,
            'day': 22,
            'observance': ''
        },
        'test 23': {
            'month': 12,
            'day': 23,
            'observance': ''
        }
    }
    config_store_entry = 'holidays'
    code, text = make_request(method='set_holidays',
                              payload=payload)
    check_results(payload=payload, response_text=text,
                  agent=agent, get_method=config_store_entry)


def set_optimal_start():
    payload = {
        'latest_start_time': 10,
        'earliest_start_time': 95,
        'allowable_setpoint_deviation': 1,
        'optimal_start_lockout_temperature': 26,
        'training_period_window': 10
    }
    config_store_entry = 'optimal_start'
    code, text = make_request(method='set_optimal_start',
                              payload=payload)
    check_results(payload=payload, response_text=text,
                  agent=agent, get_method=config_store_entry)


def set_configuration():
    payload = {
        'cooling_lockout_temp': 40,
        'heating_lockout_temp': 200,
        'economizer_setpoint': 60,
        'is_heatpump': 1,
        'has_economizer': 1
    }
    config_store_entry = 'control'
    code, text = make_request(method='set_configurations',
                              payload=payload)
    check_results(payload=payload, response_text=text,
                  agent=agent, get_method=config_store_entry)


# Create an argument parser
parser = argparse.ArgumentParser(description='Run specific functions')
parser.add_argument('--agent', required=False, type=str,
                    default='manager.schneider',
                    help='Specify which agent to run against')
parser.add_argument('--function', required=False, type=str,
                    choices=['set_temperature_setpoints',
                             'set_schedule',
                             'set_holidays',
                             'set_optimal_start',
                             'set_configuration',
                             'set_occupancy_override'],
                    help='Specify which function to run')

args = parser.parse_args()
agent = args.agent

# Call the specified function
if args.function == 'set_temperature_setpoints':
    set_temperature_setpoints()
elif args.function == 'set_schedule':
    set_schedule()
elif args.function == 'set_holidays':
    set_holidays()
elif args.function == 'set_optimal_start':
    set_optimal_start()
elif args.function == 'set_configuration':
    set_configuration()
elif args.function == 'set_occupancy_override':
    set_occupancy_override()
else:
    set_temperature_setpoints()
    set_schedule()
    set_holidays()
    set_optimal_start()
    set_configuration()
    set_occupancy_override()
