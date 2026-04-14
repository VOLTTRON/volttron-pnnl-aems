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
    WeatherMetric["AirPressure"] = "air_pressure";
    WeatherMetric["AirPressureAtMeanSeaLevel"] = "air_pressure_at_mean_sea_level";
    WeatherMetric["AirTemperature"] = "air_temperature";
    WeatherMetric["DewPointTemperature"] = "dew_point_temperature";
    WeatherMetric["HeatIndex"] = "heatIndex";
    WeatherMetric["HeightAboveMeanSeaLevel"] = "height_above_mean_sea_level";
    WeatherMetric["PrecipitationLast3Hours"] = "precipitationLast3Hours";
    WeatherMetric["PrecipitationLastHour"] = "precipitationLastHour";
    WeatherMetric["RelativeHumidity"] = "relative_humidity";
    WeatherMetric["VisibilityInAir"] = "visibility_in_air";
    WeatherMetric["WindFromDirection"] = "wind_from_direction";
    WeatherMetric["WindSpeed"] = "wind_speed";
    WeatherMetric["WindSpeedOfGust"] = "wind_speed_of_gust";
    WeatherMetric["WindChill"] = "windChill";
})(WeatherMetric || (exports.WeatherMetric = WeatherMetric = {}));
var MeterMetric;
(function (MeterMetric) {
    MeterMetric["Power"] = "WholeBuildingPower";
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