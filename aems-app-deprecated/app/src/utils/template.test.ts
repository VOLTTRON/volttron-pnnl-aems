import { transformTemplate } from "@/utils/template";

const unit = {
  id: 1,
  stage: "Fail",
  message: "Failed authenticate call to https://localhost/authenticate: connect ECONNREFUSED 127.0.0.1:443",
  correlation: null,
  createdAt: "2023-08-30T18:41:18.023Z",
  updatedAt: "2023-08-30T18:41:20.875Z",
  name: "Pnnl-Rob-Schneider",
  campus: "PNNL",
  building: "ROB",
  system: "SCHNEIDER",
  timezone: "US/Pacific",
  label: "PNNL ROB SCHNEIDER",
  coolingCapacity: 3,
  compressors: 1,
  coolingLockout: 45,
  optimalStartLockout: 20,
  optimalStartDeviation: 0.5,
  earliestStart: 60,
  latestStart: 0,
  zoneLocation: "exterior",
  zoneMass: "medium",
  zoneOrientation: "north",
  zoneBuilding: "office",
  heatPump: true,
  heatPumpBackup: 1,
  economizer: true,
  heatPumpLockout: 30,
  setpointPeakOffset: 0.5,
  peakLoadExclude: false,
  economizerSetpoint: 45,
  configurationId: 1,
  controlId: 1,
  configuration: {
    id: 1,
    stage: "Create",
    message: null,
    correlation: null,
    createdAt: "2023-08-30T18:41:18.023Z",
    updatedAt: "2023-08-30T18:41:18.023Z",
    label: "PNNL ROB SCHNEIDER - Wednesday, August 30th 2023",
    setpointId: 1,
    mondayScheduleId: 8,
    tuesdayScheduleId: 7,
    wednesdayScheduleId: 6,
    thursdayScheduleId: 5,
    fridayScheduleId: 4,
    saturdayScheduleId: 3,
    sundayScheduleId: 2,
    holidayScheduleId: 1,
    setpoint: {
      id: 1,
      stage: "Create",
      message: null,
      correlation: null,
      createdAt: "2023-08-30T18:41:18.023Z",
      updatedAt: "2023-08-30T18:41:18.023Z",
      label: "Occupied Setpoint: 71º F Deadband: 6º F Unoccupied Heating: 65º F Cooling: 78º F",
      setpoint: 71,
      deadband: 6,
      heating: 65,
      cooling: 78,
    },
    mondaySchedule: {
      id: 8,
      stage: "Create",
      message: null,
      correlation: null,
      createdAt: "2023-08-30T18:41:18.023Z",
      updatedAt: "2023-08-30T18:41:18.023Z",
      label: "Occupied From Start Time: 6:30 am To End Time: 6:00 pm",
      startTime: "06:30",
      endTime: "18:00",
      occupied: true,
      setpointId: null,
    },
    tuesdaySchedule: {
      id: 7,
      stage: "Create",
      message: null,
      correlation: null,
      createdAt: "2023-08-30T18:41:18.023Z",
      updatedAt: "2023-08-30T18:41:18.023Z",
      label: "Occupied From Start Time: 6:30 am To End Time: 6:00 pm",
      startTime: "06:30",
      endTime: "18:00",
      occupied: true,
      setpointId: null,
    },
    wednesdaySchedule: {
      id: 6,
      stage: "Create",
      message: null,
      correlation: null,
      createdAt: "2023-08-30T18:41:18.023Z",
      updatedAt: "2023-08-30T18:41:18.023Z",
      label: "Occupied From Start Time: 6:30 am To End Time: 6:00 pm",
      startTime: "06:30",
      endTime: "18:00",
      occupied: true,
      setpointId: null,
    },
    thursdaySchedule: {
      id: 5,
      stage: "Create",
      message: null,
      correlation: null,
      createdAt: "2023-08-30T18:41:18.023Z",
      updatedAt: "2023-08-30T18:41:18.023Z",
      label: "Occupied From Start Time: 6:30 am To End Time: 6:00 pm",
      startTime: "06:30",
      endTime: "18:00",
      occupied: true,
      setpointId: null,
    },
    fridaySchedule: {
      id: 4,
      stage: "Create",
      message: null,
      correlation: null,
      createdAt: "2023-08-30T18:41:18.023Z",
      updatedAt: "2023-08-30T18:41:18.023Z",
      label: "Occupied From Start Time: 6:30 am To End Time: 6:00 pm",
      startTime: "06:30",
      endTime: "18:00",
      occupied: true,
      setpointId: null,
    },
    saturdaySchedule: {
      id: 3,
      stage: "Create",
      message: null,
      correlation: null,
      createdAt: "2023-08-30T18:41:18.023Z",
      updatedAt: "2023-08-30T18:41:18.023Z",
      label: "Unoccupied All Day",
      startTime: "08:00",
      endTime: "18:00",
      occupied: false,
      setpointId: null,
    },
    sundaySchedule: {
      id: 2,
      stage: "Create",
      message: null,
      correlation: null,
      createdAt: "2023-08-30T18:41:18.023Z",
      updatedAt: "2023-08-30T18:41:18.023Z",
      label: "Unoccupied All Day",
      startTime: "08:00",
      endTime: "18:00",
      occupied: false,
      setpointId: null,
    },
    holidaySchedule: {
      id: 1,
      stage: "Create",
      message: null,
      correlation: null,
      createdAt: "2023-08-30T18:41:18.023Z",
      updatedAt: "2023-08-30T18:41:18.023Z",
      label: "Unoccupied All Day",
      startTime: "08:00",
      endTime: "18:00",
      occupied: false,
      setpointId: null,
    },
    holidays: [
      {
        id: 2,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Disabled",
        label: "Martin Luther King Jr",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 1,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Enabled",
        label: "New Year's Day",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 14,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Enabled",
        label: "Christmas",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 13,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Enabled",
        label: "Christmas Eve",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 12,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Enabled",
        label: "Black Friday",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 11,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Enabled",
        label: "Thanksgiving",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 10,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Disabled",
        label: "Veterans Day",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 9,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Disabled",
        label: "Columbus Day",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 8,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Enabled",
        label: "Labor Day",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 6,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Enabled",
        label: "Independence Day",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 5,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Enabled",
        label: "Juneteenth",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 4,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Enabled",
        label: "Memorial Day",
        month: null,
        day: null,
        observance: null,
      },
      {
        id: 3,
        stage: "Create",
        message: null,
        correlation: null,
        createdAt: "2023-08-30T18:41:18.023Z",
        updatedAt: "2023-08-30T18:41:18.023Z",
        type: "Disabled",
        label: "Presidents Day",
        month: null,
        day: null,
        observance: null,
      },
    ],
    occupancies: [],
  },
};

describe("template.transformTemplate()", () => {
  it("should work on a string", () => {
    const template = "This is just a string.";
    const result = template;
    expect(transformTemplate(template, unit)).toEqual(result);
  });
  it("should work on a number", () => {
    const template = 42;
    const result = 42;
    expect(transformTemplate(template, unit)).toEqual(result);
  });
  it("should work on a simple object", () => {
    const template = { key: "This is just a string." };
    const result = template;
    expect(transformTemplate(template, unit)).toEqual(result);
  });
  it("should work on a simple object with a transform", () => {
    const template = { key: "Setpoint: {configuration.setpoint.label}" };
    const result = {
      key: "Setpoint: Occupied Setpoint: 71º F Deadband: 6º F Unoccupied Heating: 65º F Cooling: 78º F",
    };
    expect(transformTemplate(template, unit)).toEqual(result);
  });
  it("should work on a simple object with a key transform", () => {
    const template = { "{campus}": { "{building}": "{system}" } };
    const result = { PNNL: { ROB: "SCHNEIDER" } };
    expect(transformTemplate(template, unit)).toEqual(result);
  });
  it("should work with a map", () => {
    const value = { campus: "PNNL", building: "ROB", values: [{ system: "SCHNEIDER" }, { system: "BACSTAT" }] };
    const template = { "{campus}": { "{building}": { _type: "map", path: "values", value: "{system}" } } };
    const result = { PNNL: { ROB: ["SCHNEIDER", "BACSTAT"] } };
    expect(transformTemplate(template, value)).toEqual(result);
  });
  it("should work with a reduce", () => {
    const value = {
      values: [
        { campus: "PNNL", building: "ROB", system: "SCHNEIDER" },
        { campus: "PNNL", building: "ROB", system: "BACSTAT" },
      ],
    };
    const template = {
      _type: "reduce",
      path: "values",
      value: { "{campus}": { "{building}": { "{system}": { label: "{campus}.{building}.{system}" } } } },
    };
    const result = {
      PNNL: { ROB: { SCHNEIDER: { label: "PNNL.ROB.SCHNEIDER" }, BACSTAT: { label: "PNNL.ROB.BACSTAT" } } },
    };
    expect(transformTemplate(template, value)).toEqual(result);
  });
  it("should work on pairwise_criteria.json", () => {
    const template = {
      curtail: {
        "zonetemperature-setpoint": {
          location: 2,
          "history-zonetemperature": 4,
          "room-type": 4,
          "rated-power": 1,
          stage: 3,
        },
        stage: {
          location: 0.6666667,
          "history-zonetemperature": 0.75,
          "room-type": 0.75,
          "rated-power": 1,
        },
        "history-zonetemperature": {
          location: 0.5,
          "room-type": 1,
          "rated-power": 0.25,
        },
        "rated-power": {
          location: 1,
          "room-type": 2,
        },
        "room-type": {
          location: 0.5,
        },
        location: {},
      },
    };
    const result = {
      curtail: {
        "zonetemperature-setpoint": {
          location: 2,
          "history-zonetemperature": 4,
          "room-type": 4,
          "rated-power": 1,
          stage: 3,
        },
        stage: {
          location: 0.6666667,
          "history-zonetemperature": 0.75,
          "room-type": 0.75,
          "rated-power": 1,
        },
        "history-zonetemperature": {
          location: 0.5,
          "room-type": 1,
          "rated-power": 0.25,
        },
        "rated-power": {
          location: 1,
          "room-type": 2,
        },
        "room-type": {
          location: 0.5,
        },
        location: {},
      },
    };
    expect(transformTemplate(template, unit)).toEqual(result);
  });
  it("should work on ilc_config.json", () => {
    const template = {
      campus: "{campus}",
      building: "{building}",
      power_meter: {
        device_topic: "{campus}/{building}/{meter}",
        point: "WholeBuildingPower",
      },
      agent_id: "ILC",
      demand_limit: "TRIGGER",
      control_time: 15.0,
      control_confirm: 5.0,
      average_building_power_window: 15.0,
      stagger_release: true,
      stagger_off_time: false,
      demand_threshold: 1.0,
      clusters: [
        {
          device_control_config: "config://control.config",
          device_criteria_config: "config://criteria.config",
          pairwise_criteria_config: "config://criteria.json",
          cluster_priority: 1.0,
        },
      ],
    };
    const result = {
      campus: "PNNL",
      building: "ROB",
      power_meter: {
        device_topic: "PNNL/ROB/undefined",
        point: "WholeBuildingPower",
      },
      agent_id: "ILC",
      demand_limit: "TRIGGER",
      control_time: 15.0,
      control_confirm: 5.0,
      average_building_power_window: 15.0,
      stagger_release: true,
      stagger_off_time: false,
      demand_threshold: 1.0,
      clusters: [
        {
          device_control_config: "config://control.config",
          device_criteria_config: "config://criteria.config",
          pairwise_criteria_config: "config://criteria.json",
          cluster_priority: 1.0,
        },
      ],
    };
    expect(transformTemplate(template, unit)).toEqual(result);
  });
  it("should work on control_config.json", () => {
    const template = {
      HP1: {
        FirstStageCooling: {
          device_topic: "{campus}/{building}/{system}",
          device_status: {
            curtail: {
              condition: "FirstStageCooling",
              device_status_args: ["FirstStageCooling"],
            },
          },
          curtail_settings: {
            point: "OccupiedCoolingSetPoint",
            control_method: "offset",
            revert_priority: 1,
            offset: {
              _type: "value",
              sources: ["setpointPeakOffset", "compressors"],
              expression: "setpointPeakOffset / (compressors || 1)",
            },
            load: {
              _type: "value",
              sources: ["coolingCapacity", "compressors"],
              expression: "coolingCapacity / (compressors || 1)",
            },
          },
        },
        SecondStageCooling: {
          _type: "evaluate",
          sources: ["compressors"],
          expression: "Boolean(compressors > 1).toString()",
          values: {
            true: {
              device_topic: "{campus}/{building}/{system}",
              device_status: {
                curtail: {
                  condition: "FirstStageCooling",
                  device_status_args: ["FirstStageCooling"],
                },
              },
              curtail_settings: {
                point: "OccupiedCoolingSetPoint",
                control_method: "offset",
                revert_priority: 2,
                offset: {
                  _type: "value",
                  sources: ["setpointPeakOffset", "compressors"],
                  expression: "setpointPeakOffset / compressors",
                },
                load: {
                  _type: "value",
                  sources: ["coolingCapacity", "compressors"],
                  expression: "coolingCapacity / compressors",
                },
              },
            },
            false: {
              _type: "remove",
            },
          },
        },
        FirstStageHeating: {
          _type: "evaluate",
          sources: ["heatPump"],
          expression: "Boolean(heatPump).toString()",
          values: {
            true: {
              device_topic: "{campus}/{building}/{system}",
              device_status: {
                curtail: {
                  condition: "FirstStageHeating",
                  device_status_args: ["FirstStageHeating"],
                },
              },
              curtail_settings: {
                point: "OccupiedHeatingSetPoint",
                control_method: "offset",
                revert_priority: 1,
                offset: {
                  _type: "value",
                  sources: ["setpointPeakOffset", "heatPump"],
                  expression: "setpointPeakOffset / (heatPump ? 2 : 1)",
                },
                load: {
                  _type: "value",
                  sources: ["coolingCapacity"],
                  expression: "coolingCapacity",
                },
              },
            },
            false: {
              _type: "remove",
            },
          },
        },
        SecondStageHeating: {
          _type: "evaluate",
          sources: ["heatPumpBackup"],
          expression: "Boolean(heatPumpBackup > 0).toString()",
          values: {
            true: {
              device_topic: "{campus}/{building}/{system}",
              device_status: {
                curtail: {
                  condition: "SecondStageHeating",
                  device_status_args: ["SecondStageHeating"],
                },
              },
              curtail_settings: {
                point: "OccupiedHeatingSetPoint",
                control_method: "offset",
                revert_priority: 2,
                offset: {
                  _type: "value",
                  sources: ["setpointPeakOffset", "heatPump"],
                  expression: "setpointPeakOffset / (heatPump ? 2 : 1)",
                },
                load: {
                  _type: "value",
                  sources: ["heatPumpBackup"],
                  expression: "heatPumpBackup",
                },
              },
            },
            false: {
              _type: "remove",
            },
          },
        },
      },
    };
    const result = {
      HP1: {
        FirstStageCooling: {
          device_topic: "PNNL/ROB/SCHNEIDER",
          device_status: {
            curtail: {
              condition: "FirstStageCooling",
              device_status_args: ["FirstStageCooling"],
            },
          },
          curtail_settings: {
            point: "OccupiedCoolingSetPoint",
            control_method: "offset",
            revert_priority: 1,
            offset: 0.5,
            load: 3,
          },
        },
        FirstStageHeating: {
          device_topic: "PNNL/ROB/SCHNEIDER",
          device_status: {
            curtail: {
              condition: "FirstStageHeating",
              device_status_args: ["FirstStageHeating"],
            },
          },
          curtail_settings: {
            point: "OccupiedHeatingSetPoint",
            control_method: "offset",
            revert_priority: 1,
            offset: 0.25,
            load: 3,
          },
        },
        SecondStageHeating: {
          device_topic: "PNNL/ROB/SCHNEIDER",
          device_status: {
            curtail: {
              condition: "SecondStageHeating",
              device_status_args: ["SecondStageHeating"],
            },
          },
          curtail_settings: {
            point: "OccupiedHeatingSetPoint",
            control_method: "offset",
            revert_priority: 2,
            offset: 0.25,
            load: 1,
          },
        },
      },
    };
    expect(transformTemplate(template, unit)).toEqual(result);
  });
  it("should work on criteria_config.json", () => {
    const template = {
      "{system}": {
        FirstStageCooling: {
          curtail: {
            device_topic: "{campus}/{building}/{system}",
            "zonetemperature-setpoint": {
              operation: "1/(ZoneTemperature - OccupiedCoolingSetPoint)",
              operation_type: "formula",
              operation_args: ["OccupiedCoolingSetPoint", "ZoneTemperature"],
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: {
                _type: "value",
                sources: ["coolingCapacity", "compressors"],
                expression: "coolingCapacity / (compressors || 1)",
              },
              off_value: 0.0,
              operation_type: "status",
              point_name: "FirstStageCooling",
            },
            "room-type": {
              _type: "evaluate",
              sources: ["zoneBuilding"],
              expression: "zoneBuilding",
              values: {
                "corner-office": 1,
                office: 3,
                "empty-office": 7,
                conference: 1,
                "mechanical-room": 9,
                "computer-lab": 2,
                kitchen: 6,
                mixed: 4,
              },
            },
            stage: {
              value: 1,
              operation_type: "constant",
            },
            location: {
              value: {
                _type: "value",
                sources: ["zoneLocation"],
                expression: "zoneLocation === 'exterior' ? 1 : 4",
              },
              operation_type: "constant",
            },
            "history-zonetemperature": {
              comparison_type: "direct",
              operation_type: "history",
              point_name: "ZoneTemperature",
              previous_time: 15,
              minimum: 0,
              maximum: 10,
            },
          },
        },
        SecondStageCooling: {
          curtail: {
            device_topic: "{campus}/{building}/{system}",
            "zonetemperature-setpoint": {
              operation: "1/(ZoneTemperature - OccupiedCoolingSetPoint)",
              operation_type: "formula",
              operation_args: ["OccupiedCoolingSetPoint", "ZoneTemperature"],
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: {
                _type: "value",
                sources: ["coolingCapacity", "compressors"],
                expression: "coolingCapacity / (compressors || 1)",
              },
              off_value: 0.0,
              operation_type: "status",
              point_name: "FirstStageCooling",
            },
            "room-type": {
              _type: "evaluate",
              sources: ["zoneBuilding"],
              expression: "zoneBuilding",
              values: {
                "corner-office": 1,
                office: 3,
                "empty-office": 7,
                conference: 1,
                "mechanical-room": 9,
                "computer-lab": 2,
                kitchen: 6,
                mixed: 4,
              },
            },
            stage: {
              value: 2,
              operation_type: "constant",
            },
            location: {
              value: {
                _type: "value",
                sources: ["zoneLocation"],
                expression: "zoneLocation === 'exterior' ? 1 : 4",
              },
              operation_type: "constant",
            },
            "history-zonetemperature": {
              comparison_type: "direct",
              operation_type: "history",
              point_name: "ZoneTemperature",
              previous_time: 15,
              minimum: 0,
              maximum: 10,
            },
          },
        },
        FirstStageHeating: {
          curtail: {
            device_topic: "{campus}/{building}/{system}",
            "zonetemperature-setpoint": {
              operation: "1/(HeatingTemperatureSetPoint - ZoneTemperature)",
              operation_type: "formula",
              operation_args: ["OccupiedHeatingSetPoint", "ZoneTemperature"],
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: { _type: "value", sources: ["coolingCapacity"], expression: "coolingCapacity" },
              off_value: 0.0,
              operation_type: "status",
              point_name: "FirstStageHeating",
            },
            "room-type": {
              _type: "evaluate",
              sources: ["zoneBuilding"],
              expression: "zoneBuilding",
              values: {
                "corner-office": 1,
                office: 3,
                "empty-office": 7,
                conference: 1,
                "mechanical-room": 9,
                "computer-lab": 2,
                kitchen: 6,
                mixed: 4,
              },
            },
            stage: {
              value: 1.0,
              operation_type: "constant",
            },
            location: {
              value: {
                value: {
                  _type: "value",
                  sources: ["zoneLocation"],
                  expression: "zoneLocation === 'exterior' ? 1 : 4",
                },
                operation_type: "constant",
              },
              operation_type: "constant",
            },
            "history-zonetemperature": {
              comparison_type: "direct",
              operation_type: "history",
              point_name: "ZoneTemperature",
              previous_time: 15,
              minimum: 0,
              maximum: 10,
            },
          },
        },
        SecondStageHeating: {
          curtail: {
            device_topic: "{campus}/{building}/{system}",
            "zonetemperature-setpoint": {
              operation: "1/(OccupiedHeatingSetPoint - ZoneTemperature)",
              operation_type: "formula",
              operation_args: ["OccupiedHeatingSetPoint", "ZoneTemperature"],
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: { _type: "value", sources: ["heatPumpBackup"], expression: "heatPumpBackup" },
              off_value: 0.0,
              operation_type: "status",
              point_name: "SecondStageHeating",
            },
            "room-type": {
              _type: "evaluate",
              sources: ["zoneBuilding"],
              expression: "zoneBuilding",
              values: {
                "corner-office": 1,
                office: 3,
                "empty-office": 7,
                conference: 1,
                "mechanical-room": 9,
                "computer-lab": 2,
                kitchen: 6,
                mixed: 4,
              },
            },
            stage: {
              value: 4.0,
              operation_type: "constant",
            },
            location: {
              value: {
                value: {
                  _type: "value",
                  sources: ["zoneLocation"],
                  expression: "zoneLocation === 'exterior' ? 1 : 4",
                },
                operation_type: "constant",
              },
              operation_type: "constant",
            },
            "history-zonetemperature": {
              comparison_type: "direct",
              operation_type: "history",
              point_name: "ZoneTemperature",
              previous_time: 15,
              minimum: 0,
              maximum: 10,
            },
          },
        },
      },
    };
    const result = {
      SCHNEIDER: {
        FirstStageCooling: {
          curtail: {
            device_topic: "PNNL/ROB/SCHNEIDER",
            "zonetemperature-setpoint": {
              operation: "1/(ZoneTemperature - OccupiedCoolingSetPoint)",
              operation_type: "formula",
              operation_args: ["OccupiedCoolingSetPoint", "ZoneTemperature"],
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: 3,
              off_value: 0.0,
              operation_type: "status",
              point_name: "FirstStageCooling",
            },
            "room-type": 3,
            stage: {
              value: 1,
              operation_type: "constant",
            },
            location: {
              value: 1,
              operation_type: "constant",
            },
            "history-zonetemperature": {
              comparison_type: "direct",
              operation_type: "history",
              point_name: "ZoneTemperature",
              previous_time: 15,
              minimum: 0,
              maximum: 10,
            },
          },
        },
        SecondStageCooling: {
          curtail: {
            device_topic: "PNNL/ROB/SCHNEIDER",
            "zonetemperature-setpoint": {
              operation: "1/(ZoneTemperature - OccupiedCoolingSetPoint)",
              operation_type: "formula",
              operation_args: ["OccupiedCoolingSetPoint", "ZoneTemperature"],
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: 3,
              off_value: 0.0,
              operation_type: "status",
              point_name: "FirstStageCooling",
            },
            "room-type": 3,
            stage: {
              value: 2,
              operation_type: "constant",
            },
            location: {
              value: 1,
              operation_type: "constant",
            },
            "history-zonetemperature": {
              comparison_type: "direct",
              operation_type: "history",
              point_name: "ZoneTemperature",
              previous_time: 15,
              minimum: 0,
              maximum: 10,
            },
          },
        },
        FirstStageHeating: {
          curtail: {
            device_topic: "PNNL/ROB/SCHNEIDER",
            "zonetemperature-setpoint": {
              operation: "1/(HeatingTemperatureSetPoint - ZoneTemperature)",
              operation_type: "formula",
              operation_args: ["OccupiedHeatingSetPoint", "ZoneTemperature"],
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: 3,
              off_value: 0.0,
              operation_type: "status",
              point_name: "FirstStageHeating",
            },
            "room-type": 3,
            stage: {
              value: 1.0,
              operation_type: "constant",
            },
            location: {
              value: {
                value: 1,
                operation_type: "constant",
              },
              operation_type: "constant",
            },
            "history-zonetemperature": {
              comparison_type: "direct",
              operation_type: "history",
              point_name: "ZoneTemperature",
              previous_time: 15,
              minimum: 0,
              maximum: 10,
            },
          },
        },
        SecondStageHeating: {
          curtail: {
            device_topic: "PNNL/ROB/SCHNEIDER",
            "zonetemperature-setpoint": {
              operation: "1/(OccupiedHeatingSetPoint - ZoneTemperature)",
              operation_type: "formula",
              operation_args: ["OccupiedHeatingSetPoint", "ZoneTemperature"],
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: 1,
              off_value: 0.0,
              operation_type: "status",
              point_name: "SecondStageHeating",
            },
            "room-type": 3,
            stage: {
              value: 4.0,
              operation_type: "constant",
            },
            location: {
              value: {
                value: 1,
                operation_type: "constant",
              },
              operation_type: "constant",
            },
            "history-zonetemperature": {
              comparison_type: "direct",
              operation_type: "history",
              point_name: "ZoneTemperature",
              previous_time: 15,
              minimum: 0,
              maximum: 10,
            },
          },
        },
      },
    };
    expect(transformTemplate(template, unit)).toEqual(result);
  });
});
