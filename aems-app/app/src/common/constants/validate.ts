import { IBase, IConstant } from "../types";
import Base from "./base";

export type ValidateType = "unit" | "schedule" | "setpoint";

export interface IValidate extends IConstant {
  type: ValidateType;
  options?:
    | { default: string; min?: string; max?: string }
    | { default: boolean; min?: undefined; max?: undefined }
    | { default: number; min: number; max: number };
}

class Validate extends Base<IValidate> implements IBase<IValidate> {
  constructor() {
    super([
      {
        name: "setpoint",
        label: "Setpoint",
        type: "setpoint" as ValidateType,
        options: { default: 70, min: 55, max: 85 },
      },
      {
        name: "deadband",
        label: "Deadband",
        type: "setpoint" as ValidateType,
        options: { default: 4, min: 2, max: 6 },
      },
      {
        name: "heating",
        label: "Heating",
        type: "setpoint" as ValidateType,
        options: { default: 60, min: 55, max: 85 },
      },
      {
        name: "cooling",
        label: "Cooling",
        type: "setpoint" as ValidateType,
        options: { default: 80, min: 55, max: 85 },
      },
      { name: "startTime", label: "Start Time", type: "schedule" as ValidateType, options: { default: "08:00" } },
      { name: "endTime", label: "End Time", type: "schedule" as ValidateType, options: { default: "18:00" } },
      { name: "occupied", label: "Occupied", type: "schedule" as ValidateType, options: { default: true } },
      {
        name: "coolingCapacity",
        label: "Cooling Capacity",
        type: "unit" as ValidateType,
        options: { default: 3, min: 3, max: 25 },
      },
      {
        name: "compressors",
        label: "Compressors",
        type: "unit" as ValidateType,
        options: { default: 1, min: 1, max: 4 },
      },
      {
        name: "coolingLockout",
        label: "Cooling Lockout",
        type: "unit" as ValidateType,
        options: { default: 45, min: 45, max: 65 },
      },
      {
        name: "optimalStartLockout",
        label: "Optimal Start Lockout",
        type: "unit" as ValidateType,
        options: { default: 20, min: 15, max: 45 },
      },
      {
        name: "optimalStartDeviation",
        label: "Optimal Start Deviation",
        type: "unit" as ValidateType,
        options: { default: 0.5, min: 0.5, max: 2 },
      },
      {
        name: "earliestStart",
        label: "Earliest Start",
        type: "unit" as ValidateType,
        options: { default: 60, min: 60, max: 180 },
      },
      {
        name: "latestStart",
        label: "Latest Start",
        type: "unit" as ValidateType,
        options: { default: 0, min: 0, max: 60 },
      },
      { name: "zoneLocation", label: "Zone Location", type: "unit" as ValidateType, options: { default: "exterior" } },
      { name: "zoneMass", label: "Zone Mass", type: "unit" as ValidateType, options: { default: "medium" } },
      {
        name: "zoneOrientation",
        label: "Zone Orientation",
        type: "unit" as ValidateType,
        options: { default: "north" },
      },
      { name: "zoneBuilding", label: "Zone Building", type: "unit" as ValidateType, options: { default: "office" } },
      { name: "heatPump", label: "Heat Pump", type: "unit" as ValidateType, options: { default: true } },
      {
        name: "heatPumpBackup",
        label: "Heat Pump Backup",
        type: "unit" as ValidateType,
        options: { default: 0, min: 0, max: 50 },
      },
      { name: "economizer", label: "Economizer", type: "unit" as ValidateType, options: { default: true } },
      {
        name: "heatPumpLockout",
        label: "Heat Pump Lockout",
        type: "unit" as ValidateType,
        options: { default: 30, min: 20, max: 60 },
      },
      {
        name: "coolingPeakOffset",
        label: "Cooling Peak Offset",
        type: "unit" as ValidateType,
        options: { default: 0.5, min: 0.5, max: 4 },
      },
      {
        name: "heatingPeakOffset",
        label: "Heating Peak Offset",
        type: "unit" as ValidateType,
        options: { default: -0.5, min: -4, max: -0.5 },
      },
      {
        name: "peakLoadExclude",
        label: "Peak Load Exclude",
        type: "unit" as ValidateType,
        options: { default: false },
      },
      {
        name: "economizerSetpoint",
        label: "Economizer Setpoint",
        type: "unit" as ValidateType,
        options: { default: 45, min: 45, max: 70 },
      },
    ]);
  }

  // static references to objects
  SetpointType = this.parseStrict("setpoint");
  DeadbandType = this.parseStrict("deadband");
  HeatingType = this.parseStrict("heating");
  CoolingType = this.parseStrict("cooling");

  StartTimeType = this.parseStrict("startTime");
  EndTimeType = this.parseStrict("endTime");
  OccupiedType = this.parseStrict("occupied");

  CoolingCapacityType = this.parseStrict("coolingCapacity");
  CompressorsType = this.parseStrict("compressors");
  CoolingLockoutType = this.parseStrict("coolingLockout");
  OptimalStartLockoutType = this.parseStrict("optimalStartLockout");
  OptimalStartDeviationType = this.parseStrict("optimalStartDeviation");
  EarliestStartType = this.parseStrict("earliestStart");
  LatestStartType = this.parseStrict("latestStart");
  ZoneLocationType = this.parseStrict("zoneLocation");
  ZoneMassType = this.parseStrict("zoneMass");
  ZoneOrientationType = this.parseStrict("zoneOrientation");
  ZoneBuildingType = this.parseStrict("zoneBuilding");
  HeatPumpType = this.parseStrict("heatPump");
  HeatPumpBackupType = this.parseStrict("heatPumpBackup");
  EconomizerType = this.parseStrict("economizer");
  HeatPumpLockoutType = this.parseStrict("heatPumpLockout");
  CoolingPeakOffsetType = this.parseStrict("coolingPeakOffset");
  HeatingPeakOffsetType = this.parseStrict("heatingPeakOffset");
  PeakLoadExcludeType = this.parseStrict("peakLoadExclude");
  EconomizerSetpoint = this.parseStrict("economizerSetpoint");
}

const validate = new Validate();

export default validate;
