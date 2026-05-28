"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterMetricInfo = exports.WeatherMetricInfo = exports.DefaultMeterMetricPrefixes = exports.DefaultWeatherMetricPrefixes = exports.DefaultUnitMetricPrefixes = exports.DefaultMeterMetricSuffixes = exports.DefaultWeatherMetricSuffixes = exports.DefaultUnitMetricSuffixes = exports.DefaultMeterMetricFormats = exports.DefaultWeatherMetricFormats = exports.DefaultUnitMetricFormats = exports.DefaultMeterMetricTransforms = exports.DefaultWeatherMetricTransforms = exports.DefaultUnitMetricTransforms = exports.DefaultMetricFormat = exports.DefaultMetricTransform = exports.DefaultMeterMetricAggregations = exports.DefaultWeatherMetricAggregations = exports.DefaultUnitMetricAggregations = exports.DefaultMetricAggregation = exports.DefaultMeterMetricMappings = exports.DefaultWeatherMetricMappings = exports.UnitMetricInfo = exports.DefaultTopicTemplates = void 0;
exports.getMetricTopicName = getMetricTopicName;
exports.resolveUnitMetricEntry = resolveUnitMetricEntry;
exports.resolveWeatherMetricEntry = resolveWeatherMetricEntry;
exports.resolveMeterMetricEntry = resolveMeterMetricEntry;
exports.applyTransform = applyTransform;
exports.generateDefaultTopicMapConfig = generateDefaultTopicMapConfig;
exports.buildUnitTopicPath = buildUnitTopicPath;
exports.buildWeatherTopicPath = buildWeatherTopicPath;
exports.buildMeterTopicPath = buildMeterTopicPath;
exports.aggregationSql = aggregationSql;
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
exports.DefaultMetricAggregation = common_1.MetricAggregation.Mean;
exports.DefaultUnitMetricAggregations = {
    [common_1.UnitMetric.AuxiliaryHeatCommand]: common_1.MetricAggregation.Max,
    [common_1.UnitMetric.CoolingDemand]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.DeadBand]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.DemandResponseFlag]: common_1.MetricAggregation.Max,
    [common_1.UnitMetric.EffectiveZoneTemperatureSetPoint]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.FirstStageCooling]: common_1.MetricAggregation.Max,
    [common_1.UnitMetric.FirstStageHeating]: common_1.MetricAggregation.Max,
    [common_1.UnitMetric.HeartBeat]: common_1.MetricAggregation.Last,
    [common_1.UnitMetric.HeatingDemand]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.OccupancyCommand]: common_1.MetricAggregation.Max,
    [common_1.UnitMetric.OccupiedCoolingSetPoint]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.OccupiedHeatingSetPoint]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.OccupiedSetPoint]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.OutdoorAirTemperature]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.ReversingValve]: common_1.MetricAggregation.Max,
    [common_1.UnitMetric.SecondStageCooling]: common_1.MetricAggregation.Max,
    [common_1.UnitMetric.SupplyFanStatus]: common_1.MetricAggregation.Max,
    [common_1.UnitMetric.UnoccupiedCoolingSetPoint]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.UnoccupiedHeatingSetPoint]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.ZoneHumidity]: common_1.MetricAggregation.Mean,
    [common_1.UnitMetric.ZoneTemperature]: common_1.MetricAggregation.Mean,
};
exports.DefaultWeatherMetricAggregations = {
    [common_1.WeatherMetric.AirPressure]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.AirPressureAtMeanSeaLevel]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.AirTemperature]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.DewPointTemperature]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.HeatIndex]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.HeightAboveMeanSeaLevel]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.PrecipitationLast3Hours]: common_1.MetricAggregation.Last,
    [common_1.WeatherMetric.PrecipitationLastHour]: common_1.MetricAggregation.Last,
    [common_1.WeatherMetric.RelativeHumidity]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.VisibilityInAir]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.WindFromDirection]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.WindSpeed]: common_1.MetricAggregation.Mean,
    [common_1.WeatherMetric.WindSpeedOfGust]: common_1.MetricAggregation.Max,
    [common_1.WeatherMetric.WindChill]: common_1.MetricAggregation.Mean,
};
exports.DefaultMeterMetricAggregations = {
    [common_1.MeterMetric.Power]: common_1.MetricAggregation.Mean,
    [common_1.MeterMetric.Demand]: common_1.MetricAggregation.Max,
};
exports.DefaultMetricTransform = common_1.MetricTransform.None;
exports.DefaultMetricFormat = common_1.MetricFormat.None;
exports.DefaultUnitMetricTransforms = {
    [common_1.UnitMetric.AuxiliaryHeatCommand]: common_1.MetricTransform.Integer,
    [common_1.UnitMetric.CoolingDemand]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.DeadBand]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.DemandResponseFlag]: common_1.MetricTransform.Integer,
    [common_1.UnitMetric.EffectiveZoneTemperatureSetPoint]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.FirstStageCooling]: common_1.MetricTransform.Integer,
    [common_1.UnitMetric.FirstStageHeating]: common_1.MetricTransform.Integer,
    [common_1.UnitMetric.HeartBeat]: common_1.MetricTransform.Integer,
    [common_1.UnitMetric.HeatingDemand]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.OccupancyCommand]: common_1.MetricTransform.Integer,
    [common_1.UnitMetric.OccupiedCoolingSetPoint]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.OccupiedHeatingSetPoint]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.OccupiedSetPoint]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.OutdoorAirTemperature]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.ReversingValve]: common_1.MetricTransform.Integer,
    [common_1.UnitMetric.SecondStageCooling]: common_1.MetricTransform.Integer,
    [common_1.UnitMetric.SupplyFanStatus]: common_1.MetricTransform.Integer,
    [common_1.UnitMetric.UnoccupiedCoolingSetPoint]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.UnoccupiedHeatingSetPoint]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.ZoneHumidity]: common_1.MetricTransform.Decimal1,
    [common_1.UnitMetric.ZoneTemperature]: common_1.MetricTransform.Decimal1,
};
exports.DefaultWeatherMetricTransforms = {
    [common_1.WeatherMetric.AirPressure]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.AirPressureAtMeanSeaLevel]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.AirTemperature]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.DewPointTemperature]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.HeatIndex]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.HeightAboveMeanSeaLevel]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.PrecipitationLast3Hours]: common_1.MetricTransform.Decimal2,
    [common_1.WeatherMetric.PrecipitationLastHour]: common_1.MetricTransform.Decimal2,
    [common_1.WeatherMetric.RelativeHumidity]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.VisibilityInAir]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.WindFromDirection]: common_1.MetricTransform.Integer,
    [common_1.WeatherMetric.WindSpeed]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.WindSpeedOfGust]: common_1.MetricTransform.Decimal1,
    [common_1.WeatherMetric.WindChill]: common_1.MetricTransform.Decimal1,
};
exports.DefaultMeterMetricTransforms = {
    [common_1.MeterMetric.Power]: common_1.MetricTransform.Decimal2,
    [common_1.MeterMetric.Demand]: common_1.MetricTransform.Decimal2,
};
exports.DefaultUnitMetricFormats = Object.fromEntries(Object.values(common_1.UnitMetric).map((m) => [m, common_1.MetricFormat.None]));
exports.DefaultWeatherMetricFormats = Object.fromEntries(Object.values(common_1.WeatherMetric).map((m) => [m, common_1.MetricFormat.None]));
exports.DefaultMeterMetricFormats = {
    [common_1.MeterMetric.Power]: common_1.MetricFormat.Thousands,
    [common_1.MeterMetric.Demand]: common_1.MetricFormat.Thousands,
};
exports.DefaultUnitMetricSuffixes = {
    [common_1.UnitMetric.AuxiliaryHeatCommand]: "",
    [common_1.UnitMetric.CoolingDemand]: "%",
    [common_1.UnitMetric.DeadBand]: "°F",
    [common_1.UnitMetric.DemandResponseFlag]: "",
    [common_1.UnitMetric.EffectiveZoneTemperatureSetPoint]: "°F",
    [common_1.UnitMetric.FirstStageCooling]: "",
    [common_1.UnitMetric.FirstStageHeating]: "",
    [common_1.UnitMetric.HeartBeat]: "",
    [common_1.UnitMetric.HeatingDemand]: "%",
    [common_1.UnitMetric.OccupancyCommand]: "",
    [common_1.UnitMetric.OccupiedCoolingSetPoint]: "°F",
    [common_1.UnitMetric.OccupiedHeatingSetPoint]: "°F",
    [common_1.UnitMetric.OccupiedSetPoint]: "°F",
    [common_1.UnitMetric.OutdoorAirTemperature]: "°F",
    [common_1.UnitMetric.ReversingValve]: "",
    [common_1.UnitMetric.SecondStageCooling]: "",
    [common_1.UnitMetric.SupplyFanStatus]: "",
    [common_1.UnitMetric.UnoccupiedCoolingSetPoint]: "°F",
    [common_1.UnitMetric.UnoccupiedHeatingSetPoint]: "°F",
    [common_1.UnitMetric.ZoneHumidity]: "%",
    [common_1.UnitMetric.ZoneTemperature]: "°F",
};
exports.DefaultWeatherMetricSuffixes = {
    [common_1.WeatherMetric.AirPressure]: " Pa",
    [common_1.WeatherMetric.AirPressureAtMeanSeaLevel]: " Pa",
    [common_1.WeatherMetric.AirTemperature]: "°F",
    [common_1.WeatherMetric.DewPointTemperature]: "°F",
    [common_1.WeatherMetric.HeatIndex]: "°F",
    [common_1.WeatherMetric.HeightAboveMeanSeaLevel]: " m",
    [common_1.WeatherMetric.PrecipitationLast3Hours]: " in",
    [common_1.WeatherMetric.PrecipitationLastHour]: " in",
    [common_1.WeatherMetric.RelativeHumidity]: "%",
    [common_1.WeatherMetric.VisibilityInAir]: " m",
    [common_1.WeatherMetric.WindFromDirection]: "°",
    [common_1.WeatherMetric.WindSpeed]: " mph",
    [common_1.WeatherMetric.WindSpeedOfGust]: " mph",
    [common_1.WeatherMetric.WindChill]: "°F",
};
exports.DefaultMeterMetricSuffixes = {
    [common_1.MeterMetric.Power]: " W",
    [common_1.MeterMetric.Demand]: " W",
};
exports.DefaultUnitMetricPrefixes = Object.fromEntries(Object.values(common_1.UnitMetric).map((m) => [m, ""]));
exports.DefaultWeatherMetricPrefixes = Object.fromEntries(Object.values(common_1.WeatherMetric).map((m) => [m, ""]));
exports.DefaultMeterMetricPrefixes = Object.fromEntries(Object.values(common_1.MeterMetric).map((m) => [m, ""]));
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
function resolveEntry(entry, defaults) {
    if (entry == null) {
        return { ...defaults };
    }
    if (typeof entry === "string") {
        return { ...defaults, topic: entry };
    }
    return {
        topic: entry.topic ?? defaults.topic,
        aggregation: entry.aggregation ?? defaults.aggregation,
        transform: entry.transform ?? defaults.transform,
        format: entry.format ?? defaults.format,
        prefix: entry.prefix ?? defaults.prefix,
        suffix: entry.suffix ?? defaults.suffix,
    };
}
function resolveUnitMetricEntry(metric, topicMap) {
    return resolveEntry(topicMap?.unitMetrics?.[metric], {
        topic: metric,
        aggregation: exports.DefaultUnitMetricAggregations[metric],
        transform: exports.DefaultUnitMetricTransforms[metric] ?? exports.DefaultMetricTransform,
        format: exports.DefaultUnitMetricFormats[metric] ?? exports.DefaultMetricFormat,
        prefix: exports.DefaultUnitMetricPrefixes[metric] ?? "",
        suffix: exports.DefaultUnitMetricSuffixes[metric] ?? "",
    });
}
function resolveWeatherMetricEntry(metric, topicMap) {
    return resolveEntry(topicMap?.weatherMetrics?.[metric], {
        topic: exports.DefaultWeatherMetricMappings[metric] ?? metric,
        aggregation: exports.DefaultWeatherMetricAggregations[metric],
        transform: exports.DefaultWeatherMetricTransforms[metric] ?? exports.DefaultMetricTransform,
        format: exports.DefaultWeatherMetricFormats[metric] ?? exports.DefaultMetricFormat,
        prefix: exports.DefaultWeatherMetricPrefixes[metric] ?? "",
        suffix: exports.DefaultWeatherMetricSuffixes[metric] ?? "",
    });
}
function resolveMeterMetricEntry(metric, topicMap) {
    return resolveEntry(topicMap?.meterMetrics?.[metric], {
        topic: exports.DefaultMeterMetricMappings[metric] ?? metric,
        aggregation: exports.DefaultMeterMetricAggregations[metric],
        transform: exports.DefaultMeterMetricTransforms[metric] ?? exports.DefaultMetricTransform,
        format: exports.DefaultMeterMetricFormats[metric] ?? exports.DefaultMetricFormat,
        prefix: exports.DefaultMeterMetricPrefixes[metric] ?? "",
        suffix: exports.DefaultMeterMetricSuffixes[metric] ?? "",
    });
}
function applyTransform(value, transform) {
    if (value == null || !Number.isFinite(value))
        return value;
    switch (transform) {
        case common_1.MetricTransform.None:
            return value;
        case common_1.MetricTransform.Integer:
            return Math.round(value);
        case common_1.MetricTransform.Decimal1:
            return Math.round(value * 10) / 10;
        case common_1.MetricTransform.Decimal2:
            return Math.round(value * 100) / 100;
        case common_1.MetricTransform.Decimal3:
            return Math.round(value * 1000) / 1000;
        case common_1.MetricTransform.Floor:
            return Math.floor(value);
        case common_1.MetricTransform.Ceiling:
            return Math.ceil(value);
    }
}
function generateDefaultTopicMapConfig() {
    const buildEntry = (topic, aggregation, transform, format, prefix, suffix) => {
        const entry = { topic, aggregation };
        if (transform !== exports.DefaultMetricTransform)
            entry.transform = transform;
        if (format !== exports.DefaultMetricFormat)
            entry.format = format;
        if (prefix !== "")
            entry.prefix = prefix;
        if (suffix !== "")
            entry.suffix = suffix;
        return entry;
    };
    return {
        templates: {
            Unit: exports.DefaultTopicTemplates.Unit,
            Weather: exports.DefaultTopicTemplates.Weather,
            Meter: exports.DefaultTopicTemplates.Meter,
        },
        unitMetrics: Object.fromEntries(Object.values(common_1.UnitMetric).map((m) => [
            m,
            buildEntry(m, exports.DefaultUnitMetricAggregations[m], exports.DefaultUnitMetricTransforms[m] ?? exports.DefaultMetricTransform, exports.DefaultUnitMetricFormats[m] ?? exports.DefaultMetricFormat, exports.DefaultUnitMetricPrefixes[m] ?? "", exports.DefaultUnitMetricSuffixes[m] ?? ""),
        ])),
        weatherMetrics: Object.fromEntries(Object.values(common_1.WeatherMetric).map((m) => [
            m,
            buildEntry(exports.DefaultWeatherMetricMappings[m], exports.DefaultWeatherMetricAggregations[m], exports.DefaultWeatherMetricTransforms[m] ?? exports.DefaultMetricTransform, exports.DefaultWeatherMetricFormats[m] ?? exports.DefaultMetricFormat, exports.DefaultWeatherMetricPrefixes[m] ?? "", exports.DefaultWeatherMetricSuffixes[m] ?? ""),
        ])),
        meterMetrics: Object.fromEntries(Object.values(common_1.MeterMetric).map((m) => [
            m,
            buildEntry(exports.DefaultMeterMetricMappings[m], exports.DefaultMeterMetricAggregations[m], exports.DefaultMeterMetricTransforms[m] ?? exports.DefaultMetricTransform, exports.DefaultMeterMetricFormats[m] ?? exports.DefaultMetricFormat, exports.DefaultMeterMetricPrefixes[m] ?? "", exports.DefaultMeterMetricSuffixes[m] ?? ""),
        ])),
    };
}
function buildUnitTopicPath(campus, building, system, metric, topicMap) {
    const template = topicMap?.templates?.Unit ?? exports.DefaultTopicTemplates.Unit;
    const { topic } = resolveUnitMetricEntry(metric, topicMap);
    return template
        .replace("{campus}", campus)
        .replace("{building}", building)
        .replace("{system}", system)
        .replace("{metric}", topic);
}
function buildWeatherTopicPath(campus, building, metric, topicMap) {
    const template = topicMap?.templates?.Weather ?? exports.DefaultTopicTemplates.Weather;
    const { topic } = resolveWeatherMetricEntry(metric, topicMap);
    return template
        .replace("{campus}", campus)
        .replace("{building}", building)
        .replace("{metric}", topic);
}
function buildMeterTopicPath(campus, building, metric, topicMap) {
    const template = topicMap?.templates?.Meter ?? exports.DefaultTopicTemplates.Meter;
    const { topic } = resolveMeterMetricEntry(metric, topicMap);
    return template
        .replace("{campus}", campus)
        .replace("{building}", building)
        .replace("{metric}", topic);
}
function aggregationSql(aggregation, valueExpr, tsExpr = "ts") {
    switch (aggregation) {
        case common_1.MetricAggregation.Min:
            return `MIN(${valueExpr})`;
        case common_1.MetricAggregation.Max:
            return `MAX(${valueExpr})`;
        case common_1.MetricAggregation.Mean:
            return `AVG(${valueExpr})`;
        case common_1.MetricAggregation.Sum:
            return `SUM(${valueExpr})`;
        case common_1.MetricAggregation.Count:
            return `COUNT(${valueExpr})`;
        case common_1.MetricAggregation.Mode:
            return `mode() WITHIN GROUP (ORDER BY ${valueExpr})`;
        case common_1.MetricAggregation.Median:
            return `percentile_cont(0.5) WITHIN GROUP (ORDER BY ${valueExpr})`;
        case common_1.MetricAggregation.First:
            return `(array_agg(${valueExpr} ORDER BY ${tsExpr} ASC) FILTER (WHERE ${valueExpr} IS NOT NULL))[1]`;
        case common_1.MetricAggregation.Last:
            return `(array_agg(${valueExpr} ORDER BY ${tsExpr} DESC) FILTER (WHERE ${valueExpr} IS NOT NULL))[1]`;
    }
}
//# sourceMappingURL=metrics.js.map