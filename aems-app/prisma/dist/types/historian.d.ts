export declare enum UnitMetric {
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
    ZoneTemperature = "ZoneTemperature"
}
export declare enum WeatherMetric {
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
    WindChill = "WindChill"
}
export declare enum MeterMetric {
    Power = "Power",
    Demand = "Demand"
}
export interface HistorianQueryMetadata {
    topics: Record<string, string>;
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
export interface HistorianDataRange {
    startTime: Date;
    endTime: Date;
    value: number | null;
    system: string;
    metric: UnitMetric | WeatherMetric | MeterMetric;
}
export interface HistorianMultiSystemRanges {
    system: string;
    ranges: HistorianDataRange[];
    metadata: HistorianQueryMetadata;
}
export declare enum AggregationType {
    Sum = "Sum",
    Avg = "Avg",
    Max = "Max",
    Min = "Min",
    Count = "Count"
}
export declare enum CalculationType {
    SetpointError = "SetpointError",
    RollingAverage = "RollingAverage"
}
