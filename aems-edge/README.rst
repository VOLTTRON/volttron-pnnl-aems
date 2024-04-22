============================================
Autonomous Energy Management Software (AEMS)
============================================

The AEMS adds intelligent and flexible control for small and medium
sized commercial buildings' HVAC systems. The AEMS enables energy efficiency measures
for thermostatically controlled packaged air conditioners and heat pumps. The
AEMS contains a web based user interface (aems-ui) to allow a building operator or occupants
to easily enable energy efficiency and comfort for their building. The second component is the
aems-edge. The edge software is integrated with the VOLTTRON project and utilizes the BACnet driver
for device integration, the VOLTTRON Historian for data storage, and the VOLTTRON integrated
Weather.gov for forecast information.


Featured Energy Efficiency Measures
-----------------------------------

1. **Occupied and Unoccupied set points**

    Minimum dead bands between occupied cooling and heating set points.  Minimum unoccupied set back
    temperature set points.

2. **7-day scchedule.**

    Monday - Sunday occupancy schedule


3. **Optimal start to minimize morning startup and ensure occupant comfort.**

    Multi-method optimal start.


4. **Temporary occupancy overrides for weekends and after hour occupancy.**

    Conditions individual spaces during weekends or after hours rather than entire building.


5. **Holiday and custom holidays.**

     All US holidays are easily enabled or disabled for observance.  Custom holidays for other holidays.


6. **Heating and cooling lockouts based on outdoor-air temperature**

    Lock out mechanical heating and cooling when conditions permit to save energy.


7. **Economizer control based on outdoor dry bulb temperature.**

    Control economizer system based on outdoor-air temperature.


Running Agent
-------------

The agent is an installed Volttron agent. Sample command line for creating the agent

.. code-block:: python

   vctl install --vip-identity manager.<name> --force --start <path to AEMS repository>/aems-edge/Manger



Configuration Options
---------------------

The following JSON configuration file shows all the options currently supported
by this agent. A sample configuration is included with the agent

.. code-block:: python

    {
        "campus": "PNNL",
        "building": "BUILDING1",
        "system": "SCHNEIDER",
        "system_status_point": "OccupancyCommand",
        "setpoint_control": 1,
        "local_tz": "US/Pacific",
        "default_setpoints": {"UnoccupiedHeatingSetPoint": 65, "UnoccupiedCoolingSetPoint": 78, "DeadBand": 3, "OccupiedSetPoint": 71},
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
            "Monday": {
                "start": "6:00",
                "end": "18:00"
            },
            "Tuesday": {
                "start": "6:00",
                "end": "18:00"
            },
            "Wednesday": {
                "start": "6:00",
                "end": "18:00"
            },
            "Thursday": {
                "start": "6:00",
                "end": "18:00"
            },
            "Friday": {
                "start": "6:00",
                "end": "18:00"
            },
            "Saturday": "always_off",
            "Sunday": "always_off"
        },
        "occupancy_values": {
            "occupied": 2,
            "unoccupied": 3
        }
    }



1. Added pre-commit-config hooks
2. Yapf formatting for code (see: https://github.com/google/yapf#knobs for customizations)
 a. Run using yapf -r --in-place --style .yapf.format.txt .

Using pre-commit
1. Install pip install pre-commit
2. Run pre-commit install (sets up pre-commit hooks to run with the changes.)

