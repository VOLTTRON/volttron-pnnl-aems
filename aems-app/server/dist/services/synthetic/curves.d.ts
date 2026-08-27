export interface Weather {
    airTemperature: number;
    relativeHumidity: number;
    windSpeed: number;
}
export interface UnitConfig {
    coolingSetpoint: number;
    heatingSetpoint: number;
}
export interface UnitSample {
    ZoneTemperature: number;
    ZoneHumidity: number;
    OutdoorAirTemperature: number;
    OccupiedCoolingSetPoint: number;
    OccupiedHeatingSetPoint: number;
    UnoccupiedCoolingSetPoint: number;
    UnoccupiedHeatingSetPoint: number;
    CoolingDemand: number;
    HeatingDemand: number;
    SupplyFanStatus: number;
    FirstStageCooling: number;
    SecondStageCooling: number;
    FirstStageHeating: number;
    AuxiliaryHeatCommand: number;
    ReversingValve: number;
    OccupancyCommand: number;
}
export interface MeterSample {
    WholeBuildingPower: number;
    Demand: number;
}
export declare const seedFor: (namespace: string, ...parts: string[]) => number;
export declare const weatherAt: (ts: Date, buildingSeed: number) => Weather;
export declare const unitAt: (ts: Date, unitSeed: number, weather: Weather, config: UnitConfig) => UnitSample;
export declare const meterAt: (ts: Date, buildingSeed: number, weather: Weather, unitCount: number) => MeterSample;
