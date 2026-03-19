/**
 * Historian data types and enums
 * These types are shared across server and client through GraphQL codegen
 */

// ============================================================================
// Metric Enumerations
// ============================================================================

/**
 * Metrics for unit/system data (HVAC equipment)
 * These metrics are associated with specific systems (e.g., RTUs, AHUs)
 */
export enum UnitMetric {
  AuxiliaryHeatCommand = "AuxiliaryHeatCommand",
  CoolingDemand = "CoolingDemand",
  DemandResponseFlag = "DemandResponseFlag",
  EffectiveZoneTemperatureSetPoint = "EffectiveZoneTemperatureSetPoint",
  FirstStageCooling = "FirstStageCooling",
  FirstStageHeating = "FirstStageHeating",
  HeartBeat = "HeartBeat",
  HeatingDemand = "HeatingDemand",
  OccupancyCommand = "OccupancyCommand",
  OccupiedCoolingSetPoint = "OccupiedCoolingSetPoint",
  OccupiedHeatingSetPoint = "OccupiedHeatingSetPoint",
  ReversingValve = "ReversingValve",
  SecondStageCooling = "SecondStageCooling",
  SupplyFanStatus = "SupplyFanStatus",
  UnoccupiedCoolingSetPoint = "UnoccupiedCoolingSetPoint",
  UnoccupiedHeatingSetPoint = "UnoccupiedHeatingSetPoint",
  ZoneHumidity = "ZoneHumidity",
  ZoneTemperature = "ZoneTemperature",
}

/**
 * Metrics for weather data
 * These metrics apply at the campus/building level and are not system-specific
 */
export enum WeatherMetric {
  AirPressure = "air_pressure",
  AirPressureAtMeanSeaLevel = "air_pressure_at_mean_sea_level",
  AirTemperature = "air_temperature",
  DewPointTemperature = "dew_point_temperature",
  HeatIndex = "heatIndex",
  HeightAboveMeanSeaLevel = "height_above_mean_sea_level",
  PrecipitationLast3Hours = "precipitationLast3Hours",
  PrecipitationLastHour = "precipitationLastHour",
  RelativeHumidity = "relative_humidity",
  VisibilityInAir = "visibility_in_air",
  WindFromDirection = "wind_from_direction",
  WindSpeed = "wind_speed",
  WindSpeedOfGust = "wind_speed_of_gust",
  WindChill = "windChill",
}

// ============================================================================
// Data Types
// ============================================================================

export interface HistorianDataPoint {
  timestamp: Date;
  value: number | null;
  system: string;
  metric: UnitMetric | WeatherMetric;
}

export interface HistorianTimeSeries {
  system: string;
  metric: UnitMetric | WeatherMetric;
  data: HistorianDataPoint[];
}

export interface HistorianAggregate {
  timestamp: Date;
  value: number | null;
  metric: UnitMetric | WeatherMetric;
}

export interface HistorianMetricCurrent {
  system: string;
  metric: UnitMetric | WeatherMetric;
  value: number | null;
  timestamp: Date;
}

export interface HistorianMultiSystemData {
  system: string;
  data: HistorianDataPoint[];
}

// ============================================================================
// Operation Enumerations
// ============================================================================

export enum AggregationType {
  Sum = "Sum",
  Avg = "Avg",
  Max = "Max",
  Min = "Min",
  Count = "Count",
}

export enum CalculationType {
  SetpointError = "SetpointError",
  RollingAverage = "RollingAverage",
}
