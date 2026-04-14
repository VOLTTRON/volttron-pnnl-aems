"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterMetricInfo = exports.WeatherMetricInfo = exports.UnitMetricInfo = exports.MeterMetric = exports.WeatherMetric = exports.UnitMetric = void 0;
exports.getMetricTopicName = getMetricTopicName;
exports.buildUnitTopicPath = buildUnitTopicPath;
exports.buildWeatherTopicPath = buildWeatherTopicPath;
exports.buildMeterTopicPath = buildMeterTopicPath;
const prisma_1 = require("@local/prisma");
var prisma_2 = require("@local/prisma");
Object.defineProperty(exports, "UnitMetric", { enumerable: true, get: function () { return prisma_2.UnitMetric; } });
Object.defineProperty(exports, "WeatherMetric", { enumerable: true, get: function () { return prisma_2.WeatherMetric; } });
Object.defineProperty(exports, "MeterMetric", { enumerable: true, get: function () { return prisma_2.MeterMetric; } });
exports.UnitMetricInfo = {
    [prisma_1.UnitMetric.AuxiliaryHeatCommand]: {
        topic: prisma_1.UnitMetric.AuxiliaryHeatCommand,
        category: "unit",
        description: "Auxiliary heat command status",
    },
    [prisma_1.UnitMetric.CoolingDemand]: {
        topic: prisma_1.UnitMetric.CoolingDemand,
        category: "unit",
        description: "Cooling demand percentage",
        unit: "%",
    },
    [prisma_1.UnitMetric.DeadBand]: {
        topic: prisma_1.UnitMetric.DeadBand,
        category: "unit",
        description: "Temperature dead band",
        unit: "°F",
    },
    [prisma_1.UnitMetric.DemandResponseFlag]: {
        topic: prisma_1.UnitMetric.DemandResponseFlag,
        category: "unit",
        description: "Demand response flag status",
    },
    [prisma_1.UnitMetric.EffectiveZoneTemperatureSetPoint]: {
        topic: prisma_1.UnitMetric.EffectiveZoneTemperatureSetPoint,
        category: "unit",
        description: "Effective zone temperature setpoint",
        unit: "°F",
    },
    [prisma_1.UnitMetric.FirstStageCooling]: {
        topic: prisma_1.UnitMetric.FirstStageCooling,
        category: "unit",
        description: "First stage cooling status",
    },
    [prisma_1.UnitMetric.FirstStageHeating]: {
        topic: prisma_1.UnitMetric.FirstStageHeating,
        category: "unit",
        description: "First stage heating status",
    },
    [prisma_1.UnitMetric.HeartBeat]: {
        topic: prisma_1.UnitMetric.HeartBeat,
        category: "unit",
        description: "System heartbeat indicator",
    },
    [prisma_1.UnitMetric.HeatingDemand]: {
        topic: prisma_1.UnitMetric.HeatingDemand,
        category: "unit",
        description: "Heating demand percentage",
        unit: "%",
    },
    [prisma_1.UnitMetric.OccupancyCommand]: {
        topic: prisma_1.UnitMetric.OccupancyCommand,
        category: "unit",
        description: "Occupancy command status",
    },
    [prisma_1.UnitMetric.OccupiedCoolingSetPoint]: {
        topic: prisma_1.UnitMetric.OccupiedCoolingSetPoint,
        category: "unit",
        description: "Occupied cooling setpoint",
        unit: "°F",
    },
    [prisma_1.UnitMetric.OccupiedHeatingSetPoint]: {
        topic: prisma_1.UnitMetric.OccupiedHeatingSetPoint,
        category: "unit",
        description: "Occupied heating setpoint",
        unit: "°F",
    },
    [prisma_1.UnitMetric.OccupiedSetPoint]: {
        topic: prisma_1.UnitMetric.OccupiedSetPoint,
        category: "unit",
        description: "Occupied setpoint",
        unit: "°F",
    },
    [prisma_1.UnitMetric.OutdoorAirTemperature]: {
        topic: prisma_1.UnitMetric.OutdoorAirTemperature,
        category: "unit",
        description: "Outdoor air temperature",
        unit: "°F",
    },
    [prisma_1.UnitMetric.ReversingValve]: {
        topic: prisma_1.UnitMetric.ReversingValve,
        category: "unit",
        description: "Reversing valve status",
    },
    [prisma_1.UnitMetric.SecondStageCooling]: {
        topic: prisma_1.UnitMetric.SecondStageCooling,
        category: "unit",
        description: "Second stage cooling status",
    },
    [prisma_1.UnitMetric.SupplyFanStatus]: {
        topic: prisma_1.UnitMetric.SupplyFanStatus,
        category: "unit",
        description: "Supply fan status",
    },
    [prisma_1.UnitMetric.UnoccupiedCoolingSetPoint]: {
        topic: prisma_1.UnitMetric.UnoccupiedCoolingSetPoint,
        category: "unit",
        description: "Unoccupied cooling setpoint",
        unit: "°F",
    },
    [prisma_1.UnitMetric.UnoccupiedHeatingSetPoint]: {
        topic: prisma_1.UnitMetric.UnoccupiedHeatingSetPoint,
        category: "unit",
        description: "Unoccupied heating setpoint",
        unit: "°F",
    },
    [prisma_1.UnitMetric.ZoneHumidity]: {
        topic: prisma_1.UnitMetric.ZoneHumidity,
        category: "unit",
        description: "Zone relative humidity",
        unit: "%",
    },
    [prisma_1.UnitMetric.ZoneTemperature]: {
        topic: prisma_1.UnitMetric.ZoneTemperature,
        category: "unit",
        description: "Zone temperature",
        unit: "°F",
    },
};
exports.WeatherMetricInfo = {
    [prisma_1.WeatherMetric.AirPressure]: {
        topic: prisma_1.WeatherMetric.AirPressure,
        category: "weather",
        description: "Air pressure",
        unit: "Pa",
    },
    [prisma_1.WeatherMetric.AirPressureAtMeanSeaLevel]: {
        topic: prisma_1.WeatherMetric.AirPressureAtMeanSeaLevel,
        category: "weather",
        description: "Air pressure at mean sea level",
        unit: "Pa",
    },
    [prisma_1.WeatherMetric.AirTemperature]: {
        topic: prisma_1.WeatherMetric.AirTemperature,
        category: "weather",
        description: "Air temperature",
        unit: "°F",
    },
    [prisma_1.WeatherMetric.DewPointTemperature]: {
        topic: prisma_1.WeatherMetric.DewPointTemperature,
        category: "weather",
        description: "Dew point temperature",
        unit: "°F",
    },
    [prisma_1.WeatherMetric.HeatIndex]: {
        topic: prisma_1.WeatherMetric.HeatIndex,
        category: "weather",
        description: "Heat index",
        unit: "°F",
    },
    [prisma_1.WeatherMetric.HeightAboveMeanSeaLevel]: {
        topic: prisma_1.WeatherMetric.HeightAboveMeanSeaLevel,
        category: "weather",
        description: "Height above mean sea level",
        unit: "m",
    },
    [prisma_1.WeatherMetric.PrecipitationLast3Hours]: {
        topic: prisma_1.WeatherMetric.PrecipitationLast3Hours,
        category: "weather",
        description: "Precipitation in last 3 hours",
        unit: "in",
    },
    [prisma_1.WeatherMetric.PrecipitationLastHour]: {
        topic: prisma_1.WeatherMetric.PrecipitationLastHour,
        category: "weather",
        description: "Precipitation in last hour",
        unit: "in",
    },
    [prisma_1.WeatherMetric.RelativeHumidity]: {
        topic: prisma_1.WeatherMetric.RelativeHumidity,
        category: "weather",
        description: "Relative humidity",
        unit: "%",
    },
    [prisma_1.WeatherMetric.VisibilityInAir]: {
        topic: prisma_1.WeatherMetric.VisibilityInAir,
        category: "weather",
        description: "Visibility in air",
        unit: "m",
    },
    [prisma_1.WeatherMetric.WindFromDirection]: {
        topic: prisma_1.WeatherMetric.WindFromDirection,
        category: "weather",
        description: "Wind direction",
        unit: "°",
    },
    [prisma_1.WeatherMetric.WindSpeed]: {
        topic: prisma_1.WeatherMetric.WindSpeed,
        category: "weather",
        description: "Wind speed",
        unit: "mph",
    },
    [prisma_1.WeatherMetric.WindSpeedOfGust]: {
        topic: prisma_1.WeatherMetric.WindSpeedOfGust,
        category: "weather",
        description: "Wind gust speed",
        unit: "mph",
    },
    [prisma_1.WeatherMetric.WindChill]: {
        topic: prisma_1.WeatherMetric.WindChill,
        category: "weather",
        description: "Wind chill",
        unit: "°F",
    },
};
exports.MeterMetricInfo = {
    [prisma_1.MeterMetric.Power]: {
        topic: prisma_1.MeterMetric.Power,
        category: "meter",
        description: "Whole building power consumption",
        unit: "W",
    },
    [prisma_1.MeterMetric.Demand]: {
        topic: prisma_1.MeterMetric.Demand,
        category: "meter",
        description: "Whole building power demand",
        unit: "W",
    },
};
function getMetricTopicName(metric) {
    if (Object.values(prisma_1.UnitMetric).includes(metric)) {
        return exports.UnitMetricInfo[metric].topic;
    }
    if (Object.values(prisma_1.WeatherMetric).includes(metric)) {
        return exports.WeatherMetricInfo[metric].topic;
    }
    return exports.MeterMetricInfo[metric].topic;
}
function buildUnitTopicPath(campus, building, system, metric) {
    const topic = exports.UnitMetricInfo[metric].topic;
    return `${campus}/${building}/${system}/${topic}`;
}
function buildWeatherTopicPath(campus, building, metric) {
    const topic = exports.WeatherMetricInfo[metric].topic;
    return `${campus}/${building}/weather/${topic}`;
}
function buildMeterTopicPath(campus, building, metric) {
    const topic = exports.MeterMetricInfo[metric].topic;
    return `${campus}/${building}/meter/${topic}`;
}
//# sourceMappingURL=metrics.js.map