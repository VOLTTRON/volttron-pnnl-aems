"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterMetricInfo = exports.WeatherMetricInfo = exports.DefaultMeterMetricMappings = exports.DefaultWeatherMetricMappings = exports.UnitMetricInfo = exports.DefaultTopicTemplates = void 0;
exports.getMetricTopicName = getMetricTopicName;
exports.generateDefaultTopicMapConfig = generateDefaultTopicMapConfig;
exports.buildUnitTopicPath = buildUnitTopicPath;
exports.buildWeatherTopicPath = buildWeatherTopicPath;
exports.buildMeterTopicPath = buildMeterTopicPath;
const common_1 = require("@local/common");
exports.DefaultTopicTemplates = {
    Unit: "{campus}/{building}/{system}/{metric}",
    Weather: "{campus}/{building}/weather/{metric}",
    Meter: "{campus}/{building}/meter/{metric}",
};
exports.UnitMetricInfo = {
    [common_1.UnitMetric.AuxiliaryHeatCommand]: {
        topic: common_1.UnitMetric.AuxiliaryHeatCommand,
        category: "unit",
        description: "Auxiliary heat command status",
    },
    [common_1.UnitMetric.CoolingDemand]: {
        topic: common_1.UnitMetric.CoolingDemand,
        category: "unit",
        description: "Cooling demand percentage",
        unit: "%",
    },
    [common_1.UnitMetric.DeadBand]: {
        topic: common_1.UnitMetric.DeadBand,
        category: "unit",
        description: "Temperature dead band",
        unit: "°F",
    },
    [common_1.UnitMetric.DemandResponseFlag]: {
        topic: common_1.UnitMetric.DemandResponseFlag,
        category: "unit",
        description: "Demand response flag status",
    },
    [common_1.UnitMetric.EffectiveZoneTemperatureSetPoint]: {
        topic: common_1.UnitMetric.EffectiveZoneTemperatureSetPoint,
        category: "unit",
        description: "Effective zone temperature setpoint",
        unit: "°F",
    },
    [common_1.UnitMetric.FirstStageCooling]: {
        topic: common_1.UnitMetric.FirstStageCooling,
        category: "unit",
        description: "First stage cooling status",
    },
    [common_1.UnitMetric.FirstStageHeating]: {
        topic: common_1.UnitMetric.FirstStageHeating,
        category: "unit",
        description: "First stage heating status",
    },
    [common_1.UnitMetric.HeartBeat]: {
        topic: common_1.UnitMetric.HeartBeat,
        category: "unit",
        description: "System heartbeat indicator",
    },
    [common_1.UnitMetric.HeatingDemand]: {
        topic: common_1.UnitMetric.HeatingDemand,
        category: "unit",
        description: "Heating demand percentage",
        unit: "%",
    },
    [common_1.UnitMetric.OccupancyCommand]: {
        topic: common_1.UnitMetric.OccupancyCommand,
        category: "unit",
        description: "Occupancy command status",
    },
    [common_1.UnitMetric.OccupiedCoolingSetPoint]: {
        topic: common_1.UnitMetric.OccupiedCoolingSetPoint,
        category: "unit",
        description: "Occupied cooling setpoint",
        unit: "°F",
    },
    [common_1.UnitMetric.OccupiedHeatingSetPoint]: {
        topic: common_1.UnitMetric.OccupiedHeatingSetPoint,
        category: "unit",
        description: "Occupied heating setpoint",
        unit: "°F",
    },
    [common_1.UnitMetric.OccupiedSetPoint]: {
        topic: common_1.UnitMetric.OccupiedSetPoint,
        category: "unit",
        description: "Occupied setpoint",
        unit: "°F",
    },
    [common_1.UnitMetric.OutdoorAirTemperature]: {
        topic: common_1.UnitMetric.OutdoorAirTemperature,
        category: "unit",
        description: "Outdoor air temperature",
        unit: "°F",
    },
    [common_1.UnitMetric.ReversingValve]: {
        topic: common_1.UnitMetric.ReversingValve,
        category: "unit",
        description: "Reversing valve status",
    },
    [common_1.UnitMetric.SecondStageCooling]: {
        topic: common_1.UnitMetric.SecondStageCooling,
        category: "unit",
        description: "Second stage cooling status",
    },
    [common_1.UnitMetric.SupplyFanStatus]: {
        topic: common_1.UnitMetric.SupplyFanStatus,
        category: "unit",
        description: "Supply fan status",
    },
    [common_1.UnitMetric.UnoccupiedCoolingSetPoint]: {
        topic: common_1.UnitMetric.UnoccupiedCoolingSetPoint,
        category: "unit",
        description: "Unoccupied cooling setpoint",
        unit: "°F",
    },
    [common_1.UnitMetric.UnoccupiedHeatingSetPoint]: {
        topic: common_1.UnitMetric.UnoccupiedHeatingSetPoint,
        category: "unit",
        description: "Unoccupied heating setpoint",
        unit: "°F",
    },
    [common_1.UnitMetric.ZoneHumidity]: {
        topic: common_1.UnitMetric.ZoneHumidity,
        category: "unit",
        description: "Zone relative humidity",
        unit: "%",
    },
    [common_1.UnitMetric.ZoneTemperature]: {
        topic: common_1.UnitMetric.ZoneTemperature,
        category: "unit",
        description: "Zone temperature",
        unit: "°F",
    },
};
exports.DefaultWeatherMetricMappings = {
    [common_1.WeatherMetric.AirPressure]: "air_pressure",
    [common_1.WeatherMetric.AirPressureAtMeanSeaLevel]: "air_pressure_at_mean_sea_level",
    [common_1.WeatherMetric.AirTemperature]: "air_temperature",
    [common_1.WeatherMetric.DewPointTemperature]: "dew_point_temperature",
    [common_1.WeatherMetric.HeatIndex]: "heatIndex",
    [common_1.WeatherMetric.HeightAboveMeanSeaLevel]: "height_above_mean_sea_level",
    [common_1.WeatherMetric.PrecipitationLast3Hours]: "precipitationLast3Hours",
    [common_1.WeatherMetric.PrecipitationLastHour]: "precipitationLastHour",
    [common_1.WeatherMetric.RelativeHumidity]: "relative_humidity",
    [common_1.WeatherMetric.VisibilityInAir]: "visibility_in_air",
    [common_1.WeatherMetric.WindFromDirection]: "wind_from_direction",
    [common_1.WeatherMetric.WindSpeed]: "wind_speed",
    [common_1.WeatherMetric.WindSpeedOfGust]: "wind_speed_of_gust",
    [common_1.WeatherMetric.WindChill]: "windChill",
};
exports.DefaultMeterMetricMappings = {
    [common_1.MeterMetric.Power]: "WholeBuildingPower",
    [common_1.MeterMetric.Demand]: "Demand",
};
exports.WeatherMetricInfo = {
    [common_1.WeatherMetric.AirPressure]: {
        topic: common_1.WeatherMetric.AirPressure,
        category: "weather",
        description: "Air pressure",
        unit: "Pa",
    },
    [common_1.WeatherMetric.AirPressureAtMeanSeaLevel]: {
        topic: common_1.WeatherMetric.AirPressureAtMeanSeaLevel,
        category: "weather",
        description: "Air pressure at mean sea level",
        unit: "Pa",
    },
    [common_1.WeatherMetric.AirTemperature]: {
        topic: common_1.WeatherMetric.AirTemperature,
        category: "weather",
        description: "Air temperature",
        unit: "°F",
    },
    [common_1.WeatherMetric.DewPointTemperature]: {
        topic: common_1.WeatherMetric.DewPointTemperature,
        category: "weather",
        description: "Dew point temperature",
        unit: "°F",
    },
    [common_1.WeatherMetric.HeatIndex]: {
        topic: common_1.WeatherMetric.HeatIndex,
        category: "weather",
        description: "Heat index",
        unit: "°F",
    },
    [common_1.WeatherMetric.HeightAboveMeanSeaLevel]: {
        topic: common_1.WeatherMetric.HeightAboveMeanSeaLevel,
        category: "weather",
        description: "Height above mean sea level",
        unit: "m",
    },
    [common_1.WeatherMetric.PrecipitationLast3Hours]: {
        topic: common_1.WeatherMetric.PrecipitationLast3Hours,
        category: "weather",
        description: "Precipitation in last 3 hours",
        unit: "in",
    },
    [common_1.WeatherMetric.PrecipitationLastHour]: {
        topic: common_1.WeatherMetric.PrecipitationLastHour,
        category: "weather",
        description: "Precipitation in last hour",
        unit: "in",
    },
    [common_1.WeatherMetric.RelativeHumidity]: {
        topic: common_1.WeatherMetric.RelativeHumidity,
        category: "weather",
        description: "Relative humidity",
        unit: "%",
    },
    [common_1.WeatherMetric.VisibilityInAir]: {
        topic: common_1.WeatherMetric.VisibilityInAir,
        category: "weather",
        description: "Visibility in air",
        unit: "m",
    },
    [common_1.WeatherMetric.WindFromDirection]: {
        topic: common_1.WeatherMetric.WindFromDirection,
        category: "weather",
        description: "Wind direction",
        unit: "°",
    },
    [common_1.WeatherMetric.WindSpeed]: {
        topic: common_1.WeatherMetric.WindSpeed,
        category: "weather",
        description: "Wind speed",
        unit: "mph",
    },
    [common_1.WeatherMetric.WindSpeedOfGust]: {
        topic: common_1.WeatherMetric.WindSpeedOfGust,
        category: "weather",
        description: "Wind gust speed",
        unit: "mph",
    },
    [common_1.WeatherMetric.WindChill]: {
        topic: common_1.WeatherMetric.WindChill,
        category: "weather",
        description: "Wind chill",
        unit: "°F",
    },
};
exports.MeterMetricInfo = {
    [common_1.MeterMetric.Power]: {
        topic: common_1.MeterMetric.Power,
        category: "meter",
        description: "Whole building power consumption",
        unit: "W",
    },
    [common_1.MeterMetric.Demand]: {
        topic: common_1.MeterMetric.Demand,
        category: "meter",
        description: "Whole building power demand",
        unit: "W",
    },
};
function getMetricTopicName(metric) {
    if (Object.values(common_1.UnitMetric).includes(metric)) {
        return exports.UnitMetricInfo[metric].topic;
    }
    if (Object.values(common_1.WeatherMetric).includes(metric)) {
        return exports.WeatherMetricInfo[metric].topic;
    }
    return exports.MeterMetricInfo[metric].topic;
}
function generateDefaultTopicMapConfig() {
    return {
        templates: {
            Unit: exports.DefaultTopicTemplates.Unit,
            Weather: exports.DefaultTopicTemplates.Weather,
            Meter: exports.DefaultTopicTemplates.Meter,
        },
        unitMetrics: Object.fromEntries(Object.values(common_1.UnitMetric).map((m) => [m, m])),
        weatherMetrics: { ...exports.DefaultWeatherMetricMappings },
        meterMetrics: { ...exports.DefaultMeterMetricMappings },
    };
}
function buildUnitTopicPath(campus, building, system, metric, topicMap) {
    const template = topicMap?.templates?.Unit ?? exports.DefaultTopicTemplates.Unit;
    const metricName = topicMap?.unitMetrics?.[metric] ?? metric;
    return template
        .replace("{campus}", campus)
        .replace("{building}", building)
        .replace("{system}", system)
        .replace("{metric}", metricName);
}
function buildWeatherTopicPath(campus, building, metric, topicMap) {
    const template = topicMap?.templates?.Weather ?? exports.DefaultTopicTemplates.Weather;
    const metricName = topicMap?.weatherMetrics?.[metric] ?? exports.DefaultWeatherMetricMappings[metric] ?? metric;
    return template
        .replace("{campus}", campus)
        .replace("{building}", building)
        .replace("{metric}", metricName);
}
function buildMeterTopicPath(campus, building, metric, topicMap) {
    const template = topicMap?.templates?.Meter ?? exports.DefaultTopicTemplates.Meter;
    const metricName = topicMap?.meterMetrics?.[metric] ?? exports.DefaultMeterMetricMappings[metric] ?? metric;
    return template
        .replace("{campus}", campus)
        .replace("{building}", building)
        .replace("{metric}", metricName);
}
//# sourceMappingURL=metrics.js.map