"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricFormat = exports.MetricTransform = exports.CalculationType = exports.MetricAggregation = exports.AggregationType = exports.MeterMetric = exports.WeatherMetric = exports.UnitMetric = void 0;
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
var MetricAggregation;
(function (MetricAggregation) {
    MetricAggregation["Min"] = "min";
    MetricAggregation["Max"] = "max";
    MetricAggregation["Mean"] = "mean";
    MetricAggregation["Mode"] = "mode";
    MetricAggregation["Median"] = "median";
    MetricAggregation["Sum"] = "sum";
    MetricAggregation["Count"] = "count";
    MetricAggregation["First"] = "first";
    MetricAggregation["Last"] = "last";
})(MetricAggregation || (exports.MetricAggregation = MetricAggregation = {}));
var CalculationType;
(function (CalculationType) {
    CalculationType["SetpointError"] = "SetpointError";
    CalculationType["RollingAverage"] = "RollingAverage";
})(CalculationType || (exports.CalculationType = CalculationType = {}));
var MetricTransform;
(function (MetricTransform) {
    MetricTransform["None"] = "none";
    MetricTransform["Integer"] = "integer";
    MetricTransform["Decimal1"] = "decimal1";
    MetricTransform["Decimal2"] = "decimal2";
    MetricTransform["Decimal3"] = "decimal3";
    MetricTransform["Floor"] = "floor";
    MetricTransform["Ceiling"] = "ceiling";
})(MetricTransform || (exports.MetricTransform = MetricTransform = {}));
var MetricFormat;
(function (MetricFormat) {
    MetricFormat["None"] = "none";
    MetricFormat["Thousands"] = "thousands";
    MetricFormat["Compact"] = "compact";
    MetricFormat["Scientific"] = "scientific";
})(MetricFormat || (exports.MetricFormat = MetricFormat = {}));
//# sourceMappingURL=historian.js.map