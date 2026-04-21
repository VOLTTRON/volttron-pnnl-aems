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
 * 
 * IMPORTANT: All enum values MUST equal their key names (e.g., ZoneTemperature = "ZoneTemperature").
 * This ensures the client API receives clean enum names rather than database-specific mappings.
 * Database format mappings are handled separately and can be customized via historian-topic-map.json.
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
 * 
 * IMPORTANT: All enum values MUST equal their key names (e.g., AirTemperature = "AirTemperature").
 * This ensures the client API receives clean enum names rather than database-specific mappings.
 * Database format mappings (e.g., "air_temperature") are defined in DefaultWeatherMetricMappings
 * in server/src/historian/metrics.ts and can be customized via historian-topic-map.json.
 */
export enum WeatherMetric {
  AirPressure = "AirPressure",
  AirPressureAtMeanSeaLevel = "AirPressureAtMeanSeaLevel",
  AirTemperature = "AirTemperature",
  DewPointTemperature = "DewPointTemperature",
  HeatIndex = "HeatIndex",
  HeightAboveMeanSeaLevel = "HeightAboveMeanSeaLevel",
  PrecipitationLast3Hours = "PrecipitationLast3Hours",
  PrecipitationLastHour = "PrecipitationLastHour",
  RelativeHumidity = "RelativeHumidity",
  VisibilityInAir = "VisibilityInAir",
  WindFromDirection = "WindFromDirection",
  WindSpeed = "WindSpeed",
  WindSpeedOfGust = "WindSpeedOfGust",
  WindChill = "WindChill",
}

/**
 * Metrics for meter/power data
 * These metrics apply at the campus/building level for whole-building measurements
 * 
 * IMPORTANT: All enum values MUST equal their key names (e.g., Power = "Power").
 * This ensures the client API receives clean enum names rather than database-specific mappings.
 * Database format mappings (e.g., "WholeBuildingPower") are defined in DefaultMeterMetricMappings
 * in server/src/historian/metrics.ts and can be customized via historian-topic-map.json.
 */
export enum MeterMetric {
  Power = "Power",
  Demand = "Demand",
}

// ============================================================================
// Data Types
// ============================================================================

/**
 * Metadata for troubleshooting historian queries
 * Includes constructed topic paths and any errors/warnings encountered during query execution
 */
export interface HistorianQueryMetadata {
  /**
   * Map of metrics to their constructed topic paths
   * Helps verify topic mapping configuration is working correctly
   */
  topics: Record<string, string>;

  /**
   * List of errors or warnings encountered during query
   * Includes access control denials, query errors, mapping issues, etc.
   */
  errors: string[];
}

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
  metadata: HistorianQueryMetadata;
}

export interface HistorianAggregate {
  timestamp: Date;
  value: number | null;
  metric: UnitMetric | WeatherMetric | MeterMetric;
}

export interface HistorianAggregateResult {
  aggregates: HistorianAggregate[];
  metadata: HistorianQueryMetadata;
}


export interface HistorianMetricCurrent {
  system: string;
  metric: UnitMetric | WeatherMetric | MeterMetric;
  value: number | null;
  timestamp: Date;
  metadata: HistorianQueryMetadata;
}

export interface HistorianMultiSystemData {
  system: string;
  data: HistorianDataPoint[];
  metadata: HistorianQueryMetadata;
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
  metadata: HistorianQueryMetadata;
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
