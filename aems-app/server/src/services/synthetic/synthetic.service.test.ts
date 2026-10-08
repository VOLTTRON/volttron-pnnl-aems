import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SyntheticService, TopicRegistry } from "./synthetic.service";
import { SyntheticHistorianWriter } from "./historian.writer";
import { SyntheticTopologyService, SyntheticUnit } from "./topology.service";

function registry(): TopicRegistry {
  const units: SyntheticUnit[] = [
    { id: "u1", campus: "DEMO_C1", building: "BLDG_A", system: "RTU_1" },
    { id: "u2", campus: "DEMO_C1", building: "BLDG_A", system: "RTU_2" },
  ];
  const buildings = [{ campus: "DEMO_C1", building: "BLDG_A" }];
  const topicIds = new Map<string, number>();
  // Every topic the service might ask for -- `collectTickValues` skips any absent, so a full map
  // is the only way to see every value a seed produces.
  let next = 1;
  for (const u of units) {
    for (const metric of [
      "ZoneTemperature", "ZoneHumidity", "OutdoorAirTemperature",
      "OccupiedCoolingSetPoint", "OccupiedHeatingSetPoint",
      "UnoccupiedCoolingSetPoint", "UnoccupiedHeatingSetPoint",
      "CoolingDemand", "HeatingDemand",
      "SupplyFanStatus", "FirstStageCooling", "SecondStageCooling",
      "FirstStageHeating", "AuxiliaryHeatCommand", "ReversingValve", "OccupancyCommand",
    ]) {
      topicIds.set(`${u.campus}/${u.building}/${u.system}/${metric}`, next++);
    }
  }
  for (const b of buildings) {
    for (const topic of ["air_temperature", "relative_humidity", "wind_speed"]) {
      topicIds.set(`${b.campus}/${b.building}/weather/${topic}`, next++);
    }
    for (const metric of ["WholeBuildingPower", "Demand"]) {
      topicIds.set(`${b.campus}/${b.building}/meter/${metric}`, next++);
    }
  }
  return { units, buildings, topicIds };
}

function makeConfig(overrides: Partial<{ seed: string; historianDays: number }> = {}): AppConfigService {
  return {
    instanceName: "synth",
    instanceType: "synth",
    service: {
      synthetic: {
        seed: overrides.seed ?? "seed-alpha",
        historianDays: overrides.historianDays ?? 1,
        tickSeconds: 60,
        campusPrefix: "DEMO_",
        ticker: false,
      },
    },
  } as unknown as AppConfigService;
}

async function build(
  config: AppConfigService,
  writerValue: Partial<SyntheticHistorianWriter> = {},
  topologyValue: Partial<SyntheticTopologyService> = { apply: jest.fn() },
): Promise<{ service: SyntheticService; module: TestingModule }> {
  const module = await Test.createTestingModule({
    providers: [
      SyntheticService,
      { provide: AppConfigService.Key, useValue: config },
      { provide: PrismaService, useValue: { prisma: {} } },
      { provide: SyntheticTopologyService, useValue: topologyValue },
      {
        provide: SyntheticHistorianWriter,
        useValue: {
          ensureTopics: jest.fn().mockResolvedValue(new Map()),
          latestRowTs: jest.fn().mockResolvedValue(null),
          pruneOlderThan: jest.fn().mockResolvedValue(0),
          copyTopic: jest.fn().mockResolvedValue(0),
          tickInsert: jest.fn().mockResolvedValue(undefined),
          ...writerValue,
        },
      },
    ],
  }).compile();
  return { service: module.get(SyntheticService), module };
}

describe("SyntheticService.collectTickValues", () => {
  const modules: TestingModule[] = [];
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    for (const m of modules) await m.close();
    modules.length = 0;
  });

  // scenario: demo-values-follow-seed
  it("gives the same values for the same SYNTHETIC_SEED, and different values for a different one", async () => {
    const r = registry();
    const ts = new Date(Date.UTC(2026, 5, 15, 12, 0, 0));

    const a1 = await build(makeConfig({ seed: "seed-alpha" })); modules.push(a1.module);
    const a2 = await build(makeConfig({ seed: "seed-alpha" })); modules.push(a2.module);
    const b1 = await build(makeConfig({ seed: "seed-beta" }));  modules.push(b1.module);

    const vA1 = a1.service.collectTickValues(r, ts);
    const vA2 = a2.service.collectTickValues(r, ts);
    const vB1 = b1.service.collectTickValues(r, ts);

    expect(vA1).toEqual(vA2);

    const differs = vA1.some(([id, v], i) => {
      const [idB, vB] = vB1[i];
      return id !== idB || v !== vB;
    });
    expect(differs).toBe(true);
  });
});

describe("SyntheticService.task — backfill", () => {
  const modules: TestingModule[] = [];
  // 2026-06-15 12:00:00 UTC — the backfill window ends here, truncated to the minute.
  const now = new Date("2026-06-15T12:00:00Z");

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.useFakeTimers({ now, doNotFake: ["nextTick", "setImmediate", "queueMicrotask"] });
  });
  afterEach(async () => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    for (const m of modules) await m.close();
    modules.length = 0;
  });

  // scenario: demo-history-gapless-bounded
  // Fills from max(latestRowTs + 1 min, windowStart) to now. Rows older than the window
  // start are left in place for the ticker to prune.
  it("fills from the window start when the topic has no rows", async () => {
    const copyCalls: { topicId: number; first: Date | undefined; last: Date | undefined; count: number }[] = [];
    const topics = new Map<string, number>();
    topics.set("DEMO_C1/BLDG_A/weather/air_temperature", 100);
    topics.set("DEMO_C1/BLDG_A/weather/relative_humidity", 101);
    topics.set("DEMO_C1/BLDG_A/weather/wind_speed", 102);

    const topology = {
      apply: jest.fn().mockResolvedValue({
        units: [],
        buildings: [{ campus: "DEMO_C1", building: "BLDG_A" }],
      }),
    };
    const writer = {
      ensureTopics: jest.fn().mockResolvedValue(topics),
      latestRowTs: jest.fn().mockResolvedValue(null),
      copyTopic: jest.fn(async (topicId: number, iter: Iterable<[Date, number]>) => {
        const arr = Array.from(iter);
        copyCalls.push({ topicId, first: arr[0]?.[0], last: arr.at(-1)?.[0], count: arr.length });
        return arr.length;
      }),
    };

    const b = await build(makeConfig({ historianDays: 1 }), writer, topology);
    modules.push(b.module);
    await b.service.task();

    // Three weather topics all starting from windowStart (now - 1 day).
    expect(copyCalls).toHaveLength(3);
    const windowStart = new Date(now.getTime() - 86_400_000);
    for (const call of copyCalls) {
      expect(call.first?.getTime()).toBe(windowStart.getTime());
      // One sample per minute over 24 h = 1440 samples; the last one is 1 min before now.
      expect(call.count).toBe(1440);
    }
  });

  it("fills from the latest row + 1 minute when it is inside the window, keeping earlier rows untouched", async () => {
    const copyCalls: { topicId: number; first: Date | undefined; count: number }[] = [];
    const topics = new Map<string, number>();
    topics.set("DEMO_C1/BLDG_A/weather/air_temperature", 100);

    // Latest row is 10 minutes before now — the gap to fill is minutes, not days.
    const latest = new Date(now.getTime() - 10 * 60_000);

    const topology = {
      apply: jest.fn().mockResolvedValue({
        units: [],
        buildings: [{ campus: "DEMO_C1", building: "BLDG_A" }],
      }),
    };
    const writer = {
      ensureTopics: jest.fn().mockResolvedValue(topics),
      // Only the air_temperature topic has data; the other two have none and should fill the full window.
      latestRowTs: jest.fn((topicId: number) => Promise.resolve(topicId === 100 ? latest : null)),
      copyTopic: jest.fn(async (topicId: number, iter: Iterable<[Date, number]>) => {
        const arr = Array.from(iter);
        copyCalls.push({ topicId, first: arr[0]?.[0], count: arr.length });
        return arr.length;
      }),
    };

    const b = await build(makeConfig({ historianDays: 1 }), writer, topology);
    modules.push(b.module);
    await b.service.task();

    const air = copyCalls.find((c) => c.topicId === 100);
    // Fills from latest + 1 minute, not from the window start — earlier rows are kept.
    expect(air?.first?.getTime()).toBe(latest.getTime() + 60_000);
    expect(air?.count).toBe(9); // 10-minute gap, one sample per minute, first at latest+1min
    // The window start would have given 1440 samples, so we are not refilling the whole window.
    expect(air?.count).not.toBe(1440);
  });

  it("fills nothing when the latest row is already at or past the end of the window", async () => {
    const topics = new Map<string, number>();
    topics.set("DEMO_C1/BLDG_A/weather/air_temperature", 100);
    topics.set("DEMO_C1/BLDG_A/weather/relative_humidity", 101);
    topics.set("DEMO_C1/BLDG_A/weather/wind_speed", 102);

    const topology = {
      apply: jest.fn().mockResolvedValue({
        units: [],
        buildings: [{ campus: "DEMO_C1", building: "BLDG_A" }],
      }),
    };
    const copyTopic = jest.fn();
    const writer = {
      ensureTopics: jest.fn().mockResolvedValue(topics),
      // Every topic has a row at `now` already — nothing left to fill.
      latestRowTs: jest.fn().mockResolvedValue(now),
      copyTopic,
    };

    const b = await build(makeConfig({ historianDays: 1 }), writer, topology);
    modules.push(b.module);
    await b.service.task();

    expect(copyTopic).not.toHaveBeenCalled();
  });
});

describe("SyntheticService.execute — retry (seeder-waits-for-historian)", () => {
  const modules: TestingModule[] = [];
  const now = new Date("2026-06-15T12:00:00Z");

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.useFakeTimers({ now, doNotFake: ["nextTick", "setImmediate", "queueMicrotask"] });
  });
  afterEach(async () => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    for (const m of modules) await m.close();
    modules.length = 0;
  });

  // scenario: seeder-waits-for-historian
  it("reruns task() while the historian refuses connections, and resolves backfillReady only on success", async () => {
    const topology = {
      apply: jest
        .fn()
        .mockRejectedValueOnce(new Error("ECONNREFUSED 5432"))
        .mockRejectedValueOnce(new Error("ECONNREFUSED 5432"))
        .mockResolvedValue({ units: [], buildings: [] }),
    };
    const writer = {
      ensureTopics: jest.fn().mockResolvedValue(new Map()),
      latestRowTs: jest.fn().mockResolvedValue(null),
      copyTopic: jest.fn().mockResolvedValue(0),
    };
    const b = await build(makeConfig(), writer, topology);
    modules.push(b.module);
    b.service.retryMs = 10; // short, deterministic

    let resolved = false;
    void b.service.backfillReady.then(() => (resolved = true));

    const run = b.service.execute();

    // First attempt rejects immediately; the retry waits retryMs before the next try.
    await Promise.resolve();
    expect(topology.apply).toHaveBeenCalledTimes(1);
    expect(resolved).toBe(false);

    // One retry delay — second attempt also rejects.
    await jest.advanceTimersByTimeAsync(10);
    expect(topology.apply).toHaveBeenCalledTimes(2);
    expect(resolved).toBe(false);

    // Another retry delay — third attempt succeeds, backfillReady resolves.
    await jest.advanceTimersByTimeAsync(10);
    await run;
    expect(topology.apply).toHaveBeenCalledTimes(3);
    expect(resolved).toBe(true);
  });

  it("does not resolve backfillReady when the service is destroyed before any task succeeds", async () => {
    const topology = { apply: jest.fn().mockRejectedValue(new Error("ECONNREFUSED 5432")) };
    const b = await build(makeConfig(), {}, topology);
    modules.push(b.module);
    b.service.retryMs = 10;

    let resolved = false;
    void b.service.backfillReady.then(() => (resolved = true));

    const run = b.service.execute();
    await Promise.resolve();
    expect(topology.apply).toHaveBeenCalledTimes(1);

    b.service.onModuleDestroy();
    await jest.advanceTimersByTimeAsync(10);
    await run;
    expect(resolved).toBe(false);
  });
});
