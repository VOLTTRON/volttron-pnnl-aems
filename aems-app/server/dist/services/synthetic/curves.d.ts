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
    OutdoorAirTemperature: number;
    OccupiedCoolingSetPoint: number;
    OccupiedHeatingSetPoint: number;
    CoolingDemand: number;
    HeatingDemand: number;
    SupplyFanStatus: number;
    FirstStageCooling: number;
}
export interface MeterSample {
    WholeBuildingPower: number;
    Demand: number;
}
export declare const seedFor: (namespace: string, ...parts: string[]) => number;
export declare const weatherAt: (ts: Date, buildingSeed: number) => Weather;
export declare const unitAt: (ts: Date, unitSeed: number, weather: Weather, config: UnitConfig) => UnitSample;
export declare const meterAt: (ts: Date, buildingSeed: number, weather: Weather, unitCount: number) => MeterSample;
