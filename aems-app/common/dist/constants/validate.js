"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Validate extends base_1.default {
    constructor() {
        super([
            {
                name: "setpoint",
                label: "Setpoint",
                type: "setpoint",
                options: { default: 70, min: 55, max: 85 },
            },
            {
                name: "deadband",
                label: "Deadband",
                type: "setpoint",
                options: { default: 4, min: 2, max: 6 },
            },
            {
                name: "heating",
                label: "Heating",
                type: "setpoint",
                options: { default: 60, min: 55, max: 85 },
            },
            {
                name: "cooling",
                label: "Cooling",
                type: "setpoint",
                options: { default: 80, min: 55, max: 85 },
            },
            { name: "startTime", label: "Start Time", type: "schedule", options: { default: "08:00" } },
            { name: "endTime", label: "End Time", type: "schedule", options: { default: "18:00" } },
            { name: "occupied", label: "Occupied", type: "schedule", options: { default: true } },
            {
                name: "coolingCapacity",
                label: "Cooling Capacity",
                type: "unit",
                options: { default: 3, min: 3, max: 25 },
            },
            {
                name: "compressors",
                label: "Compressors",
                type: "unit",
                options: { default: 1, min: 1, max: 4 },
            },
            {
                name: "coolingLockout",
                label: "Cooling Lockout",
                type: "unit",
                options: { default: 45, min: 45, max: 65 },
            },
            {
                name: "optimalStartLockout",
                label: "Optimal Start Lockout",
                type: "unit",
                options: { default: 20, min: 15, max: 45 },
            },
            {
                name: "optimalStartDeviation",
                label: "Optimal Start Deviation",
                type: "unit",
                options: { default: 0.5, min: 0.5, max: 2 },
            },
            {
                name: "earliestStart",
                label: "Earliest Start",
                type: "unit",
                options: { default: 60, min: 60, max: 180 },
            },
            {
                name: "latestStart",
                label: "Latest Start",
                type: "unit",
                options: { default: 0, min: 0, max: 60 },
            },
            { name: "zoneLocation", label: "Zone Location", type: "unit", options: { default: "exterior" } },
            { name: "zoneMass", label: "Zone Mass", type: "unit", options: { default: "medium" } },
            {
                name: "zoneOrientation",
                label: "Zone Orientation",
                type: "unit",
                options: { default: "north" },
            },
            { name: "zoneBuilding", label: "Zone Building", type: "unit", options: { default: "office" } },
            { name: "heatPump", label: "Heat Pump", type: "unit", options: { default: true } },
            {
                name: "heatPumpBackup",
                label: "Heat Pump Backup",
                type: "unit",
                options: { default: 0, min: 0, max: 50 },
            },
            { name: "economizer", label: "Economizer", type: "unit", options: { default: true } },
            {
                name: "heatPumpLockout",
                label: "Heat Pump Lockout",
                type: "unit",
                options: { default: 30, min: 20, max: 60 },
            },
            {
                name: "coolingPeakOffset",
                label: "Cooling Peak Offset",
                type: "unit",
                options: { default: 0.5, min: 0.5, max: 4 },
            },
            {
                name: "heatingPeakOffset",
                label: "Heating Peak Offset",
                type: "unit",
                options: { default: -0.5, min: -4, max: -0.5 },
            },
            {
                name: "peakLoadExclude",
                label: "Peak Load Exclude",
                type: "unit",
                options: { default: false },
            },
            {
                name: "economizerSetpoint",
                label: "Economizer Setpoint",
                type: "unit",
                options: { default: 45, min: 45, max: 70 },
            },
        ]);
        this.Setpoint = this.parseStrict("setpoint");
        this.SetpointType = this.parseStrict("setpoint");
        this.Deadband = this.parseStrict("deadband");
        this.DeadbandType = this.parseStrict("deadband");
        this.Heating = this.parseStrict("heating");
        this.HeatingType = this.parseStrict("heating");
        this.Cooling = this.parseStrict("cooling");
        this.CoolingType = this.parseStrict("cooling");
        this.StartTime = this.parseStrict("startTime");
        this.StartTimeType = this.parseStrict("startTime");
        this.EndTime = this.parseStrict("endTime");
        this.EndTimeType = this.parseStrict("endTime");
        this.Occupied = this.parseStrict("occupied");
        this.OccupiedType = this.parseStrict("occupied");
        this.CoolingCapacity = this.parseStrict("coolingCapacity");
        this.CoolingCapacityType = this.parseStrict("coolingCapacity");
        this.Compressors = this.parseStrict("compressors");
        this.CompressorsType = this.parseStrict("compressors");
        this.CoolingLockout = this.parseStrict("coolingLockout");
        this.CoolingLockoutType = this.parseStrict("coolingLockout");
        this.OptimalStartLockout = this.parseStrict("optimalStartLockout");
        this.OptimalStartLockoutType = this.parseStrict("optimalStartLockout");
        this.OptimalStartDeviation = this.parseStrict("optimalStartDeviation");
        this.OptimalStartDeviationType = this.parseStrict("optimalStartDeviation");
        this.EarliestStart = this.parseStrict("earliestStart");
        this.EarliestStartType = this.parseStrict("earliestStart");
        this.LatestStart = this.parseStrict("latestStart");
        this.LatestStartType = this.parseStrict("latestStart");
        this.ZoneLocation = this.parseStrict("zoneLocation");
        this.ZoneLocationType = this.parseStrict("zoneLocation");
        this.ZoneMass = this.parseStrict("zoneMass");
        this.ZoneMassType = this.parseStrict("zoneMass");
        this.ZoneOrientation = this.parseStrict("zoneOrientation");
        this.ZoneOrientationType = this.parseStrict("zoneOrientation");
        this.ZoneBuilding = this.parseStrict("zoneBuilding");
        this.ZoneBuildingType = this.parseStrict("zoneBuilding");
        this.HeatPump = this.parseStrict("heatPump");
        this.HeatPumpType = this.parseStrict("heatPump");
        this.HeatPumpBackup = this.parseStrict("heatPumpBackup");
        this.HeatPumpBackupType = this.parseStrict("heatPumpBackup");
        this.Economizer = this.parseStrict("economizer");
        this.EconomizerType = this.parseStrict("economizer");
        this.HeatPumpLockout = this.parseStrict("heatPumpLockout");
        this.HeatPumpLockoutType = this.parseStrict("heatPumpLockout");
        this.CoolingPeakOffset = this.parseStrict("coolingPeakOffset");
        this.CoolingPeakOffsetType = this.parseStrict("coolingPeakOffset");
        this.HeatingPeakOffset = this.parseStrict("heatingPeakOffset");
        this.HeatingPeakOffsetType = this.parseStrict("heatingPeakOffset");
        this.PeakLoadExclude = this.parseStrict("peakLoadExclude");
        this.PeakLoadExcludeType = this.parseStrict("peakLoadExclude");
        this.EconomizerSetpoint = this.parseStrict("economizerSetpoint");
        this.EconomizerSetpointType = this.parseStrict("economizerSetpoint");
    }
}
const validate = new Validate();
exports.default = validate;
//# sourceMappingURL=validate.js.map