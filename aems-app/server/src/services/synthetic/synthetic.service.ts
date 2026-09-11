import { Inject, Injectable, Logger } from "@nestjs/common";
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

export interface TopicRegistry {
  units: SyntheticUnit[];
  buildings: { campus: string; building: string }[];
  topicIds: Map<string, number>;
}

@Injectable()
export class SyntheticService extends BaseService {
  private readonly logger = new Logger(SyntheticService.name);

  /** Resolves once task() has finished (or is skipped because gating turned it off). */
  readonly backfillReady: Promise<void>;
  private resolveBackfillReady!: () => void;

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

  @Timeout(1000)
  async execute(): Promise<void> {
    // Nest's schedule invokes this decorated method more than once (once
    // for the decorated subclass and once via the inherited base). We
    // only want to signal backfill-complete after the invocation that
    // actually ran task() — the redundant call sees running=true and
    // schedule() returns false.
    if (!(this as unknown as { schedule: () => boolean }).schedule()) return;
    try {
      await this.task();
    } finally {
      (this as unknown as { running: boolean }).running = false;
      this.resolveBackfillReady();
    }
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
    const startMs = start.getTime();
    const endMs = end.getTime();
    let total = 0;
    let skipped = 0;

    const runCopy = async (topicId: number, iter: Iterable<[Date, number]>): Promise<number> => {
      if (await this.writer.topicHasData(topicId)) {
        skipped++;
        return 0;
      }
      await this.writer.clearRange(topicId, start, end);
      return this.writer.copyTopic(topicId, iter);
    };

    for (const b of buildings) {
      const buildingSeed = seedFor("weather", b.campus, b.building);
      const buildingUnits = units.filter((u) => u.campus === b.campus && u.building === b.building);
      const buildingTotalBefore = total;
      const buildingSkippedBefore = skipped;

      for (const m of WEATHER_METRICS) {
        const topicId = topicIds.get(`${b.campus}/${b.building}/weather/${m.topic}`);
        if (topicId === undefined) continue;
        const iter = this.iterateWeather(b, buildingSeed, m.key, startMs, endMs);
        total += await runCopy(topicId, iter);
      }

      for (const metric of METER_METRICS) {
        const topicId = topicIds.get(`${b.campus}/${b.building}/meter/${metric}`);
        if (topicId === undefined) continue;
        const iter = this.iterateMeter(b, buildingSeed, buildingUnits.length, metric, startMs, endMs);
        total += await runCopy(topicId, iter);
      }

      for (const u of buildingUnits) {
        const unitSeed = seedFor("unit", u.campus, u.building, u.system);
        for (const metric of UNIT_METRICS) {
          const topicId = topicIds.get(`${u.campus}/${u.building}/${u.system}/${metric}`);
          if (topicId === undefined) continue;
          const iter = this.iterateUnit(b, buildingSeed, u, unitSeed, metric, startMs, endMs);
          total += await runCopy(topicId, iter);
        }
      }
      const filledThisBuilding = total - buildingTotalBefore;
      const skippedThisBuilding = skipped - buildingSkippedBefore;
      this.logger.log(
        `Backfilled ${b.campus}/${b.building}: ${filledThisBuilding.toLocaleString()} new rows, ${skippedThisBuilding} topics already had data.`,
      );
    }
    if (skipped > 0) this.logger.log(`Total topics skipped (already populated): ${skipped}.`);
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
    for (const b of buildings) {
      const buildingSeed = seedFor("weather", b.campus, b.building);
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
        const unitSeed = seedFor("unit", u.campus, u.building, u.system);
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
