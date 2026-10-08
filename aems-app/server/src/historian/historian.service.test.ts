import { HistorianService } from "./historian.service";
import { UnitMetric, WeatherMetric, MeterMetric } from "@local/common";

describe("HistorianService.computeSetpointErrorFloorSec", () => {
  it("derives the floor from binning.start/unit/count when no override is set", () => {
    // 48h * 3600 / 500 = 345.6s -> snaps to 600s (10m)
    expect(
      HistorianService.computeSetpointErrorFloorSec({ count: 500, start: 48, unit: "hours" }),
    ).toBe(600);
  });

  it("respects the explicit override", () => {
    expect(
      HistorianService.computeSetpointErrorFloorSec({
        count: 500,
        start: 48,
        unit: "hours",
        setpointErrorMinBucket: "2m",
      }),
    ).toBe(120);
  });

  it("snaps non-aligned overrides up to the nice list", () => {
    // "45s" snaps to 60s
    expect(
      HistorianService.computeSetpointErrorFloorSec({
        count: 500,
        start: 48,
        unit: "hours",
        setpointErrorMinBucket: "45s",
      }),
    ).toBe(60);
  });

  it("supports day-unit overrides", () => {
    expect(
      HistorianService.computeSetpointErrorFloorSec({
        count: 500,
        start: 48,
        unit: "hours",
        setpointErrorMinBucket: "1d",
      }),
    ).toBe(86_400);
  });

  it("scales with smaller binning thresholds", () => {
    // 1h * 3600 / 500 = 7.2s -> snaps to 10s
    expect(
      HistorianService.computeSetpointErrorFloorSec({ count: 500, start: 1, unit: "hours" }),
    ).toBe(10);
  });

  it("scales with smaller bucket counts", () => {
    // 48h * 3600 / 100 = 1728s -> snaps to 1800s (30m)
    expect(
      HistorianService.computeSetpointErrorFloorSec({ count: 100, start: 48, unit: "hours" }),
    ).toBe(1800);
  });

  it("rejects invalid override strings", () => {
    expect(() =>
      HistorianService.computeSetpointErrorFloorSec({
        count: 500,
        start: 48,
        unit: "hours",
        setpointErrorMinBucket: "5min",
      }),
    ).toThrow(/Invalid interval format/);
  });
});

function makeConfig(overrides: any = {}): any {
  return {
    historian: {
      host: "localhost",
      port: 5432,
      name: "historian",
      username: "u",
      password: "p",
      binning: { count: 500, start: 48, unit: "hours" },
      ...overrides,
    },
  };
}

function makePrisma() {
  return {
    prisma: {
      unit: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
  };
}

function makeFakePool() {
  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({ release: jest.fn() }),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  } as any;
}

function buildService(prisma: any = makePrisma(), config: any = makeConfig()) {
  const svc = new HistorianService(config, prisma);
  const fakePool = makeFakePool();
  (svc as any).pool = fakePool;
  return { svc, fakePool, prisma };
}

const adminUser: Express.User = { id: "admin", authRoles: { admin: true } } as any;
const normalUser: Express.User = { id: "u1", authRoles: { admin: false } } as any;

// scenario: historian-access-by-assignment
describe("HistorianService.filterHistorianAccess", () => {
  it("returns no allowed systems when the user has no matching units", async () => {
    const prisma = makePrisma();
    const { svc } = buildService(prisma);
    const result = await svc.filterHistorianAccess(normalUser, "PNNL", "B1", "ahu1");
    expect(result.allowedSystems).toEqual([]);
    expect(prisma.prisma.unit.findMany).toHaveBeenCalled();
  });

  it("queries by user when not admin", async () => {
    const prisma = makePrisma();
    const { svc } = buildService(prisma);
    await svc.filterHistorianAccess(normalUser, "PNNL", "B1", "ahu1");
    expect(prisma.prisma.unit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ users: { some: { id: "u1" } } }) }),
    );
  });

  it("omits the user filter when admin", async () => {
    const prisma = makePrisma();
    const { svc } = buildService(prisma);
    await svc.filterHistorianAccess(adminUser, "PNNL", "B1", "ahu1");
    const whereArg = (prisma.prisma.unit.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereArg.users).toBeUndefined();
  });

  it("matches requested systems case-insensitively", async () => {
    const prisma = makePrisma();
    prisma.prisma.unit.findMany.mockResolvedValue([{ campus: "PNNL", building: "B1", system: "AHU1" }]);
    const { svc } = buildService(prisma);
    const result = await svc.filterHistorianAccess(normalUser, "PNNL", "B1", "ahu1");
    expect(result.allowedSystems).toEqual([{ campus: "PNNL", building: "B1", system: "AHU1" }]);
  });

  it("adds 'weather' as an allowed virtual system when requested", async () => {
    const prisma = makePrisma();
    prisma.prisma.unit.findMany.mockResolvedValue([{ campus: "PNNL", building: "B1", system: "AHU1" }]);
    const { svc } = buildService(prisma);
    const result = await svc.filterHistorianAccess(normalUser, "PNNL", "B1", "weather");
    expect(result.allowedSystems).toEqual([{ campus: "PNNL", building: "B1", system: "weather" }]);
  });

  it("adds 'meter' as an allowed virtual system when the non-admin has a unit in the building", async () => {
    const prisma = makePrisma();
    prisma.prisma.unit.findMany.mockResolvedValue([{ campus: "PNNL", building: "B1", system: "AHU1" }]);
    const { svc } = buildService(prisma);
    const result = await svc.filterHistorianAccess(normalUser, "PNNL", "B1", "meter");
    expect(result.allowedSystems).toEqual([{ campus: "PNNL", building: "B1", system: "meter" }]);
  });

  it("refuses weather and meter to a non-admin with no unit in the building", async () => {
    const prisma = makePrisma();
    prisma.prisma.unit.findMany.mockResolvedValue([]);
    const { svc } = buildService(prisma);
    const weather = await svc.filterHistorianAccess(normalUser, "PNNL", "B1", "weather");
    const meter = await svc.filterHistorianAccess(normalUser, "PNNL", "B1", "meter");
    expect(weather.allowedSystems).toEqual([]);
    expect(meter.allowedSystems).toEqual([]);
  });

  it("grants weather and meter to an admin regardless of unit assignments", async () => {
    const prisma = makePrisma();
    prisma.prisma.unit.findMany.mockResolvedValue([]);
    const { svc } = buildService(prisma);
    const weather = await svc.filterHistorianAccess(adminUser, "PNNL", "B1", "weather");
    const meter = await svc.filterHistorianAccess(adminUser, "PNNL", "B1", "meter");
    expect(weather.allowedSystems).toEqual([{ campus: "PNNL", building: "B1", system: "weather" }]);
    expect(meter.allowedSystems).toEqual([{ campus: "PNNL", building: "B1", system: "meter" }]);
  });

  it("supports a list of requested systems", async () => {
    const prisma = makePrisma();
    prisma.prisma.unit.findMany.mockResolvedValue([
      { campus: "PNNL", building: "B1", system: "AHU1" },
      { campus: "PNNL", building: "B1", system: "AHU2" },
    ]);
    const { svc } = buildService(prisma);
    const result = await svc.filterHistorianAccess(normalUser, "PNNL", "B1", ["ahu1", "weather"]);
    expect(result.allowedSystems).toHaveLength(2);
    expect(result.allowedSystems.map((s) => s.system).sort()).toEqual(["AHU1", "weather"]);
  });
});

describe("HistorianService.parseValue (private)", () => {
  it("returns null for null", () => {
    const { svc } = buildService();
    expect((svc as any).parseValue(null)).toBeNull();
  });

  it("returns null for the literal string 'null'", () => {
    const { svc } = buildService();
    expect((svc as any).parseValue("null")).toBeNull();
  });

  it("parses numeric strings", () => {
    const { svc } = buildService();
    expect((svc as any).parseValue("72.5")).toBe(72.5);
    expect((svc as any).parseValue("-3")).toBe(-3);
  });

  it("returns null for non-numeric strings", () => {
    const { svc } = buildService();
    expect((svc as any).parseValue("not-a-number")).toBeNull();
  });

  it("returns null for empty string", () => {
    const { svc } = buildService();
    expect((svc as any).parseValue("")).toBeNull();
  });
});

describe("HistorianService topic-id resolution & cache (private)", () => {
  it("resolveTopicId returns null when no topic row matches", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValue({ rows: [] });
    const result = await (svc as any).resolveTopicId("pnnl/b1/ahu1/foo");
    expect(result).toBeNull();
  });

  it("resolveTopicId caches the topic_id and skips the DB on a second call", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValueOnce({ rows: [{ topic_id: 42 }] });
    const first = await (svc as any).resolveTopicId("pnnl/b1/ahu1/foo");
    const second = await (svc as any).resolveTopicId("PNNL/B1/AHU1/FOO");
    expect(first).toBe(42);
    expect(second).toBe(42);
    expect(fakePool.query).toHaveBeenCalledTimes(1);
  });

  it("resolveTopicIds batch-fetches uncached paths and merges cached ones", async () => {
    const { svc, fakePool } = buildService();
    // Prime the cache for one path
    (svc as any).topicIdCache.set("a/x", 1);
    fakePool.query.mockResolvedValueOnce({ rows: [{ topic_id: 2, topic_name: "b/y" }] });
    const result = await (svc as any).resolveTopicIds(["a/x", "b/y", "c/z"]);
    expect(result.get("a/x")).toBe(1);
    expect(result.get("b/y")).toBe(2);
    expect(result.has("c/z")).toBe(false);
    expect(fakePool.query).toHaveBeenCalledTimes(1);
  });
});

describe("HistorianService lifecycle", () => {
  it("onModuleInit connects and releases without throwing on success", async () => {
    const { svc, fakePool } = buildService();
    await expect(svc.onModuleInit()).resolves.toBeUndefined();
    expect(fakePool.connect).toHaveBeenCalled();
  });

  it("onModuleInit swallows connection errors", async () => {
    const { svc, fakePool } = buildService();
    fakePool.connect.mockRejectedValue(new Error("boom"));
    await expect(svc.onModuleInit()).resolves.toBeUndefined();
  });

  it("onModuleDestroy ends the pool", async () => {
    const { svc, fakePool } = buildService();
    await svc.onModuleDestroy();
    expect(fakePool.end).toHaveBeenCalled();
  });
});

describe("HistorianService.getUnitCurrentValue", () => {
  it("returns null and an error when the topic is not found", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValueOnce({ rows: [] }); // resolveTopicId
    const result = await svc.getUnitCurrentValue("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature);
    expect(result).toBeNull();
  });

  it("returns null when no data rows exist for the topic", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query
      .mockResolvedValueOnce({ rows: [{ topic_id: 42 }] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await svc.getUnitCurrentValue("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature);
    expect(result).toBeNull();
  });

  it("returns the latest value when data is found", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query
      .mockResolvedValueOnce({ rows: [{ topic_id: 42 }] })
      .mockResolvedValueOnce({ rows: [{ ts: "2026-06-01T00:00:00.000Z", value_string: "72.5" }] });
    const result = await svc.getUnitCurrentValue("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature);
    expect(result).not.toBeNull();
    expect(result?.value).toBe(72.5);
    expect(result?.timestamp).toEqual(new Date("2026-06-01T00:00:00.000Z"));
  });
});

describe("HistorianService.getWeatherCurrentValue", () => {
  it("returns null when no topic is found", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValueOnce({ rows: [] });
    const result = await svc.getWeatherCurrentValue("PNNL", "B1", WeatherMetric.AirTemperature);
    expect(result).toBeNull();
  });

  it("returns the latest value with system='weather'", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query
      .mockResolvedValueOnce({ rows: [{ topic_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ ts: "2026-06-01T00:00:00.000Z", value_string: "55" }] });
    const result = await svc.getWeatherCurrentValue("PNNL", "B1", WeatherMetric.AirTemperature);
    expect(result?.system).toBe("weather");
    expect(result?.value).toBe(55);
  });
});

describe("HistorianService.getMeterCurrentValue", () => {
  it("returns null when no topic is found", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValueOnce({ rows: [] });
    const result = await svc.getMeterCurrentValue("PNNL", "B1", MeterMetric.Power);
    expect(result).toBeNull();
  });

  it("returns the latest value with system='meter'", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query
      .mockResolvedValueOnce({ rows: [{ topic_id: 9 }] })
      .mockResolvedValueOnce({ rows: [{ ts: "2026-06-01T00:00:00.000Z", value_string: "1000" }] });
    const result = await svc.getMeterCurrentValue("PNNL", "B1", MeterMetric.Power);
    expect(result?.system).toBe("meter");
    expect(result?.value).toBe(1000);
  });
});

describe("HistorianService.getUnitTimeSeries", () => {
  it("returns empty data with topic-not-found error when topic missing", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValueOnce({ rows: [] });
    const start = new Date("2026-06-01T00:00:00Z");
    const end = new Date("2026-06-02T00:00:00Z");
    const result = await svc.getUnitTimeSeries("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature, start, end);
    expect(result.data).toEqual([]);
    expect(result.metadata.errors[0]).toMatch(/No data found/);
  });

  it("returns data points when query returns rows", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query
      .mockResolvedValueOnce({ rows: [{ topic_id: 42 }] })
      .mockResolvedValueOnce({
        rows: [
          { timestamp: new Date("2026-06-01T00:00:00Z"), value: 72.0 },
          { timestamp: new Date("2026-06-01T01:00:00Z"), value: 72.5 },
        ],
      });
    const start = new Date("2026-06-01T00:00:00Z");
    const end = new Date("2026-06-02T00:00:00Z");
    const result = await svc.getUnitTimeSeries("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature, start, end);
    expect(result.data).toHaveLength(2);
  });
});

describe("HistorianService.getWeatherTimeSeries", () => {
  it("returns empty data with error when topic missing", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValueOnce({ rows: [] });
    const result = await svc.getWeatherTimeSeries(
      "PNNL",
      "B1",
      WeatherMetric.AirTemperature,
      new Date(0),
      new Date(1000),
    );
    expect(result.data).toEqual([]);
    expect(result.system).toBe("weather");
  });
});

describe("HistorianService.getMeterTimeSeries", () => {
  it("returns empty data with error when topic missing", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValueOnce({ rows: [] });
    const result = await svc.getMeterTimeSeries(
      "PNNL",
      "B1",
      MeterMetric.Power,
      new Date(0),
      new Date(1000),
    );
    expect(result.data).toEqual([]);
    expect(result.system).toBe("meter");
  });
});

// scenario: historian-down-or-empty
describe("historian query error paths", () => {
  const start = new Date("2026-06-01T00:00:00Z");
  const end = new Date("2026-06-02T00:00:00Z");

  it("empty topic resolves to empty data and a non-thrown metadata error", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValueOnce({ rows: [] });
    const result = await svc.getUnitTimeSeries("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature, start, end);
    expect(result.data).toEqual([]);
    expect(result.metadata.errors[0]).toMatch(/No data found/);
  });

  it("missing topic for weather and meter likewise yields no data, no throw", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockResolvedValue({ rows: [] });
    await expect(
      svc.getWeatherTimeSeries("PNNL", "B1", WeatherMetric.AirTemperature, start, end),
    ).resolves.toMatchObject({ data: [] });
    await expect(
      svc.getMeterTimeSeries("PNNL", "B1", MeterMetric.Power, start, end),
    ).resolves.toMatchObject({ data: [] });
  });

  it("historian down bubbles up as a thrown error from the data query", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query
      .mockResolvedValueOnce({ rows: [{ topic_id: 42 }] })
      .mockRejectedValueOnce(new Error("ECONNREFUSED 10.0.0.5:5432"));
    await expect(
      svc.getUnitTimeSeries("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature, start, end),
    ).rejects.toThrow(/ECONNREFUSED/);
  });

  it("historian down on current-value queries also throws", async () => {
    const { svc, fakePool } = buildService();
    fakePool.query.mockRejectedValueOnce(new Error("historian unreachable"));
    await expect(
      svc.getUnitCurrentValue("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature),
    ).rejects.toThrow(/unreachable/);
  });
});

// scenario: historian-reads-utc
describe("historian timestamp handling is UTC", () => {
  const originalTZ = process.env.TZ;
  afterEach(() => {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  });

  it("passes the exact Date through to Postgres as a timestamptz-cast parameter when binned", async () => {
    const { svc, fakePool } = buildService();
    // Range beyond the 48h threshold forces binned mode, whose SQL carries
    // the ::timestamptz cast.
    const start = new Date("2026-06-01T00:00:00.000Z");
    const end = new Date("2026-06-10T00:00:00.000Z");
    fakePool.query
      .mockResolvedValueOnce({ rows: [{ topic_id: 42 }] })
      .mockResolvedValueOnce({ rows: [] });

    await svc.getUnitTimeSeries("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature, start, end);

    const [sql, params] = fakePool.query.mock.calls[1];
    expect(sql).toMatch(/::timestamptz/);
    expect(params[1]).toBe(start);
    expect(params[2]).toBe(end);
  });

  it("returns row timestamps as Date instances whose epoch is independent of the server TZ", async () => {
    const start = new Date("2026-06-01T00:00:00.000Z");
    const end = new Date("2026-06-01T02:00:00.000Z");
    const dbTs = new Date("2026-06-01T01:00:00.000Z");

    async function readUnderTZ(tz: string): Promise<number> {
      process.env.TZ = tz;
      const { svc, fakePool } = buildService();
      fakePool.query
        .mockResolvedValueOnce({ rows: [{ topic_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ timestamp: dbTs, value: 72 }] });
      const result = await svc.getUnitTimeSeries("PNNL", "B1", "ahu1", UnitMetric.ZoneTemperature, start, end);
      expect(result.data).toHaveLength(1);
      return result.data[0].timestamp.getTime();
    }

    const utc = await readUnderTZ("UTC");
    const anchorage = await readUnderTZ("America/Anchorage");
    expect(utc).toBe(dbTs.getTime());
    expect(anchorage).toBe(dbTs.getTime());
  });
});

// scenario: binning-and-interval-cap
describe("HistorianService bucketing and client-interval cap", () => {
  it("returns raw mode when the range is at or under the configured threshold", () => {
    const { svc } = buildService(makePrisma(), makeConfig({ binning: { count: 500, start: 48, unit: "hours" } }));
    const start = new Date("2026-06-01T00:00:00Z");
    const underEnd = new Date(start.getTime() + 48 * 3_600_000);
    const overEnd = new Date(start.getTime() + 48 * 3_600_000 + 60_000);
    expect((svc as any).resolveBucketing(start, underEnd).mode).toBe("raw");
    expect((svc as any).resolveBucketing(start, overEnd).mode).toBe("binned");
  });

  it("targets roughly `binning.count` buckets on a longer range", () => {
    const { svc } = buildService(makePrisma(), makeConfig({ binning: { count: 500, start: 48, unit: "hours" } }));
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-12-31T00:00:00Z"); // ~1 year
    const bucket = (svc as any).deriveBucketInterval(start, end);
    const buckets = (end.getTime() - start.getTime()) / bucket.ms;
    // 1 year / "nice" snap: 10 min is way too fine, 1 week too coarse. 1 day lands ~365 buckets.
    expect(buckets).toBeGreaterThan(100);
    expect(buckets).toBeLessThan(1000);
    expect(bucket.sql).toMatch(/^\d+ seconds$/);
  });

  it("honours a client interval exactly when it stays within the 5,000-bucket cap", () => {
    const start = new Date("2026-06-01T00:00:00Z");
    const end = new Date("2026-06-01T02:00:00Z"); // 2h, "5m" -> 24 buckets
    expect(
      HistorianService.capClientInterval({ sql: "5 minutes", ms: 300_000 }, end.getTime() - start.getTime()),
    ).toEqual({ sql: "5 minutes", ms: 300_000 });
  });

  it("coarsens a finer-than-allowed client interval to fit the cap", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-12-31T00:00:00Z"); // ~364 days
    const rangeMs = end.getTime() - start.getTime();
    // "10s" over a year is ~3.15M buckets, far above 5,000.
    const capped = HistorianService.capClientInterval({ sql: "10 seconds", ms: 10_000 }, rangeMs);
    const buckets = rangeMs / capped.ms;
    expect(buckets).toBeLessThanOrEqual(HistorianService.MAX_BUCKETS);
    expect(capped.ms).toBeGreaterThan(10_000);
    expect(capped.sql).toMatch(/^\d+ seconds$/);
  });

  it("resolveBucketing applies the cap through to its returned SQL", () => {
    const { svc } = buildService();
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-12-31T00:00:00Z");
    const result = (svc as any).resolveBucketing(start, end, "10s") as { mode: "binned"; sql: string; ms: number };
    expect(result.mode).toBe("binned");
    const buckets = (end.getTime() - start.getTime()) / result.ms;
    expect(buckets).toBeLessThanOrEqual(HistorianService.MAX_BUCKETS);
  });
});
