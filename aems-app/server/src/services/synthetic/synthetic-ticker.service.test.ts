import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppConfigService } from "@/app.config";
import { SyntheticTickerService } from "./synthetic-ticker.service";
import { SyntheticHistorianWriter } from "./historian.writer";
import { SyntheticService, TopicRegistry } from "./synthetic.service";

const topicIds = new Map<string, number>([
  ["DEMO_C1/BLDG_A/weather/air_temperature", 100],
  ["DEMO_C1/BLDG_A/weather/relative_humidity", 101],
]);

function miniRegistry(): TopicRegistry {
  return {
    units: [{ id: "u1", campus: "DEMO_C1", building: "BLDG_A", system: "RTU_1" }],
    buildings: [{ campus: "DEMO_C1", building: "BLDG_A" }],
    topicIds,
  };
}

function makeConfig(overrides: Partial<{ ticker: boolean; historianDays: number; tickSeconds: number }> = {}): AppConfigService {
  return {
    instanceName: "synth",
    instanceType: "synth",
    service: {
      synthetic: {
        seed: "seed-alpha",
        historianDays: overrides.historianDays ?? 1,
        tickSeconds: overrides.tickSeconds ?? 5,
        campusPrefix: "DEMO_",
        ticker: overrides.ticker ?? true,
      },
    },
  } as unknown as AppConfigService;
}

async function build(
  config: AppConfigService,
  syntheticValue: Partial<SyntheticService>,
  writerValue: Partial<SyntheticHistorianWriter> = {},
): Promise<{ ticker: SyntheticTickerService; writer: SyntheticHistorianWriter; module: TestingModule }> {
  const writer = {
    tickInsert: jest.fn().mockResolvedValue(undefined),
    pruneOlderThan: jest.fn().mockResolvedValue(0),
    ...writerValue,
  } as unknown as SyntheticHistorianWriter;
  const module = await Test.createTestingModule({
    providers: [
      SyntheticTickerService,
      { provide: AppConfigService.Key, useValue: config },
      { provide: SyntheticHistorianWriter, useValue: writer },
      { provide: SyntheticService, useValue: syntheticValue },
    ],
  }).compile();
  return { ticker: module.get(SyntheticTickerService), writer, module };
}

describe("SyntheticTickerService", () => {
  const modules: TestingModule[] = [];
  const now = new Date("2026-06-15T12:00:00Z");

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "debug").mockImplementation(() => undefined);
    jest.useFakeTimers({ now, doNotFake: ["nextTick", "setImmediate", "queueMicrotask"] });
  });
  afterEach(async () => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    for (const m of modules) {
      const t = m.get(SyntheticTickerService, { strict: false }) as unknown as { onModuleDestroy?: () => void };
      t?.onModuleDestroy?.();
      await m.close();
    }
    modules.length = 0;
  });

  // scenario: demo-history-gapless-bounded (pruning half)
  it("prunes rows older than the window on each tick", async () => {
    const synthetic: Partial<SyntheticService> = {
      backfillReady: Promise.resolve(),
      loadRegistry: jest.fn().mockResolvedValue(miniRegistry()),
      collectTickValues: jest.fn().mockReturnValue([[100, 72]]),
    };
    const b = await build(makeConfig({ ticker: true, historianDays: 1, tickSeconds: 5 }), synthetic);
    modules.push(b.module);

    b.ticker.onModuleInit();
    // Let backfillReady resolve and the first tick arm.
    await jest.advanceTimersByTimeAsync(0);
    // Fire the first tick (interval = max(5000, 5*1000) = 5000ms).
    await jest.advanceTimersByTimeAsync(5000);

    const pruneCalls = (b.writer.pruneOlderThan as jest.Mock).mock.calls;
    expect(pruneCalls).toHaveLength(1);
    const [topicIdsArg, cutoffArg] = pruneCalls[0];
    // Window is one day; cutoff is tick time minus one day.
    expect(cutoffArg).toBeInstanceOf(Date);
    expect((cutoffArg as Date).getTime()).toBe(now.getTime() - 86_400_000);
    expect(new Set(topicIdsArg)).toEqual(new Set(topicIds.values()));
    expect(b.writer.tickInsert).toHaveBeenCalledTimes(1);
  });

  it("does not start the ticker until backfillReady resolves (seeder-waits-for-historian)", async () => {
    let resolveBackfill!: () => void;
    const backfillReady = new Promise<void>((r) => (resolveBackfill = r));
    const synthetic: Partial<SyntheticService> = {
      backfillReady,
      loadRegistry: jest.fn().mockResolvedValue(miniRegistry()),
      collectTickValues: jest.fn().mockReturnValue([]),
    };
    const b = await build(makeConfig({ ticker: true, tickSeconds: 5 }), synthetic);
    modules.push(b.module);

    b.ticker.onModuleInit();
    // Advance well past the tick interval — but backfill has not resolved, so no tick fires.
    await jest.advanceTimersByTimeAsync(60_000);
    expect(b.writer.tickInsert).not.toHaveBeenCalled();

    resolveBackfill();
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(5000);
    expect(b.writer.tickInsert).toHaveBeenCalledTimes(1);
  });
});
