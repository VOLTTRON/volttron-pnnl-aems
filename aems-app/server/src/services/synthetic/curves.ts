/**
 * Pure math for deterministic synthetic AEMS time-series. No I/O, no
 * randomness beyond a seeded mulberry32 PRNG so re-runs are reproducible
 * given the same seed + timestamp inputs.
 */

const TWO_PI = Math.PI * 2;

const hashString = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const gaussian = (rand: () => number, mean = 0, stdDev = 1): number => {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * v);
};

const dayOfYear = (ts: Date): number => {
  const start = new Date(Date.UTC(ts.getUTCFullYear(), 0, 0));
  const diff = ts.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
};

const isOccupied = (ts: Date): boolean => {
  const dow = ts.getUTCDay();
  const hour = ts.getUTCHours();
  return dow >= 1 && dow <= 5 && hour >= 6 && hour < 18;
};

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

export const seedFor = (namespace: string, ...parts: string[]): number =>
  hashString([namespace, ...parts].join("|"));

export const weatherAt = (ts: Date, buildingSeed: number): Weather => {
  const rand = mulberry32(buildingSeed ^ Math.floor(ts.getTime() / 60_000));
  const doy = dayOfYear(ts);
  const hourFrac = ts.getUTCHours() + ts.getUTCMinutes() / 60;

  const seasonal = 20 * Math.sin(TWO_PI * (doy - 172) / 365);
  const diurnal = 10 * Math.sin(TWO_PI * (hourFrac - 6) / 24);
  const airTemperature = 55 + seasonal + diurnal + gaussian(rand, 0, 1.2);

  const relativeHumidity = Math.max(
    15,
    Math.min(95, 60 - 0.6 * (airTemperature - 55) + gaussian(rand, 0, 5)),
  );

  const windSpeed = Math.max(0, 5 + gaussian(rand, 0, 3));

  return { airTemperature, relativeHumidity, windSpeed };
};

export const unitAt = (
  ts: Date,
  unitSeed: number,
  weather: Weather,
  config: UnitConfig,
): UnitSample => {
  const rand = mulberry32(unitSeed ^ Math.floor(ts.getTime() / 60_000));
  const occupied = isOccupied(ts);
  const setpoint = occupied ? config.coolingSetpoint : config.coolingSetpoint + 4;
  const heatSetpoint = occupied ? config.heatingSetpoint : config.heatingSetpoint - 4;

  const oatLoad = Math.max(0, weather.airTemperature - setpoint) / 20;
  const fanOn = occupied || oatLoad > 0.2 ? 1 : 0;
  const stage1Cool = weather.airTemperature > setpoint + 2 ? 1 : 0;
  const stage2Cool = weather.airTemperature > setpoint + 5 ? 1 : 0;
  const stage1Heat = weather.airTemperature < heatSetpoint - 2 ? 1 : 0;
  const auxHeat = weather.airTemperature < heatSetpoint - 8 ? 1 : 0;
  const reversing = weather.airTemperature < heatSetpoint ? 1 : 0;
  const zoneHumidity = Math.max(20, Math.min(60, 35 + gaussian(rand, 0, 5)));

  const zoneTemperature =
    setpoint +
    (stage1Cool ? -0.6 : 0) +
    (occupied ? gaussian(rand, 0, 0.4) : gaussian(rand, 0.5, 0.6));

  return {
    ZoneTemperature: round1(zoneTemperature),
    ZoneHumidity: round1(zoneHumidity),
    OutdoorAirTemperature: round1(weather.airTemperature),
    OccupiedCoolingSetPoint: config.coolingSetpoint,
    OccupiedHeatingSetPoint: config.heatingSetpoint,
    UnoccupiedCoolingSetPoint: config.coolingSetpoint + 4,
    UnoccupiedHeatingSetPoint: config.heatingSetpoint - 4,
    CoolingDemand: round1(oatLoad + (fanOn ? 0.3 : 0) + gaussian(rand, 0, 0.05)),
    HeatingDemand: round1(Math.max(0, (heatSetpoint - weather.airTemperature) / 30) + gaussian(rand, 0, 0.05)),
    SupplyFanStatus: fanOn,
    FirstStageCooling: stage1Cool,
    SecondStageCooling: stage2Cool,
    FirstStageHeating: stage1Heat,
    AuxiliaryHeatCommand: auxHeat,
    ReversingValve: reversing,
    OccupancyCommand: occupied ? 1 : 0,
  };
};

export const meterAt = (
  ts: Date,
  buildingSeed: number,
  weather: Weather,
  unitCount: number,
): MeterSample => {
  const rand = mulberry32(buildingSeed ^ Math.floor(ts.getTime() / 60_000) ^ 0xa11ce);
  const occupied = isOccupied(ts);
  const cooling = Math.max(0, weather.airTemperature - 65) * 0.9;
  const base = 12 + (occupied ? 18 : 4) + cooling + gaussian(rand, 0, 1.2);
  const power = Math.max(3, base) * unitCount * 0.6;
  const demand = power * (0.95 + rand() * 0.1);
  return {
    WholeBuildingPower: round1(power),
    Demand: round1(demand),
  };
};

const round1 = (v: number): number => Math.round(v * 10) / 10;
