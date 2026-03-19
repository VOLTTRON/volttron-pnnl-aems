"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherMetricInfo = exports.UnitMetricInfo = exports.WeatherMetric = exports.UnitMetric = void 0;
exports.getMetricTopicName = getMetricTopicName;
exports.buildUnitTopicPath = buildUnitTopicPath;
exports.buildWeatherTopicPath = buildWeatherTopicPath;
var prisma_1 = require("@local/prisma");
Object.defineProperty(exports, "UnitMetric", { enumerable: true, get: function () { return prisma_1.UnitMetric; } });
Object.defineProperty(exports, "WeatherMetric", { enumerable: true, get: function () { return prisma_1.WeatherMetric; } });
const prisma_2 = require("@local/prisma");
exports.UnitMetricInfo = {
    [prisma_2.UnitMetric.AuxiliaryHeatCommand]: {
        topic: prisma_2.UnitMetric.AuxiliaryHeatCommand,
        category: "unit",
        description: "Auxiliary heat command status",
    },
    [prisma_2.UnitMetric.CoolingDemand]: {
        topic: prisma_2.UnitMetric.CoolingDemand,
        category: "unit",
        description: "Cooling demand percentage",
        unit: "%",
    },
    [prisma_2.UnitMetric.DemandResponseFlag]: {
        topic: prisma_2.UnitMetric.DemandResponseFlag,
        category: "unit",
        description: "Demand response flag status",
    },
    [prisma_2.UnitMetric.EffectiveZoneTemperatureSetPoint]: {
        topic: prisma_2.UnitMetric.EffectiveZoneTemperatureSetPoint,
        category: "unit",
        description: "Effective zone temperature setpoint",
        unit: "°F",
    },
    [prisma_2.UnitMetric.FirstStageCooling]: {
        topic: prisma_2.UnitMetric.FirstStageCooling,
        category: "unit",
        description: "First stage cooling status",
    },
    [prisma_2.UnitMetric.FirstStageHeating]: {
        topic: prisma_2.UnitMetric.FirstStageHeating,
        category: "unit",
        description: "First stage heating status",
    },
    [prisma_2.UnitMetric.HeartBeat]: {
        topic: prisma_2.UnitMetric.HeartBeat,
        category: "unit",
        description: "System heartbeat indicator",
    },
    [prisma_2.UnitMetric.HeatingDemand]: {
        topic: prisma_2.UnitMetric.HeatingDemand,
        category: "unit",
        description: "Heating demand percentage",
        unit: "%",
    },
    [prisma_2.UnitMetric.OccupancyCommand]: {
        topic: prisma_2.UnitMetric.OccupancyCommand,
        category: "unit",
        description: "Occupancy command status",
    },
    [prisma_2.UnitMetric.OccupiedCoolingSetPoint]: {
        topic: prisma_2.UnitMetric.OccupiedCoolingSetPoint,
        category: "unit",
        description: "Occupied cooling setpoint",
        unit: "°F",
    },
    [prisma_2.UnitMetric.OccupiedHeatingSetPoint]: {
        topic: prisma_2.UnitMetric.OccupiedHeatingSetPoint,
        category: "unit",
        description: "Occupied heating setpoint",
        unit: "°F",
    },
    [prisma_2.UnitMetric.ReversingValve]: {
        topic: prisma_2.UnitMetric.ReversingValve,
        category: "unit",
        description: "Reversing valve status",
    },
    [prisma_2.UnitMetric.SecondStageCooling]: {
        topic: prisma_2.UnitMetric.SecondStageCooling,
        category: "unit",
        description: "Second stage cooling status",
    },
    [prisma_2.UnitMetric.SupplyFanStatus]: {
        topic: prisma_2.UnitMetric.SupplyFanStatus,
        category: "unit",
        description: "Supply fan status",
    },
    [prisma_2.UnitMetric.UnoccupiedCoolingSetPoint]: {
        topic: prisma_2.UnitMetric.UnoccupiedCoolingSetPoint,
        category: "unit",
        description: "Unoccupied cooling setpoint",
        unit: "°F",
    },
    [prisma_2.UnitMetric.UnoccupiedHeatingSetPoint]: {
        topic: prisma_2.UnitMetric.UnoccupiedHeatingSetPoint,
        category: "unit",
        description: "Unoccupied heating setpoint",
        unit: "°F",
    },
    [prisma_2.UnitMetric.ZoneHumidity]: {
        topic: prisma_2.UnitMetric.ZoneHumidity,
        category: "unit",
        description: "Zone relative humidity",
        unit: "%",
    },
    [prisma_2.UnitMetric.ZoneTemperature]: {
        topic: prisma_2.UnitMetric.ZoneTemperature,
        category: "unit",
        description: "Zone temperature",
        unit: "°F",
    },
};
exports.WeatherMetricInfo = {
    [prisma_2.WeatherMetric.AirPressure]: {
        topic: prisma_2.WeatherMetric.AirPressure,
        category: "weather",
        description: "Air pressure",
        unit: "Pa",
    },
    [prisma_2.WeatherMetric.AirPressureAtMeanSeaLevel]: {
        topic: prisma_2.WeatherMetric.AirPressureAtMeanSeaLevel,
        category: "weather",
        description: "Air pressure at mean sea level",
        unit: "Pa",
    },
    [prisma_2.WeatherMetric.AirTemperature]: {
        topic: prisma_2.WeatherMetric.AirTemperature,
        category: "weather",
        description: "Air temperature",
        unit: "°F",
    },
    [prisma_2.WeatherMetric.DewPointTemperature]: {
        topic: prisma_2.WeatherMetric.DewPointTemperature,
        category: "weather",
        description: "Dew point temperature",
        unit: "°F",
    },
    [prisma_2.WeatherMetric.HeatIndex]: {
        topic: prisma_2.WeatherMetric.HeatIndex,
        category: "weather",
        description: "Heat index",
        unit: "°F",
    },
    [prisma_2.WeatherMetric.HeightAboveMeanSeaLevel]: {
        topic: prisma_2.WeatherMetric.HeightAboveMeanSeaLevel,
        category: "weather",
        description: "Height above mean sea level",
        unit: "m",
    },
    [prisma_2.WeatherMetric.PrecipitationLast3Hours]: {
        topic: prisma_2.WeatherMetric.PrecipitationLast3Hours,
        category: "weather",
        description: "Precipitation in last 3 hours",
        unit: "in",
    },
    [prisma_2.WeatherMetric.PrecipitationLastHour]: {
        topic: prisma_2.WeatherMetric.PrecipitationLastHour,
        category: "weather",
        description: "Precipitation in last hour",
        unit: "in",
    },
    [prisma_2.WeatherMetric.RelativeHumidity]: {
        topic: prisma_2.WeatherMetric.RelativeHumidity,
        category: "weather",
        description: "Relative humidity",
        unit: "%",
    },
    [prisma_2.WeatherMetric.VisibilityInAir]: {
        topic: prisma_2.WeatherMetric.VisibilityInAir,
        category: "weather",
        description: "Visibility in air",
        unit: "m",
    },
    [prisma_2.WeatherMetric.WindFromDirection]: {
        topic: prisma_2.WeatherMetric.WindFromDirection,
        category: "weather",
        description: "Wind direction",
        unit: "°",
    },
    [prisma_2.WeatherMetric.WindSpeed]: {
        topic: prisma_2.WeatherMetric.WindSpeed,
        category: "weather",
        description: "Wind speed",
        unit: "mph",
    },
    [prisma_2.WeatherMetric.WindSpeedOfGust]: {
        topic: prisma_2.WeatherMetric.WindSpeedOfGust,
        category: "weather",
        description: "Wind gust speed",
        unit: "mph",
    },
    [prisma_2.WeatherMetric.WindChill]: {
        topic: prisma_2.WeatherMetric.WindChill,
        category: "weather",
        description: "Wind chill",
        unit: "°F",
    },
};
function getMetricTopicName(metric) {
    if (Object.values(prisma_2.UnitMetric).includes(metric)) {
        return exports.UnitMetricInfo[metric].topic;
    }
    return exports.WeatherMetricInfo[metric].topic;
}
function buildUnitTopicPath(campus, building, system, metric) {
    const topic = exports.UnitMetricInfo[metric].topic;
    return `${campus}/${building}/${system}/${topic}`;
}
function buildWeatherTopicPath(campus, building, metric) {
    const topic = exports.WeatherMetricInfo[metric].topic;
    return `${campus}/${building}/weather/${topic}`;
}
//# sourceMappingURL=metrics.js.map