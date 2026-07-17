import { HistorianQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { HistorianObject } from "./object.service";
import { HistorianService } from "@/historian/historian.service";

const resolvers: Record<string, (...args: unknown[]) => unknown> = {};

function makeMockT() {
  const arg: any = jest.fn((opts: any) => opts);
  arg.string = jest.fn((opts: any) => opts);
  arg.stringList = jest.fn((opts: any) => opts);
  return {
    field: jest.fn((opts: any) => opts),
    arg,
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    DateTime: "DateTime",
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeHistorianObject(): HistorianObject {
  return {
    UnitMetric: "UnitMetricEnum",
    WeatherMetric: "WeatherMetricEnum",
    MeterMetric: "MeterMetricEnum",
    AggregationType: "AggregationTypeEnum",
    HistorianMetricCurrent: "HistorianMetricCurrent",
    HistorianTimeSeries: "HistorianTimeSeries",
    HistorianAggregateResult: "HistorianAggregateResult",
    HistorianMultiSystemData: "HistorianMultiSystemData",
    HistorianReplicationInfo: "HistorianReplicationInfo",
  } as unknown as HistorianObject;
}

function makeHistorianService(allowedSystems: { system: string }[] = [{ system: "ahu1" }]) {
  return {
    filterHistorianAccess: jest.fn().mockResolvedValue({ allowedSystems }),
    getUnitCurrentValue: jest.fn().mockResolvedValue({ value: 72 }),
    getUnitTimeSeries: jest.fn().mockResolvedValue({ system: "ahu1", data: [{ ts: 0, value: 1 }] }),
    getUnitAggregated: jest.fn().mockResolvedValue({ aggregates: [{ bucket: 0, value: 1 }] }),
    getWeatherCurrentValue: jest.fn().mockResolvedValue({ value: 55 }),
    getWeatherTimeSeries: jest.fn().mockResolvedValue({ system: "weather", data: [] }),
    getWeatherAggregated: jest.fn().mockResolvedValue({ aggregates: [] }),
    getMeterCurrentValue: jest.fn().mockResolvedValue({ value: 1000 }),
    getMeterTimeSeries: jest.fn().mockResolvedValue({ system: "meter", data: [] }),
    getMeterAggregated: jest.fn().mockResolvedValue({ aggregates: [] }),
    getMultiSystemUnit: jest.fn().mockResolvedValue([{ system: "ahu1", data: [] }]),
    calculateSetpointError: jest.fn().mockResolvedValue({ system: "ahu1", data: [] }),
    getReplicationInfo: jest.fn().mockResolvedValue({ status: "ok" }),
  } as unknown as HistorianService;
}

const userCtx = { user: { id: "u1", authRoles: { admin: false } } };

describe("HistorianQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers all expected historian query fields", () => {
    new HistorianQuery(makeBuilder(), makeHistorianService(), makeHistorianObject());
    expect(Object.keys(resolvers).sort()).toEqual(
      [
        "historianMeterAggregated",
        "historianMeterCurrentValue",
        "historianMeterTimeSeries",
        "historianMultiSystemUnit",
        "historianReplicationInfo",
        "historianSetpointError",
        "historianUnitAggregated",
        "historianUnitCurrentValue",
        "historianUnitTimeSeries",
        "historianWeatherAggregated",
        "historianWeatherCurrentValue",
        "historianWeatherTimeSeries",
      ].sort(),
    );
  });

  it("historianUnitCurrentValue returns value when access allowed", async () => {
    const svc = makeHistorianService();
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    const result = await resolvers["historianUnitCurrentValue"](
      null,
      { campus: "C", building: "B", system: "ahu1", metric: "ZoneTemperature" },
      userCtx,
    );
    expect(svc.getUnitCurrentValue).toHaveBeenCalledWith("C", "B", "ahu1", "ZoneTemperature");
    expect(result).toEqual({ value: 72 });
  });

  it("historianUnitCurrentValue returns null when access denied", async () => {
    const svc = makeHistorianService([]);
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    const result = await resolvers["historianUnitCurrentValue"](
      null,
      { campus: "C", building: "B", system: "ahu1", metric: "ZoneTemperature" },
      userCtx,
    );
    expect(svc.getUnitCurrentValue).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("historianUnitTimeSeries returns empty data with access-denied error when access denied", async () => {
    const svc = makeHistorianService([]);
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    const result: any = await resolvers["historianUnitTimeSeries"](
      null,
      { campus: "C", building: "B", system: "ahu1", metric: "ZoneTemperature", startTime: new Date(), endTime: new Date() },
      userCtx,
    );
    expect(result.data).toEqual([]);
    expect(result.metadata.errors[0]).toMatch(/Access denied/);
    expect(svc.getUnitTimeSeries).not.toHaveBeenCalled();
  });

  it("historianUnitAggregated returns aggregates when allowed", async () => {
    const svc = makeHistorianService();
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    const result = await resolvers["historianUnitAggregated"](
      null,
      {
        campus: "C",
        building: "B",
        system: "ahu1",
        metric: "ZoneTemperature",
        startTime: new Date(),
        endTime: new Date(),
        interval: "5m",
        aggregation: "average",
      },
      userCtx,
    );
    expect(svc.getUnitAggregated).toHaveBeenCalled();
    expect(result).toEqual({ aggregates: [{ bucket: 0, value: 1 }] });
  });

  it("historianWeatherCurrentValue uses 'weather' system in access check", async () => {
    const svc = makeHistorianService();
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    await resolvers["historianWeatherCurrentValue"](null, { campus: "C", building: "B", metric: "Temperature" }, userCtx);
    expect(svc.filterHistorianAccess).toHaveBeenCalledWith(userCtx.user, "C", "B", "weather");
  });

  it("historianWeatherTimeSeries denies access when no allowedSystems", async () => {
    const svc = makeHistorianService([]);
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    const result: any = await resolvers["historianWeatherTimeSeries"](
      null,
      { campus: "C", building: "B", metric: "Temperature", startTime: new Date(), endTime: new Date() },
      userCtx,
    );
    expect(result.system).toBe("weather");
    expect(result.metadata.errors[0]).toMatch(/Access denied/);
  });

  it("historianMeterCurrentValue uses 'meter' system in access check", async () => {
    const svc = makeHistorianService();
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    await resolvers["historianMeterCurrentValue"](null, { campus: "C", building: "B", metric: "Power" }, userCtx);
    expect(svc.filterHistorianAccess).toHaveBeenCalledWith(userCtx.user, "C", "B", "meter");
  });

  it("historianMeterAggregated returns access-denied error when not allowed", async () => {
    const svc = makeHistorianService([]);
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    const result: any = await resolvers["historianMeterAggregated"](
      null,
      {
        campus: "C",
        building: "B",
        metric: "Power",
        startTime: new Date(),
        endTime: new Date(),
        interval: "5m",
        aggregation: "sum",
      },
      userCtx,
    );
    expect(result.aggregates).toEqual([]);
    expect(result.metadata.errors[0]).toMatch(/Access denied/);
  });

  it("historianMultiSystemUnit splits allowed and denied systems", async () => {
    const svc = makeHistorianService([{ system: "ahu1" }]);
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    await resolvers["historianMultiSystemUnit"](
      null,
      { campus: "C", building: "B", systems: ["ahu1", "ahu2"], metric: "ZoneTemperature", startTime: new Date(), endTime: new Date(), interval: null },
      userCtx,
    );
    expect(svc.getMultiSystemUnit).toHaveBeenCalledWith("C", "B", ["ahu1"], ["ahu2"], "ZoneTemperature", expect.any(Date), expect.any(Date), undefined);
  });

  it("historianSetpointError returns access-denied response when not allowed", async () => {
    const svc = makeHistorianService([]);
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    const result: any = await resolvers["historianSetpointError"](
      null,
      { campus: "C", building: "B", system: "ahu1", startTime: new Date(), endTime: new Date() },
      userCtx,
    );
    expect(result.data).toEqual([]);
    expect(result.metadata.errors[0]).toMatch(/Access denied/);
    expect(svc.calculateSetpointError).not.toHaveBeenCalled();
  });

  it("historianReplicationInfo delegates to service", async () => {
    const svc = makeHistorianService();
    new HistorianQuery(makeBuilder(), svc, makeHistorianObject());
    const result = await resolvers["historianReplicationInfo"](null, {}, userCtx);
    expect(svc.getReplicationInfo).toHaveBeenCalled();
    expect(result).toEqual({ status: "ok" });
  });
});
