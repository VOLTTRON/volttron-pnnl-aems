/**
 * Historian data types
 * These types are separated to avoid circular dependencies with GraphQL
 */

export interface HistorianDataPoint {
  timestamp: Date;
  value: number | null;
  topicName: string;
}

export interface HistorianTimeSeries {
  topicName: string;
  data: HistorianDataPoint[];
}

export interface HistorianAggregate {
  timestamp: Date;
  value: number | null;
  topicPattern: string;
}

export interface HistorianMetricCurrent {
  topicName: string;
  value: number | null;
  timestamp: Date;
}

export interface HistorianMultiUnitData {
  unit: string;
  data: HistorianDataPoint[];
}

export enum AggregationType {
  SUM = "SUM",
  AVG = "AVG",
  MAX = "MAX",
  MIN = "MIN",
  COUNT = "COUNT",
}

export enum CalculationType {
  SETPOINT_ERROR = "SETPOINT_ERROR",
  ROLLING_AVERAGE = "ROLLING_AVERAGE",
}
