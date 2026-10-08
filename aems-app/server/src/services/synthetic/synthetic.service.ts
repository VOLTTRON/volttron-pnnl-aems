import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Timeout } from "@nestjs/schedule";
import { BaseService } from "..";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SyntheticTopologyService, SyntheticUnit } from "./topology.service";
import { SyntheticHistorianWriter } from "./historian.writer";
import {
  MeterSample,
  UnitSample,
  Weather,
  meterAt,
  seedFor,
  unitAt,
  weatherAt,
} from "./curves";

const UNIT_METRICS: (keyof UnitSample)[] = [
  "ZoneTemperature",
  "ZoneHumidity",
  "OutdoorAirTemperature",
  "OccupiedCoolingSetPoint",
  "OccupiedHeatingSetPoint",
  "UnoccupiedCoolingSetPoint",
  "UnoccupiedHeatingSetPoint",
  "CoolingDemand",
  "HeatingDemand",
  "SupplyFanStatus",
  "FirstStageCooling",
  "SecondStageCooling",
  "FirstStageHeating",
  "AuxiliaryHeatCommand",
  "ReversingValve",
  "OccupancyCommand",
];
const WEATHER_METRICS: { key: keyof Weather; topic: string }[] = [
  { key: "airTemperature", topic: "air_temperature" },
  { key: "relativeHumidity", topic: "relative_humidity" },
  { key: "windSpeed", topic: "wind_speed" },
];
const METER_METRICS: (keyof MeterSample)[] = ["WholeBuildingPower", "Demand"];

const UNIT_CONFIG = { coolingSetpoint: 74, heatingSetpoint: 68 };

const SAMPLE_INTERVAL_MS = 60_000;
const DEFAULT_RETRY_MS = 30_000;

export interface TopicRegistry {
  units: SyntheticUnit[];
  buildings: { campus: string; building: string }[];
  topicIds: Map<string, number>;
}

@Injectable()
export class SyntheticService extends BaseService implements OnModuleDestroy {
  private readonly logger = new Logger(SyntheticService.name);

  /** Resolves once task() has finished successfully; the ticker waits on this. */
  readonly backfillReady: Promise<void>;
  private resolveBackfillReady!: () => void;
  private stopped = false;
  retryMs = DEFAULT_RETRY_MS;

  constructor(
    @Inject(AppConfigService.Key) private readonly configService: AppConfigService,
    private readonly prismaService: PrismaService,
    private readonly topologyService: SyntheticTopologyService,
    private readonly writer: SyntheticHistorianWriter,
  ) {
    super("synth", configService);
    this.backfillReady = new Promise<void>((resolve) => {
      this.resolveBackfillReady = resolve;
    });
  }

  onModuleDestroy(): void {
    this.stopped = true;
  }

  @Timeout(1000)
  async execute(): Promise<void> {
    // Nest's schedule invokes this decorated method more than once (once
    // for the decorated subclass and once via the inherited base). We
    // only want to signal backfill-complete after the invocation that
    // actually ran task() — the redundant call sees running=true and
    // schedule() returns false.
    if (!(this as unknown as { schedule: () => boolean }).schedule()) return;
    try {
      let attempt = 0;
      while (!this.stopped) {
        attempt++;
        try {
          await this.task();
          this.resolveBackfillReady();
          return;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Synthetic seeder attempt ${attempt} failed: ${msg}. Retrying in ${this.retryMs}ms...`,
          );
          await this.sleep(this.retryMs);
        }
      }
    } finally {
      (this as unknown as { running: boolean }).running = false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async task(): Promise<void> {
    const { seed, historianDays } = this.configService.service.synthetic;
    this.logger.log(`Running synthetic seeder (seed=${seed}, days=${historianDays})...`);

    const { units, buildings } = await this.topologyService.apply();

    const topicNames = this.buildTopicNames(units, buildings);
    const topicIds = await this.writer.ensureTopics(topicNames);
    this.logger.log(`Historian topics ready: ${topicIds.size}`);

    const end = new Date();
    end.setUTCSeconds(0, 0);
    const start = new Date(end.getTime() - historianDays * 86_400_000);

    const total = await this.backfill({ units, buildings, topicIds }, start, end);
    this.logger.log(`Historian backfill complete: ${total.toLocaleString()} rows written this run.`);
  }

  buildTopicNames(
    units: SyntheticUnit[],
    buildings: { campus: string; building: string }[],
  ): string[] {
    const names: string[] = [];
    for (const u of units) {
      for (const metric of UNIT_METRICS) {
        names.push(`${u.campus}/${u.building}/${u.system}/${metric}`);
      }
    }
    for (const b of buildings) {
      for (const m of WEATHER_METRICS) {
        names.push(`${b.campus}/${b.building}/weather/${m.topic}`);
      }
      for (const m of METER_METRICS) {
        names.push(`${b.campus}/${b.building}/meter/${m}`);
      }
    }
    return names;
  }

  private async backfill(registry: TopicRegistry, start: Date, end: Date): Promise<number> {
    const { units, buildings, topicIds } = registry;
    const windowStartMs = start.getTime();
    const endMs = end.getTime();
    let total = 0;

    const fillStartMs = async (topicId: number): Promise<number> => {
      const latest = await this.writer.latestRowTs(topicId);
      const nextSampleMs = latest ? latest.getTime() + SAMPLE_INTERVAL_MS : windowStartMs;
      return Math.max(nextSampleMs, windowStartMs);
    };

    const runCopy = async (
      topicId: number,
      build: (startMs: number, endMs: number) => Iterable<[Date, number]>,
    ): Promise<number> => {
      const startMs = await fillStartMs(topicId);
      if (startMs >= endMs) return 0;
      return this.writer.copyTopic(topicId, build(startMs, endMs));
    };

    const baseSeed = this.configService.service.synthetic.seed;

    for (const b of buildings) {
      const buildingSeed = seedFor("weather", baseSeed, b.campus, b.building);
      const buildingUnits = units.filter((u) => u.campus === b.campus && u.building === b.building);
      const buildingTotalBefore = total;

      for (const m of WEATHER_METRICS) {
        const topicId = topicIds.get(`${b.campus}/${b.building}/weather/${m.topic}`);
        if (topicId === undefined) continue;
        total += await runCopy(topicId, (sMs, eMs) => this.iterateWeather(b, buildingSeed, m.key, sMs, eMs));
      }

      for (const metric of METER_METRICS) {
        const topicId = topicIds.get(`${b.campus}/${b.building}/meter/${metric}`);
        if (topicId === undefined) continue;
        total += await runCopy(topicId, (sMs, eMs) =>
          this.iterateMeter(b, buildingSeed, buildingUnits.length, metric, sMs, eMs),
        );
      }

      for (const u of buildingUnits) {
        const unitSeed = seedFor("unit", baseSeed, u.campus, u.building, u.system);
        for (const metric of UNIT_METRICS) {
          const topicId = topicIds.get(`${u.campus}/${u.building}/${u.system}/${metric}`);
          if (topicId === undefined) continue;
          total += await runCopy(topicId, (sMs, eMs) =>
            this.iterateUnit(b, buildingSeed, u, unitSeed, metric, sMs, eMs),
          );
        }
      }
      const filledThisBuilding = total - buildingTotalBefore;
      this.logger.log(
        `Backfilled ${b.campus}/${b.building}: ${filledThisBuilding.toLocaleString()} new rows.`,
      );
    }
    return total;
  }

  private *iterateWeather(
    b: { campus: string; building: string },
    buildingSeed: number,
    key: keyof Weather,
    startMs: number,
    endMs: number,
  ): Iterable<[Date, number]> {
    for (let ms = startMs; ms < endMs; ms += SAMPLE_INTERVAL_MS) {
      const ts = new Date(ms);
      yield [ts, weatherAt(ts, buildingSeed)[key]];
    }
  }

  private *iterateMeter(
    b: { campus: string; building: string },
    buildingSeed: number,
    unitCount: number,
    key: keyof MeterSample,
    startMs: number,
    endMs: number,
  ): Iterable<[Date, number]> {
    for (let ms = startMs; ms < endMs; ms += SAMPLE_INTERVAL_MS) {
      const ts = new Date(ms);
      const w = weatherAt(ts, buildingSeed);
      yield [ts, meterAt(ts, buildingSeed, w, unitCount)[key]];
    }
  }

  private *iterateUnit(
    b: { campus: string; building: string },
    buildingSeed: number,
    u: SyntheticUnit,
    unitSeed: number,
    key: keyof UnitSample,
    startMs: number,
    endMs: number,
  ): Iterable<[Date, number]> {
    for (let ms = startMs; ms < endMs; ms += SAMPLE_INTERVAL_MS) {
      const ts = new Date(ms);
      const w = weatherAt(ts, buildingSeed);
      yield [ts, unitAt(ts, unitSeed, w, UNIT_CONFIG)[key]];
    }
  }

  collectTickValues(registry: TopicRegistry, ts: Date): [number, number][] {
    const values: [number, number][] = [];
    const { units, buildings, topicIds } = registry;
    const baseSeed = this.configService.service.synthetic.seed;
    for (const b of buildings) {
      const buildingSeed = seedFor("weather", baseSeed, b.campus, b.building);
      const w = weatherAt(ts, buildingSeed);
      for (const m of WEATHER_METRICS) {
        const topicId = topicIds.get(`${b.campus}/${b.building}/weather/${m.topic}`);
        if (topicId !== undefined) values.push([topicId, w[m.key]]);
      }
      const buildingUnits = units.filter((u) => u.campus === b.campus && u.building === b.building);
      const meter = meterAt(ts, buildingSeed, w, buildingUnits.length);
      for (const metric of METER_METRICS) {
        const topicId = topicIds.get(`${b.campus}/${b.building}/meter/${metric}`);
        if (topicId !== undefined) values.push([topicId, meter[metric]]);
      }
      for (const u of buildingUnits) {
        const unitSeed = seedFor("unit", baseSeed, u.campus, u.building, u.system);
        const sample = unitAt(ts, unitSeed, w, UNIT_CONFIG);
        for (const metric of UNIT_METRICS) {
          const topicId = topicIds.get(`${u.campus}/${u.building}/${u.system}/${metric}`);
          if (topicId !== undefined) values.push([topicId, sample[metric]]);
        }
      }
    }
    return values;
  }

  async loadRegistry(): Promise<TopicRegistry | null> {
    const prefix = this.configService.service.synthetic.campusPrefix;
    if (!prefix) {
      this.logger.warn("SYNTHETIC_CAMPUS_PREFIX is empty; refusing to load the registry without a prefix.");
      return null;
    }
    const rawUnits = await this.prismaService.prisma.unit.findMany({
      where: { campus: { startsWith: prefix } },
      select: { id: true, campus: true, building: true, system: true },
      orderBy: [{ campus: "asc" }, { building: "asc" }, { system: "asc" }],
    });
    if (rawUnits.length === 0) return null;

    const seen = new Set<string>();
    const buildings: { campus: string; building: string }[] = [];
    for (const u of rawUnits) {
      const key = `${u.campus}/${u.building}`;
      if (!seen.has(key)) {
        seen.add(key);
        buildings.push({ campus: u.campus, building: u.building });
      }
    }

    const topicNames = this.buildTopicNames(rawUnits, buildings);
    const topicIds = await this.writer.ensureTopics(topicNames);
    return { units: rawUnits, buildings, topicIds };
  }
}
