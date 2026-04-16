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
  DeadBand = "DeadBand",
  DemandResponseFlag = "DemandResponseFlag",
  EffectiveZoneTemperatureSetPoint = "EffectiveZoneTemperatureSetPoint",
  FirstStageCooling = "FirstStageCooling",
  FirstStageHeating = "FirstStageHeating",
  HeartBeat = "HeartBeat",
  HeatingDemand = "HeatingDemand",
  OccupancyCommand = "OccupancyCommand",
  OccupiedCoolingSetPoint = "OccupiedCoolingSetPoint",
  OccupiedHeatingSetPoint = "OccupiedHeatingSetPoint",
  OccupiedSetPoint = "OccupiedSetPoint",
  OutdoorAirTemperature = "OutdoorAirTemperature",
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

/**
 * Metrics for meter/power data
 * These metrics apply at the campus/building level for whole-building measurements
 */
export enum MeterMetric {
  Power = "WholeBuildingPower",
  Demand = "Demand",
}

// ============================================================================
// Data Types
// ============================================================================

export interface HistorianDataPoint {
  timestamp: Date;
  value: number | null;
  system: string;
  metric: UnitMetric | WeatherMetric | MeterMetric;
}

export interface HistorianTimeSeries {
  system: string;
  metric: UnitMetric | WeatherMetric | MeterMetric;
  data: HistorianDataPoint[];
}

export interface HistorianAggregate {
  timestamp: Date;
  value: number | null;
  metric: UnitMetric | WeatherMetric | MeterMetric;
}

export interface HistorianMetricCurrent {
  system: string;
  metric: UnitMetric | WeatherMetric | MeterMetric;
  value: number | null;
  timestamp: Date;
}

export interface HistorianMultiSystemData {
  system: string;
  data: HistorianDataPoint[];
}

/**
 * Represents a time range where a metric value remains constant
 * Optimized for timeline/state visualizations to reduce data transfer
 */
export interface HistorianDataRange {
  startTime: Date;
  endTime: Date;
  value: number | null;
  system: string;
  metric: UnitMetric | WeatherMetric | MeterMetric;
}

/**
 * Multi-system data organized as ranges instead of individual points
 * Significantly reduces payload size for timeline visualizations
 */
export interface HistorianMultiSystemRanges {
  system: string;
  ranges: HistorianDataRange[];
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
