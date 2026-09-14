import { readFileSync } from "node:fs";
import { join } from "node:path";
import { transformTemplate } from "@/utils/template";
import { control, unit } from "./template.fixtures";

const TEMPLATES_DIR = join(__dirname, "..", "..", "..", "..", "aems-edge", "configurations", "templates");
const loadTemplate = (name: string): unknown => JSON.parse(readFileSync(join(TEMPLATES_DIR, name), "utf-8"));

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
      key: "Setpoint: Occupied Setpoint: 71ºF Deadband: 6ºF Unoccupied Heating: 65ºF Cooling: 78ºF",
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
    const template = loadTemplate("pairwise_criteria.json");
    // No placeholders — the file passes through unchanged.
    expect(transformTemplate(template, control)).toEqual(template);
  });
  it("should work on config.json", () => {
    const template = loadTemplate("config.json");
    const result = {
      campus: "PNNL",
      building: "ROB",
      power_meter: {
        device_topic: "PNNL/ROB/METER",
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
          device_control_config: "config://control_config",
          device_criteria_config: "config://criteria_config",
          pairwise_criteria_config: "config://pairwise_criteria",
          cluster_priority: 1.0,
        },
      ],
    };
    expect(transformTemplate(template, control)).toEqual(result);
  });
  it("should work on control_config.json", () => {
    const template = loadTemplate("control_config.json");
    // Fixture unit: compressors=1 → SecondStageCooling removed.
    //                heatPump=true, heatPumpBackup=1 → both heating stages present.
    // Offsets: coolingPeakOffset/1 = 0.5; heatingPeakOffset/(heatPump?2:1) = -0.25.
    // Loads: coolingCapacity/1 = 3; SecondStageHeating load = heatPumpBackup = 1.
    const result = {
      SCHNEIDER: {
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
            offset: -0.25,
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
            offset: -0.25,
            load: 1,
          },
        },
      },
    };
    expect(transformTemplate(template, control)).toEqual(result);
  });
  it("should work on criteria_config.json", () => {
    const template = loadTemplate("criteria_config.json");
    const historyBlock = {
      comparison_type: "direct",
      operation_type: "history",
      point_name: "ZoneTemperature",
      previous_time: 15,
      minimum: 0,
      maximum: 10,
    };
    // zoneBuilding="office" → room-type value 4.  zoneLocation="exterior" → location value 1.
    const roomType = { value: 4, operation_type: "constant" };
    const locationBlock = { value: 1, operation_type: "constant" };
    const result = {
      SCHNEIDER: {
        FirstStageCooling: {
          curtail: {
            device_topic: "PNNL/ROB/SCHNEIDER",
            "zonetemperature-setpoint": {
              operation: "1/(ZoneTemperature - OccupiedCoolingSetPoint)",
              operation_type: "formula",
              operation_args: { always: ["ZoneTemperature"], nc: ["OccupiedCoolingSetPoint"] },
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: 3,
              off_value: 0.0,
              operation_type: "status",
              point_name: "FirstStageCooling",
            },
            "room-type": roomType,
            stage: { value: 1, operation_type: "constant" },
            location: locationBlock,
            "history-zonetemperature": historyBlock,
          },
        },
        // SecondStageCooling: compressors=1 → dropped.
        FirstStageHeating: {
          curtail: {
            device_topic: "PNNL/ROB/SCHNEIDER",
            "zonetemperature-setpoint": {
              operation: "1/(OccupiedHeatingSetPoint - ZoneTemperature)",
              operation_type: "formula",
              operation_args: { always: ["ZoneTemperature"], nc: ["OccupiedHeatingSetPoint"] },
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: 3,
              off_value: 0.0,
              operation_type: "status",
              point_name: "FirstStageHeating",
            },
            "room-type": roomType,
            stage: { value: 1.0, operation_type: "constant" },
            location: locationBlock,
            "history-zonetemperature": historyBlock,
          },
        },
        SecondStageHeating: {
          curtail: {
            device_topic: "PNNL/ROB/SCHNEIDER",
            "zonetemperature-setpoint": {
              operation: "1/(OccupiedHeatingSetPoint - ZoneTemperature)",
              operation_type: "formula",
              operation_args: { always: ["ZoneTemperature"], nc: ["OccupiedHeatingSetPoint"] },
              minimum: 0,
              maximum: 10,
            },
            "rated-power": {
              on_value: 1,
              off_value: 0.0,
              operation_type: "status",
              point_name: "SecondStageHeating",
            },
            "room-type": roomType,
            stage: { value: 4.0, operation_type: "constant" },
            location: locationBlock,
            "history-zonetemperature": historyBlock,
          },
        },
      },
    };
    expect(transformTemplate(template, control)).toEqual(result);
  });
});
