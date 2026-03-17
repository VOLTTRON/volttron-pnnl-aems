export interface HistorianDataPoint {
    timestamp: Date;
    value: number | null;
    topic: string;
}
export interface HistorianTimeSeries {
    topic: string;
    data: HistorianDataPoint[];
}
export interface HistorianAggregate {
    timestamp: Date;
    value: number | null;
    topicPattern: string;
}
export interface HistorianMetricCurrent {
    topic: string;
    value: number | null;
    timestamp: Date;
}
export interface HistorianMultiUnitData {
    unit: string;
    data: HistorianDataPoint[];
}
export declare enum AggregationType {
    SUM = "SUM",
    AVG = "AVG",
    MAX = "MAX",
    MIN = "MIN",
    COUNT = "COUNT"
}
export declare enum CalculationType {
    SETPOINT_ERROR = "SETPOINT_ERROR",
    ROLLING_AVERAGE = "ROLLING_AVERAGE"
}
