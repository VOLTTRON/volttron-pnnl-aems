/**
 * Historian metric utilities and metadata
 * Core metric enums are exported from @local/prisma
 */

import { UnitMetric, WeatherMetric, MeterMetric } from "@local/common";

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

/**
 * Helper function to build topic path for unit metric
 */
export function buildUnitTopicPath(campus: string, building: string, system: string, metric: UnitMetric): string {
  const topic = UnitMetricInfo[metric].topic;
  return `${campus}/${building}/${system}/${topic}`;
}

/**
 * Helper function to build topic path for weather metric
 */
export function buildWeatherTopicPath(campus: string, building: string, metric: WeatherMetric): string {
  const topic = WeatherMetricInfo[metric].topic;
  return `${campus}/${building}/weather/${topic}`;
}

/**
 * Helper function to build topic path for meter metric
 */
export function buildMeterTopicPath(campus: string, building: string, metric: MeterMetric): string {
  const topic = MeterMetricInfo[metric].topic;
  return `${campus}/${building}/meter/${topic}`;
}
