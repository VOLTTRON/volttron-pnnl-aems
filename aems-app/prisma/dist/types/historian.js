"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculationType = exports.AggregationType = exports.MeterMetric = exports.WeatherMetric = exports.UnitMetric = void 0;
var UnitMetric;
(function (UnitMetric) {
    UnitMetric["AuxiliaryHeatCommand"] = "AuxiliaryHeatCommand";
    UnitMetric["CoolingDemand"] = "CoolingDemand";
    UnitMetric["DeadBand"] = "DeadBand";
    UnitMetric["DemandResponseFlag"] = "DemandResponseFlag";
    UnitMetric["EffectiveZoneTemperatureSetPoint"] = "EffectiveZoneTemperatureSetPoint";
    UnitMetric["FirstStageCooling"] = "FirstStageCooling";
    UnitMetric["FirstStageHeating"] = "FirstStageHeating";
    UnitMetric["HeartBeat"] = "HeartBeat";
    UnitMetric["HeatingDemand"] = "HeatingDemand";
    UnitMetric["OccupancyCommand"] = "OccupancyCommand";
    UnitMetric["OccupiedCoolingSetPoint"] = "OccupiedCoolingSetPoint";
    UnitMetric["OccupiedHeatingSetPoint"] = "OccupiedHeatingSetPoint";
    UnitMetric["OccupiedSetPoint"] = "OccupiedSetPoint";
    UnitMetric["OutdoorAirTemperature"] = "OutdoorAirTemperature";
    UnitMetric["ReversingValve"] = "ReversingValve";
    UnitMetric["SecondStageCooling"] = "SecondStageCooling";
    UnitMetric["SupplyFanStatus"] = "SupplyFanStatus";
    UnitMetric["UnoccupiedCoolingSetPoint"] = "UnoccupiedCoolingSetPoint";
    UnitMetric["UnoccupiedHeatingSetPoint"] = "UnoccupiedHeatingSetPoint";
    UnitMetric["ZoneHumidity"] = "ZoneHumidity";
    UnitMetric["ZoneTemperature"] = "ZoneTemperature";
})(UnitMetric || (exports.UnitMetric = UnitMetric = {}));
var WeatherMetric;
(function (WeatherMetric) {
    WeatherMetric["AirPressure"] = "AirPressure";
    WeatherMetric["AirPressureAtMeanSeaLevel"] = "AirPressureAtMeanSeaLevel";
    WeatherMetric["AirTemperature"] = "AirTemperature";
    WeatherMetric["DewPointTemperature"] = "DewPointTemperature";
    WeatherMetric["HeatIndex"] = "HeatIndex";
    WeatherMetric["HeightAboveMeanSeaLevel"] = "HeightAboveMeanSeaLevel";
    WeatherMetric["PrecipitationLast3Hours"] = "PrecipitationLast3Hours";
    WeatherMetric["PrecipitationLastHour"] = "PrecipitationLastHour";
    WeatherMetric["RelativeHumidity"] = "RelativeHumidity";
    WeatherMetric["VisibilityInAir"] = "VisibilityInAir";
    WeatherMetric["WindFromDirection"] = "WindFromDirection";
    WeatherMetric["WindSpeed"] = "WindSpeed";
    WeatherMetric["WindSpeedOfGust"] = "WindSpeedOfGust";
    WeatherMetric["WindChill"] = "WindChill";
})(WeatherMetric || (exports.WeatherMetric = WeatherMetric = {}));
var MeterMetric;
(function (MeterMetric) {
    MeterMetric["Power"] = "Power";
    MeterMetric["Demand"] = "Demand";
})(MeterMetric || (exports.MeterMetric = MeterMetric = {}));
var AggregationType;
(function (AggregationType) {
    AggregationType["Sum"] = "Sum";
    AggregationType["Avg"] = "Avg";
    AggregationType["Max"] = "Max";
    AggregationType["Min"] = "Min";
    AggregationType["Count"] = "Count";
})(AggregationType || (exports.AggregationType = AggregationType = {}));
var CalculationType;
(function (CalculationType) {
    CalculationType["SetpointError"] = "SetpointError";
    CalculationType["RollingAverage"] = "RollingAverage";
})(CalculationType || (exports.CalculationType = CalculationType = {}));
//# sourceMappingURL=historian.js.map