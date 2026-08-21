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
  "OutdoorAirTemperature",
  "OccupiedCoolingSetPoint",
  "OccupiedHeatingSetPoint",
  "CoolingDemand",
  "HeatingDemand",
  "SupplyFanStatus",
  "FirstStageCooling",
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

  constructor(
    @Inject(AppConfigService.Key) private readonly configService: AppConfigService,
    private readonly prismaService: PrismaService,
    private readonly topologyService: SyntheticTopologyService,
    private readonly writer: SyntheticHistorianWriter,
  ) {
    super("synth", configService);
  }

  @Timeout(1000)
  async execute(): Promise<void> {
    await super.execute();
  }

  async task(): Promise<void> {
    const { seed, historianDays } = this.configService.service.synthetic;
    this.logger.log(`Running synthetic seeder (seed=${seed}, days=${historianDays})...`);

    const { units, buildings } = await this.topologyService.apply();
    const marker = `synthetic:backfill:${seed}:${historianDays}`;

    const existing = await this.prismaService.prisma.seed.findUnique({ where: { filename: marker } });
    if (existing) {
      this.logger.log(`Backfill marker ${marker} exists — skipping historian backfill.`);
      return;
    }

    const topicNames = this.buildTopicNames(units, buildings);
    const topicIds = await this.writer.ensureTopics(topicNames);
    this.logger.log(`Historian topics ready: ${topicIds.size}`);

    const end = new Date();
    end.setUTCSeconds(0, 0);
    const start = new Date(end.getTime() - historianDays * 86_400_000);

    const total = await this.backfill({ units, buildings, topicIds }, start, end);
    this.logger.log(`Historian backfill complete: ${total.toLocaleString()} rows.`);

    await this.prismaService.prisma.seed.upsert({
      where: { filename: marker },
      create: { filename: marker, timestamp: new Date() },
      update: { timestamp: new Date() },
    });
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

    for (const b of buildings) {
      const buildingSeed = seedFor("weather", b.campus, b.building);
      const buildingUnits = units.filter((u) => u.campus === b.campus && u.building === b.building);

      for (const m of WEATHER_METRICS) {
        const topicId = topicIds.get(`${b.campus}/${b.building}/weather/${m.topic}`);
        if (topicId === undefined) continue;
        const iter = this.iterateWeather(b, buildingSeed, m.key, startMs, endMs);
        total += await this.writer.copyTopic(topicId, iter);
      }

      for (const metric of METER_METRICS) {
        const topicId = topicIds.get(`${b.campus}/${b.building}/meter/${metric}`);
        if (topicId === undefined) continue;
        const iter = this.iterateMeter(b, buildingSeed, buildingUnits.length, metric, startMs, endMs);
        total += await this.writer.copyTopic(topicId, iter);
      }

      for (const u of buildingUnits) {
        const unitSeed = seedFor("unit", u.campus, u.building, u.system);
        for (const metric of UNIT_METRICS) {
          const topicId = topicIds.get(`${u.campus}/${u.building}/${u.system}/${metric}`);
          if (topicId === undefined) continue;
          const iter = this.iterateUnit(b, buildingSeed, u, unitSeed, metric, startMs, endMs);
          total += await this.writer.copyTopic(topicId, iter);
        }
      }
      this.logger.log(`Backfilled building ${b.campus}/${b.building} (running total ${total.toLocaleString()} rows).`);
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

  async collectTickValues(registry: TopicRegistry, ts: Date): Promise<[number, number][]> {
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
