import { IBase, IConstant } from ".";
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
  Setpoint = this.parseStrict("setpoint");
  SetpointType = this.parseStrict("setpoint");
  Deadband = this.parseStrict("deadband");
  DeadbandType = this.parseStrict("deadband");
  Heating = this.parseStrict("heating");
  HeatingType = this.parseStrict("heating");
  Cooling = this.parseStrict("cooling");
  CoolingType = this.parseStrict("cooling");

  StartTime = this.parseStrict("startTime");
  StartTimeType = this.parseStrict("startTime");
  EndTime = this.parseStrict("endTime");
  EndTimeType = this.parseStrict("endTime");
  Occupied = this.parseStrict("occupied");
  OccupiedType = this.parseStrict("occupied");

  CoolingCapacity = this.parseStrict("coolingCapacity");
  CoolingCapacityType = this.parseStrict("coolingCapacity");
  Compressors = this.parseStrict("compressors");
  CompressorsType = this.parseStrict("compressors");
  CoolingLockout = this.parseStrict("coolingLockout");
  CoolingLockoutType = this.parseStrict("coolingLockout");
  OptimalStartLockout = this.parseStrict("optimalStartLockout");
  OptimalStartLockoutType = this.parseStrict("optimalStartLockout");
  OptimalStartDeviation = this.parseStrict("optimalStartDeviation");
  OptimalStartDeviationType = this.parseStrict("optimalStartDeviation");
  EarliestStart = this.parseStrict("earliestStart");
  EarliestStartType = this.parseStrict("earliestStart");
  LatestStart = this.parseStrict("latestStart");
  LatestStartType = this.parseStrict("latestStart");
  ZoneLocation = this.parseStrict("zoneLocation");
  ZoneLocationType = this.parseStrict("zoneLocation");
  ZoneMass = this.parseStrict("zoneMass");
  ZoneMassType = this.parseStrict("zoneMass");
  ZoneOrientation = this.parseStrict("zoneOrientation");
  ZoneOrientationType = this.parseStrict("zoneOrientation");
  ZoneBuilding = this.parseStrict("zoneBuilding");
  ZoneBuildingType = this.parseStrict("zoneBuilding");
  HeatPump = this.parseStrict("heatPump");
  HeatPumpType = this.parseStrict("heatPump");
  HeatPumpBackup = this.parseStrict("heatPumpBackup");
  HeatPumpBackupType = this.parseStrict("heatPumpBackup");
  Economizer = this.parseStrict("economizer");
  EconomizerType = this.parseStrict("economizer");
  HeatPumpLockout = this.parseStrict("heatPumpLockout");
  HeatPumpLockoutType = this.parseStrict("heatPumpLockout");
  CoolingPeakOffset = this.parseStrict("coolingPeakOffset");
  CoolingPeakOffsetType = this.parseStrict("coolingPeakOffset");
  HeatingPeakOffset = this.parseStrict("heatingPeakOffset");
  HeatingPeakOffsetType = this.parseStrict("heatingPeakOffset");
  PeakLoadExclude = this.parseStrict("peakLoadExclude");
  PeakLoadExcludeType = this.parseStrict("peakLoadExclude");
  EconomizerSetpoint = this.parseStrict("economizerSetpoint");
  EconomizerSetpointType = this.parseStrict("economizerSetpoint");
}

const validate = new Validate();

export default validate;
