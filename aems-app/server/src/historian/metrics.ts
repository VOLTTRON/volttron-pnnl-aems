/**
 * Historian metric utilities and metadata
 * Core metric enums are exported from @local/prisma
 */

import {
  UnitMetric,
  WeatherMetric,
  MeterMetric,
  MetricAggregation,
  MetricTransform,
  MetricFormat,
} from "@local/common";
import { HistorianTopicMapConfig, MetricMappingEntry } from "./types";

// ============================================================================
// Default Topic Templates
// ============================================================================

/**
 * Default topic path templates for historian data
 * These can be overridden via configuration file
 */
export const DefaultTopicTemplates = {
  Unit: "{campus}/{building}/{system}/{metric}",
  Weather: "{campus}/{building}/weather/{metric}",
  Meter: "{campus}/{building}/meter/{metric}",
} as const;

/**
 * Metadata about a metric
 */
export interface MetricInfo {
  topic: UnitMetric | WeatherMetric | MeterMetric; // The enum value itself
  category: "unit" | "weather" | "meter";
  description?: string;
  unit?: string; // e.g., "°F", "%", "psi"
}

/**
 * Metadata for unit metrics
 */
export const UnitMetricInfo: Record<UnitMetric, MetricInfo> = {
  [UnitMetric.AuxiliaryHeatCommand]: {
    topic: UnitMetric.AuxiliaryHeatCommand,
    category: "unit",
    description: "Auxiliary heat command status",
  },
  [UnitMetric.CoolingDemand]: {
    topic: UnitMetric.CoolingDemand,
    category: "unit",
    description: "Cooling demand percentage",
    unit: "%",
  },
  [UnitMetric.DeadBand]: {
    topic: UnitMetric.DeadBand,
    category: "unit",
    description: "Temperature dead band",
    unit: "°F",
  },
  [UnitMetric.DemandResponseFlag]: {
    topic: UnitMetric.DemandResponseFlag,
    category: "unit",
    description: "Demand response flag status",
  },
  [UnitMetric.EffectiveZoneTemperatureSetPoint]: {
    topic: UnitMetric.EffectiveZoneTemperatureSetPoint,
    category: "unit",
    description: "Effective zone temperature setpoint",
    unit: "°F",
  },
  [UnitMetric.FirstStageCooling]: {
    topic: UnitMetric.FirstStageCooling,
    category: "unit",
    description: "First stage cooling status",
  },
  [UnitMetric.FirstStageHeating]: {
    topic: UnitMetric.FirstStageHeating,
    category: "unit",
    description: "First stage heating status",
  },
  [UnitMetric.HeartBeat]: {
    topic: UnitMetric.HeartBeat,
    category: "unit",
    description: "System heartbeat indicator",
  },
  [UnitMetric.HeatingDemand]: {
    topic: UnitMetric.HeatingDemand,
    category: "unit",
    description: "Heating demand percentage",
    unit: "%",
  },
  [UnitMetric.OccupancyCommand]: {
    topic: UnitMetric.OccupancyCommand,
    category: "unit",
    description: "Occupancy command status",
  },
  [UnitMetric.OccupiedCoolingSetPoint]: {
    topic: UnitMetric.OccupiedCoolingSetPoint,
    category: "unit",
    description: "Occupied cooling setpoint",
    unit: "°F",
  },
  [UnitMetric.OccupiedHeatingSetPoint]: {
    topic: UnitMetric.OccupiedHeatingSetPoint,
    category: "unit",
    description: "Occupied heating setpoint",
    unit: "°F",
  },
  [UnitMetric.OccupiedSetPoint]: {
    topic: UnitMetric.OccupiedSetPoint,
    category: "unit",
    description: "Occupied setpoint",
    unit: "°F",
  },
  [UnitMetric.OutdoorAirTemperature]: {
    topic: UnitMetric.OutdoorAirTemperature,
    category: "unit",
    description: "Outdoor air temperature",
    unit: "°F",
  },
  [UnitMetric.ReversingValve]: {
    topic: UnitMetric.ReversingValve,
    category: "unit",
    description: "Reversing valve status",
  },
  [UnitMetric.SecondStageCooling]: {
    topic: UnitMetric.SecondStageCooling,
    category: "unit",
    description: "Second stage cooling status",
  },
  [UnitMetric.SupplyFanStatus]: {
    topic: UnitMetric.SupplyFanStatus,
    category: "unit",
    description: "Supply fan status",
  },
  [UnitMetric.UnoccupiedCoolingSetPoint]: {
    topic: UnitMetric.UnoccupiedCoolingSetPoint,
    category: "unit",
    description: "Unoccupied cooling setpoint",
    unit: "°F",
  },
  [UnitMetric.UnoccupiedHeatingSetPoint]: {
    topic: UnitMetric.UnoccupiedHeatingSetPoint,
    category: "unit",
    description: "Unoccupied heating setpoint",
    unit: "°F",
  },
  [UnitMetric.ZoneHumidity]: {
    topic: UnitMetric.ZoneHumidity,
    category: "unit",
    description: "Zone relative humidity",
    unit: "%",
  },
  [UnitMetric.ZoneTemperature]: {
    topic: UnitMetric.ZoneTemperature,
    category: "unit",
    description: "Zone temperature",
    unit: "°F",
  },
};

/**
 * Default database mappings for weather metrics
 * These map the enum values to their database/topic representations
 */
export const DefaultWeatherMetricMappings: Record<WeatherMetric, string> = {
  [WeatherMetric.AirPressure]: "air_pressure",
  [WeatherMetric.AirPressureAtMeanSeaLevel]: "air_pressure_at_mean_sea_level",
  [WeatherMetric.AirTemperature]: "air_temperature",
  [WeatherMetric.DewPointTemperature]: "dew_point_temperature",
  [WeatherMetric.HeatIndex]: "heatIndex",
  [WeatherMetric.HeightAboveMeanSeaLevel]: "height_above_mean_sea_level",
  [WeatherMetric.PrecipitationLast3Hours]: "precipitationLast3Hours",
  [WeatherMetric.PrecipitationLastHour]: "precipitationLastHour",
  [WeatherMetric.RelativeHumidity]: "relative_humidity",
  [WeatherMetric.VisibilityInAir]: "visibility_in_air",
  [WeatherMetric.WindFromDirection]: "wind_from_direction",
  [WeatherMetric.WindSpeed]: "wind_speed",
  [WeatherMetric.WindSpeedOfGust]: "wind_speed_of_gust",
  [WeatherMetric.WindChill]: "windChill",
};

/**
 * Default database mappings for meter metrics
 * These map the enum values to their database/topic representations
 */
export const DefaultMeterMetricMappings: Record<MeterMetric, string> = {
  [MeterMetric.Power]: "WholeBuildingPower",
  [MeterMetric.Demand]: "Demand",
};

// ============================================================================
// Default per-metric binning aggregations
// ============================================================================

/**
 * Continuous numeric metrics that don't have an explicit override fall back
 * to this aggregation when the topic map doesn't pin one.
 */
export const DefaultMetricAggregation = MetricAggregation.Mean;

/**
 * Default binning aggregation per unit metric. State / command codes use
 * Max so a bucket reports a real state value; continuous measurements use
 * Mean.
 */
export const DefaultUnitMetricAggregations: Record<UnitMetric, MetricAggregation> = {
  [UnitMetric.AuxiliaryHeatCommand]: MetricAggregation.Max,
  [UnitMetric.CoolingDemand]: MetricAggregation.Mean,
  [UnitMetric.DeadBand]: MetricAggregation.Mean,
  [UnitMetric.DemandResponseFlag]: MetricAggregation.Max,
  [UnitMetric.EffectiveZoneTemperatureSetPoint]: MetricAggregation.Mean,
  [UnitMetric.FirstStageCooling]: MetricAggregation.Max,
  [UnitMetric.FirstStageHeating]: MetricAggregation.Max,
  [UnitMetric.HeartBeat]: MetricAggregation.Last,
  [UnitMetric.HeatingDemand]: MetricAggregation.Mean,
  [UnitMetric.OccupancyCommand]: MetricAggregation.Max,
  [UnitMetric.OccupiedCoolingSetPoint]: MetricAggregation.Mean,
  [UnitMetric.OccupiedHeatingSetPoint]: MetricAggregation.Mean,
  [UnitMetric.OccupiedSetPoint]: MetricAggregation.Mean,
  [UnitMetric.OutdoorAirTemperature]: MetricAggregation.Mean,
  [UnitMetric.ReversingValve]: MetricAggregation.Max,
  [UnitMetric.SecondStageCooling]: MetricAggregation.Max,
  [UnitMetric.SupplyFanStatus]: MetricAggregation.Max,
  [UnitMetric.UnoccupiedCoolingSetPoint]: MetricAggregation.Mean,
  [UnitMetric.UnoccupiedHeatingSetPoint]: MetricAggregation.Mean,
  [UnitMetric.ZoneHumidity]: MetricAggregation.Mean,
  [UnitMetric.ZoneTemperature]: MetricAggregation.Mean,
};

export const DefaultWeatherMetricAggregations: Record<WeatherMetric, MetricAggregation> = {
  [WeatherMetric.AirPressure]: MetricAggregation.Mean,
  [WeatherMetric.AirPressureAtMeanSeaLevel]: MetricAggregation.Mean,
  [WeatherMetric.AirTemperature]: MetricAggregation.Mean,
  [WeatherMetric.DewPointTemperature]: MetricAggregation.Mean,
  [WeatherMetric.HeatIndex]: MetricAggregation.Mean,
  [WeatherMetric.HeightAboveMeanSeaLevel]: MetricAggregation.Mean,
  [WeatherMetric.PrecipitationLast3Hours]: MetricAggregation.Last,
  [WeatherMetric.PrecipitationLastHour]: MetricAggregation.Last,
  [WeatherMetric.RelativeHumidity]: MetricAggregation.Mean,
  [WeatherMetric.VisibilityInAir]: MetricAggregation.Mean,
  [WeatherMetric.WindFromDirection]: MetricAggregation.Mean,
  [WeatherMetric.WindSpeed]: MetricAggregation.Mean,
  [WeatherMetric.WindSpeedOfGust]: MetricAggregation.Max,
  [WeatherMetric.WindChill]: MetricAggregation.Mean,
};

export const DefaultMeterMetricAggregations: Record<MeterMetric, MetricAggregation> = {
  [MeterMetric.Power]: MetricAggregation.Mean,
  [MeterMetric.Demand]: MetricAggregation.Max,
};

// ============================================================================
// Default per-metric display configuration
// ============================================================================

/**
 * Universal fallback when neither the topic map nor the per-metric default
 * specifies a value.
 */
export const DefaultMetricTransform = MetricTransform.None;
export const DefaultMetricFormat = MetricFormat.None;

/**
 * Default server-side numeric transform per unit metric.
 * - Boolean / state codes -> Integer so dashboards never display "1.0".
 * - Continuous setpoints / temperatures -> Decimal1 (one decimal place).
 * - Demand percentages -> Decimal1.
 */
export const DefaultUnitMetricTransforms: Record<UnitMetric, MetricTransform> = {
  [UnitMetric.AuxiliaryHeatCommand]: MetricTransform.Integer,
  [UnitMetric.CoolingDemand]: MetricTransform.Decimal1,
  [UnitMetric.DeadBand]: MetricTransform.Decimal1,
  [UnitMetric.DemandResponseFlag]: MetricTransform.Integer,
  [UnitMetric.EffectiveZoneTemperatureSetPoint]: MetricTransform.Decimal1,
  [UnitMetric.FirstStageCooling]: MetricTransform.Integer,
  [UnitMetric.FirstStageHeating]: MetricTransform.Integer,
  [UnitMetric.HeartBeat]: MetricTransform.Integer,
  [UnitMetric.HeatingDemand]: MetricTransform.Decimal1,
  [UnitMetric.OccupancyCommand]: MetricTransform.Integer,
  [UnitMetric.OccupiedCoolingSetPoint]: MetricTransform.Decimal1,
  [UnitMetric.OccupiedHeatingSetPoint]: MetricTransform.Decimal1,
  [UnitMetric.OccupiedSetPoint]: MetricTransform.Decimal1,
  [UnitMetric.OutdoorAirTemperature]: MetricTransform.Decimal1,
  [UnitMetric.ReversingValve]: MetricTransform.Integer,
  [UnitMetric.SecondStageCooling]: MetricTransform.Integer,
  [UnitMetric.SupplyFanStatus]: MetricTransform.Integer,
  [UnitMetric.UnoccupiedCoolingSetPoint]: MetricTransform.Decimal1,
  [UnitMetric.UnoccupiedHeatingSetPoint]: MetricTransform.Decimal1,
  [UnitMetric.ZoneHumidity]: MetricTransform.Decimal1,
  [UnitMetric.ZoneTemperature]: MetricTransform.Decimal1,
};

export const DefaultWeatherMetricTransforms: Record<WeatherMetric, MetricTransform> = {
  [WeatherMetric.AirPressure]: MetricTransform.Decimal1,
  [WeatherMetric.AirPressureAtMeanSeaLevel]: MetricTransform.Decimal1,
  [WeatherMetric.AirTemperature]: MetricTransform.Decimal1,
  [WeatherMetric.DewPointTemperature]: MetricTransform.Decimal1,
  [WeatherMetric.HeatIndex]: MetricTransform.Decimal1,
  [WeatherMetric.HeightAboveMeanSeaLevel]: MetricTransform.Decimal1,
  [WeatherMetric.PrecipitationLast3Hours]: MetricTransform.Decimal2,
  [WeatherMetric.PrecipitationLastHour]: MetricTransform.Decimal2,
  [WeatherMetric.RelativeHumidity]: MetricTransform.Decimal1,
  [WeatherMetric.VisibilityInAir]: MetricTransform.Decimal1,
  [WeatherMetric.WindFromDirection]: MetricTransform.Integer,
  [WeatherMetric.WindSpeed]: MetricTransform.Decimal1,
  [WeatherMetric.WindSpeedOfGust]: MetricTransform.Decimal1,
  [WeatherMetric.WindChill]: MetricTransform.Decimal1,
};

export const DefaultMeterMetricTransforms: Record<MeterMetric, MetricTransform> = {
  [MeterMetric.Power]: MetricTransform.Decimal2,
  [MeterMetric.Demand]: MetricTransform.Decimal2,
};

/**
 * Default client-side display format per metric. Most metrics use no special
 * formatting; large meter readings benefit from thousands grouping.
 */
export const DefaultUnitMetricFormats: Record<UnitMetric, MetricFormat> = Object.fromEntries(
  Object.values(UnitMetric).map((m) => [m, MetricFormat.None]),
) as Record<UnitMetric, MetricFormat>;

export const DefaultWeatherMetricFormats: Record<WeatherMetric, MetricFormat> = Object.fromEntries(
  Object.values(WeatherMetric).map((m) => [m, MetricFormat.None]),
) as Record<WeatherMetric, MetricFormat>;

export const DefaultMeterMetricFormats: Record<MeterMetric, MetricFormat> = {
  [MeterMetric.Power]: MetricFormat.Thousands,
  [MeterMetric.Demand]: MetricFormat.Thousands,
};

/**
 * Default text suffix per metric (no auto-spacing — the suffix is appended
 * verbatim, so include leading whitespace where needed).
 */
export const DefaultUnitMetricSuffixes: Record<UnitMetric, string> = {
  [UnitMetric.AuxiliaryHeatCommand]: "",
  [UnitMetric.CoolingDemand]: "%",
  [UnitMetric.DeadBand]: "°F",
  [UnitMetric.DemandResponseFlag]: "",
  [UnitMetric.EffectiveZoneTemperatureSetPoint]: "°F",
  [UnitMetric.FirstStageCooling]: "",
  [UnitMetric.FirstStageHeating]: "",
  [UnitMetric.HeartBeat]: "",
  [UnitMetric.HeatingDemand]: "%",
  [UnitMetric.OccupancyCommand]: "",
  [UnitMetric.OccupiedCoolingSetPoint]: "°F",
  [UnitMetric.OccupiedHeatingSetPoint]: "°F",
  [UnitMetric.OccupiedSetPoint]: "°F",
  [UnitMetric.OutdoorAirTemperature]: "°F",
  [UnitMetric.ReversingValve]: "",
  [UnitMetric.SecondStageCooling]: "",
  [UnitMetric.SupplyFanStatus]: "",
  [UnitMetric.UnoccupiedCoolingSetPoint]: "°F",
  [UnitMetric.UnoccupiedHeatingSetPoint]: "°F",
  [UnitMetric.ZoneHumidity]: "%",
  [UnitMetric.ZoneTemperature]: "°F",
};

export const DefaultWeatherMetricSuffixes: Record<WeatherMetric, string> = {
  [WeatherMetric.AirPressure]: " Pa",
  [WeatherMetric.AirPressureAtMeanSeaLevel]: " Pa",
  [WeatherMetric.AirTemperature]: "°F",
  [WeatherMetric.DewPointTemperature]: "°F",
  [WeatherMetric.HeatIndex]: "°F",
  [WeatherMetric.HeightAboveMeanSeaLevel]: " m",
  [WeatherMetric.PrecipitationLast3Hours]: " in",
  [WeatherMetric.PrecipitationLastHour]: " in",
  [WeatherMetric.RelativeHumidity]: "%",
  [WeatherMetric.VisibilityInAir]: " m",
  [WeatherMetric.WindFromDirection]: "°",
  [WeatherMetric.WindSpeed]: " mph",
  [WeatherMetric.WindSpeedOfGust]: " mph",
  [WeatherMetric.WindChill]: "°F",
};

export const DefaultMeterMetricSuffixes: Record<MeterMetric, string> = {
  [MeterMetric.Power]: " W",
  [MeterMetric.Demand]: " W",
};

/**
 * Default text prefix per metric. Empty for all metrics by default; deployments
 * that need a currency-style prefix can override via the topic map.
 */
export const DefaultUnitMetricPrefixes: Record<UnitMetric, string> = Object.fromEntries(
  Object.values(UnitMetric).map((m) => [m, ""]),
) as Record<UnitMetric, string>;

export const DefaultWeatherMetricPrefixes: Record<WeatherMetric, string> = Object.fromEntries(
  Object.values(WeatherMetric).map((m) => [m, ""]),
) as Record<WeatherMetric, string>;

export const DefaultMeterMetricPrefixes: Record<MeterMetric, string> = Object.fromEntries(
  Object.values(MeterMetric).map((m) => [m, ""]),
) as Record<MeterMetric, string>;

/**
 * Metadata for weather metrics
 */
export const WeatherMetricInfo: Record<WeatherMetric, MetricInfo> = {
  [WeatherMetric.AirPressure]: {
    topic: WeatherMetric.AirPressure,
    category: "weather",
    description: "Air pressure",
    unit: "Pa",
  },
  [WeatherMetric.AirPressureAtMeanSeaLevel]: {
    topic: WeatherMetric.AirPressureAtMeanSeaLevel,
    category: "weather",
    description: "Air pressure at mean sea level",
    unit: "Pa",
  },
  [WeatherMetric.AirTemperature]: {
    topic: WeatherMetric.AirTemperature,
    category: "weather",
    description: "Air temperature",
    unit: "°F",
  },
  [WeatherMetric.DewPointTemperature]: {
    topic: WeatherMetric.DewPointTemperature,
    category: "weather",
    description: "Dew point temperature",
    unit: "°F",
  },
  [WeatherMetric.HeatIndex]: {
    topic: WeatherMetric.HeatIndex,
    category: "weather",
    description: "Heat index",
    unit: "°F",
  },
  [WeatherMetric.HeightAboveMeanSeaLevel]: {
    topic: WeatherMetric.HeightAboveMeanSeaLevel,
    category: "weather",
    description: "Height above mean sea level",
    unit: "m",
  },
  [WeatherMetric.PrecipitationLast3Hours]: {
    topic: WeatherMetric.PrecipitationLast3Hours,
    category: "weather",
    description: "Precipitation in last 3 hours",
    unit: "in",
  },
  [WeatherMetric.PrecipitationLastHour]: {
    topic: WeatherMetric.PrecipitationLastHour,
    category: "weather",
    description: "Precipitation in last hour",
    unit: "in",
  },
  [WeatherMetric.RelativeHumidity]: {
    topic: WeatherMetric.RelativeHumidity,
    category: "weather",
    description: "Relative humidity",
    unit: "%",
  },
  [WeatherMetric.VisibilityInAir]: {
    topic: WeatherMetric.VisibilityInAir,
    category: "weather",
    description: "Visibility in air",
    unit: "m",
  },
  [WeatherMetric.WindFromDirection]: {
    topic: WeatherMetric.WindFromDirection,
    category: "weather",
    description: "Wind direction",
    unit: "°",
  },
  [WeatherMetric.WindSpeed]: {
    topic: WeatherMetric.WindSpeed,
    category: "weather",
    description: "Wind speed",
    unit: "mph",
  },
  [WeatherMetric.WindSpeedOfGust]: {
    topic: WeatherMetric.WindSpeedOfGust,
    category: "weather",
    description: "Wind gust speed",
    unit: "mph",
  },
  [WeatherMetric.WindChill]: {
    topic: WeatherMetric.WindChill,
    category: "weather",
    description: "Wind chill",
    unit: "°F",
  },
};

/**
 * Metadata for meter metrics
 */
export const MeterMetricInfo: Record<MeterMetric, MetricInfo> = {
  [MeterMetric.Power]: {
    topic: MeterMetric.Power,
    category: "meter",
    description: "Whole building power consumption",
    unit: "W",
  },
  [MeterMetric.Demand]: {
    topic: MeterMetric.Demand,
    category: "meter",
    description: "Whole building power demand",
    unit: "W",
  },
};

/**
 * Helper function to get metric topic name (returns the enum value as string)
 */
export function getMetricTopicName(metric: UnitMetric | WeatherMetric | MeterMetric): string {
  if (Object.values(UnitMetric).includes(metric as UnitMetric)) {
    return UnitMetricInfo[metric as UnitMetric].topic;
  }
  if (Object.values(WeatherMetric).includes(metric as WeatherMetric)) {
    return WeatherMetricInfo[metric as WeatherMetric].topic;
  }
  return MeterMetricInfo[metric as MeterMetric].topic;
}

// ============================================================================
// Topic-map entry resolution
// ============================================================================

/**
 * Fully resolved per-metric entry. Used internally so every part of the
 * server (path builders, SQL builders, response metadata population) reads
 * from a single shape instead of poking the topic map repeatedly.
 */
export interface ResolvedMetricEntry {
  topic: string;
  aggregation: MetricAggregation;
  transform: MetricTransform;
  format: MetricFormat;
  prefix: string;
  suffix: string;
}

interface EntryDefaults {
  topic: string;
  aggregation: MetricAggregation;
  transform: MetricTransform;
  format: MetricFormat;
  prefix: string;
  suffix: string;
}

/**
 * Normalize a `MetricMappingEntry` into a fully resolved entry. Entries can be
 * either a bare string (legacy form, just the topic name) or an object with
 * any subset of fields. Missing fields fall back to the supplied defaults.
 */
function resolveEntry(entry: MetricMappingEntry | undefined, defaults: EntryDefaults): ResolvedMetricEntry {
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

export function resolveUnitMetricEntry(
  metric: UnitMetric,
  topicMap?: Partial<HistorianTopicMapConfig>,
): ResolvedMetricEntry {
  return resolveEntry(topicMap?.unitMetrics?.[metric], {
    topic: metric,
    aggregation: DefaultUnitMetricAggregations[metric],
    transform: DefaultUnitMetricTransforms[metric] ?? DefaultMetricTransform,
    format: DefaultUnitMetricFormats[metric] ?? DefaultMetricFormat,
    prefix: DefaultUnitMetricPrefixes[metric] ?? "",
    suffix: DefaultUnitMetricSuffixes[metric] ?? "",
  });
}

export function resolveWeatherMetricEntry(
  metric: WeatherMetric,
  topicMap?: Partial<HistorianTopicMapConfig>,
): ResolvedMetricEntry {
  return resolveEntry(topicMap?.weatherMetrics?.[metric], {
    topic: DefaultWeatherMetricMappings[metric] ?? metric,
    aggregation: DefaultWeatherMetricAggregations[metric],
    transform: DefaultWeatherMetricTransforms[metric] ?? DefaultMetricTransform,
    format: DefaultWeatherMetricFormats[metric] ?? DefaultMetricFormat,
    prefix: DefaultWeatherMetricPrefixes[metric] ?? "",
    suffix: DefaultWeatherMetricSuffixes[metric] ?? "",
  });
}

export function resolveMeterMetricEntry(
  metric: MeterMetric,
  topicMap?: Partial<HistorianTopicMapConfig>,
): ResolvedMetricEntry {
  return resolveEntry(topicMap?.meterMetrics?.[metric], {
    topic: DefaultMeterMetricMappings[metric] ?? metric,
    aggregation: DefaultMeterMetricAggregations[metric],
    transform: DefaultMeterMetricTransforms[metric] ?? DefaultMetricTransform,
    format: DefaultMeterMetricFormats[metric] ?? DefaultMetricFormat,
    prefix: DefaultMeterMetricPrefixes[metric] ?? "",
    suffix: DefaultMeterMetricSuffixes[metric] ?? "",
  });
}

/**
 * Apply the configured numeric transform. Null passes through. Used by
 * historian.service so every wire payload carries already-quantized values.
 */
export function applyTransform(value: number | null, transform: MetricTransform): number | null {
  if (value == null || !Number.isFinite(value)) return value;
  switch (transform) {
    case MetricTransform.None:
      return value;
    case MetricTransform.Integer:
      return Math.round(value);
    case MetricTransform.Decimal1:
      return Math.round(value * 10) / 10;
    case MetricTransform.Decimal2:
      return Math.round(value * 100) / 100;
    case MetricTransform.Decimal3:
      return Math.round(value * 1000) / 1000;
    case MetricTransform.Floor:
      return Math.floor(value);
    case MetricTransform.Ceiling:
      return Math.ceil(value);
  }
}

/**
 * Generate complete default topic map configuration
 * This creates a configuration object with all default values that can be
 * written to a JSON file and customized by users
 */
export function generateDefaultTopicMapConfig(): HistorianTopicMapConfig {
  const buildEntry = (
    topic: string,
    aggregation: MetricAggregation,
    transform: MetricTransform,
    format: MetricFormat,
    prefix: string,
    suffix: string,
  ): MetricMappingEntry => {
    // Only include non-default display fields so the serialized config stays compact.
    const entry: { topic: string; aggregation: MetricAggregation } & Partial<{
      transform: MetricTransform;
      format: MetricFormat;
      prefix: string;
      suffix: string;
    }> = { topic, aggregation };
    if (transform !== DefaultMetricTransform) entry.transform = transform;
    if (format !== DefaultMetricFormat) entry.format = format;
    if (prefix !== "") entry.prefix = prefix;
    if (suffix !== "") entry.suffix = suffix;
    return entry;
  };

  return {
    templates: {
      Unit: DefaultTopicTemplates.Unit,
      Weather: DefaultTopicTemplates.Weather,
      Meter: DefaultTopicTemplates.Meter,
    },
    unitMetrics: Object.fromEntries(
      Object.values(UnitMetric).map((m) => [
        m,
        buildEntry(
          m,
          DefaultUnitMetricAggregations[m],
          DefaultUnitMetricTransforms[m] ?? DefaultMetricTransform,
          DefaultUnitMetricFormats[m] ?? DefaultMetricFormat,
          DefaultUnitMetricPrefixes[m] ?? "",
          DefaultUnitMetricSuffixes[m] ?? "",
        ),
      ]),
    ) as Record<UnitMetric, MetricMappingEntry>,
    weatherMetrics: Object.fromEntries(
      Object.values(WeatherMetric).map((m) => [
        m,
        buildEntry(
          DefaultWeatherMetricMappings[m],
          DefaultWeatherMetricAggregations[m],
          DefaultWeatherMetricTransforms[m] ?? DefaultMetricTransform,
          DefaultWeatherMetricFormats[m] ?? DefaultMetricFormat,
          DefaultWeatherMetricPrefixes[m] ?? "",
          DefaultWeatherMetricSuffixes[m] ?? "",
        ),
      ]),
    ) as Record<WeatherMetric, MetricMappingEntry>,
    meterMetrics: Object.fromEntries(
      Object.values(MeterMetric).map((m) => [
        m,
        buildEntry(
          DefaultMeterMetricMappings[m],
          DefaultMeterMetricAggregations[m],
          DefaultMeterMetricTransforms[m] ?? DefaultMetricTransform,
          DefaultMeterMetricFormats[m] ?? DefaultMetricFormat,
          DefaultMeterMetricPrefixes[m] ?? "",
          DefaultMeterMetricSuffixes[m] ?? "",
        ),
      ]),
    ) as Record<MeterMetric, MetricMappingEntry>,
  };
}

/**
 * Helper function to build topic path for unit metric
 */
export function buildUnitTopicPath(
  campus: string,
  building: string,
  system: string,
  metric: UnitMetric,
  topicMap?: Partial<HistorianTopicMapConfig>,
): string {
  const template = topicMap?.templates?.Unit ?? DefaultTopicTemplates.Unit;
  const { topic } = resolveUnitMetricEntry(metric, topicMap);

  return template
    .replace("{campus}", campus)
    .replace("{building}", building)
    .replace("{system}", system)
    .replace("{metric}", topic);
}

/**
 * Helper function to build topic path for weather metric
 */
export function buildWeatherTopicPath(
  campus: string,
  building: string,
  metric: WeatherMetric,
  topicMap?: Partial<HistorianTopicMapConfig>,
): string {
  const template = topicMap?.templates?.Weather ?? DefaultTopicTemplates.Weather;
  const { topic } = resolveWeatherMetricEntry(metric, topicMap);

  return template
    .replace("{campus}", campus)
    .replace("{building}", building)
    .replace("{metric}", topic);
}

/**
 * Helper function to build topic path for meter metric
 */
export function buildMeterTopicPath(
  campus: string,
  building: string,
  metric: MeterMetric,
  topicMap?: Partial<HistorianTopicMapConfig>,
): string {
  const template = topicMap?.templates?.Meter ?? DefaultTopicTemplates.Meter;
  const { topic } = resolveMeterMetricEntry(metric, topicMap);

  return template
    .replace("{campus}", campus)
    .replace("{building}", building)
    .replace("{metric}", topic);
}

// ============================================================================
// SQL aggregation builder
// ============================================================================

/**
 * Build the SQL fragment that collapses many `valueExpr` rows into one
 * value per bucket using the given aggregation. `tsExpr` names the row's
 * timestamp column (only used by First/Last). All inputs are caller-controlled
 * literal SQL — never interpolate user input.
 */
export function aggregationSql(
  aggregation: MetricAggregation,
  valueExpr: string,
  tsExpr: string = "ts",
): string {
  switch (aggregation) {
    case MetricAggregation.Min:
      return `MIN(${valueExpr})`;
    case MetricAggregation.Max:
      return `MAX(${valueExpr})`;
    case MetricAggregation.Mean:
      return `AVG(${valueExpr})`;
    case MetricAggregation.Sum:
      return `SUM(${valueExpr})`;
    case MetricAggregation.Count:
      return `COUNT(${valueExpr})`;
    case MetricAggregation.Mode:
      return `mode() WITHIN GROUP (ORDER BY ${valueExpr})`;
    case MetricAggregation.Median:
      return `percentile_cont(0.5) WITHIN GROUP (ORDER BY ${valueExpr})`;
    case MetricAggregation.First:
      return `(array_agg(${valueExpr} ORDER BY ${tsExpr} ASC) FILTER (WHERE ${valueExpr} IS NOT NULL))[1]`;
    case MetricAggregation.Last:
      return `(array_agg(${valueExpr} ORDER BY ${tsExpr} DESC) FILTER (WHERE ${valueExpr} IS NOT NULL))[1]`;
  }
}
