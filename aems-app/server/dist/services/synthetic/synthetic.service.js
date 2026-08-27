"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SyntheticService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntheticService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const __1 = require("..");
const app_config_1 = require("../../app.config");
const prisma_service_1 = require("../../prisma/prisma.service");
const topology_service_1 = require("./topology.service");
const historian_writer_1 = require("./historian.writer");
const curves_1 = require("./curves");
const UNIT_METRICS = [
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
const WEATHER_METRICS = [
    { key: "airTemperature", topic: "air_temperature" },
    { key: "relativeHumidity", topic: "relative_humidity" },
    { key: "windSpeed", topic: "wind_speed" },
];
const METER_METRICS = ["WholeBuildingPower", "Demand"];
const UNIT_CONFIG = { coolingSetpoint: 74, heatingSetpoint: 68 };
const SAMPLE_INTERVAL_MS = 60_000;
let SyntheticService = SyntheticService_1 = class SyntheticService extends __1.BaseService {
    constructor(configService, prismaService, topologyService, writer) {
        super("synth", configService);
        this.configService = configService;
        this.prismaService = prismaService;
        this.topologyService = topologyService;
        this.writer = writer;
        this.logger = new common_1.Logger(SyntheticService_1.name);
        this.backfillReady = new Promise((resolve) => {
            this.resolveBackfillReady = resolve;
        });
    }
    async execute() {
        try {
            await super.execute();
        }
        finally {
            this.resolveBackfillReady();
        }
    }
    async task() {
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
    buildTopicNames(units, buildings) {
        const names = [];
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
    async backfill(registry, start, end) {
        const { units, buildings, topicIds } = registry;
        const startMs = start.getTime();
        const endMs = end.getTime();
        let total = 0;
        let skipped = 0;
        const runCopy = async (topicId, iter) => {
            if (await this.writer.topicHasData(topicId)) {
                skipped++;
                return 0;
            }
            await this.writer.clearRange(topicId, start, end);
            return this.writer.copyTopic(topicId, iter);
        };
        for (const b of buildings) {
            const buildingSeed = (0, curves_1.seedFor)("weather", b.campus, b.building);
            const buildingUnits = units.filter((u) => u.campus === b.campus && u.building === b.building);
            const buildingTotalBefore = total;
            const buildingSkippedBefore = skipped;
            for (const m of WEATHER_METRICS) {
                const topicId = topicIds.get(`${b.campus}/${b.building}/weather/${m.topic}`);
                if (topicId === undefined)
                    continue;
                const iter = this.iterateWeather(b, buildingSeed, m.key, startMs, endMs);
                total += await runCopy(topicId, iter);
            }
            for (const metric of METER_METRICS) {
                const topicId = topicIds.get(`${b.campus}/${b.building}/meter/${metric}`);
                if (topicId === undefined)
                    continue;
                const iter = this.iterateMeter(b, buildingSeed, buildingUnits.length, metric, startMs, endMs);
                total += await runCopy(topicId, iter);
            }
            for (const u of buildingUnits) {
                const unitSeed = (0, curves_1.seedFor)("unit", u.campus, u.building, u.system);
                for (const metric of UNIT_METRICS) {
                    const topicId = topicIds.get(`${u.campus}/${u.building}/${u.system}/${metric}`);
                    if (topicId === undefined)
                        continue;
                    const iter = this.iterateUnit(b, buildingSeed, u, unitSeed, metric, startMs, endMs);
                    total += await runCopy(topicId, iter);
                }
            }
            const filledThisBuilding = total - buildingTotalBefore;
            const skippedThisBuilding = skipped - buildingSkippedBefore;
            this.logger.log(`Backfilled ${b.campus}/${b.building}: ${filledThisBuilding.toLocaleString()} new rows, ${skippedThisBuilding} topics already had data.`);
        }
        if (skipped > 0)
            this.logger.log(`Total topics skipped (already populated): ${skipped}.`);
        return total;
    }
    *iterateWeather(b, buildingSeed, key, startMs, endMs) {
        for (let ms = startMs; ms < endMs; ms += SAMPLE_INTERVAL_MS) {
            const ts = new Date(ms);
            yield [ts, (0, curves_1.weatherAt)(ts, buildingSeed)[key]];
        }
    }
    *iterateMeter(b, buildingSeed, unitCount, key, startMs, endMs) {
        for (let ms = startMs; ms < endMs; ms += SAMPLE_INTERVAL_MS) {
            const ts = new Date(ms);
            const w = (0, curves_1.weatherAt)(ts, buildingSeed);
            yield [ts, (0, curves_1.meterAt)(ts, buildingSeed, w, unitCount)[key]];
        }
    }
    *iterateUnit(b, buildingSeed, u, unitSeed, key, startMs, endMs) {
        for (let ms = startMs; ms < endMs; ms += SAMPLE_INTERVAL_MS) {
            const ts = new Date(ms);
            const w = (0, curves_1.weatherAt)(ts, buildingSeed);
            yield [ts, (0, curves_1.unitAt)(ts, unitSeed, w, UNIT_CONFIG)[key]];
        }
    }
    async collectTickValues(registry, ts) {
        const values = [];
        const { units, buildings, topicIds } = registry;
        for (const b of buildings) {
            const buildingSeed = (0, curves_1.seedFor)("weather", b.campus, b.building);
            const w = (0, curves_1.weatherAt)(ts, buildingSeed);
            for (const m of WEATHER_METRICS) {
                const topicId = topicIds.get(`${b.campus}/${b.building}/weather/${m.topic}`);
                if (topicId !== undefined)
                    values.push([topicId, w[m.key]]);
            }
            const buildingUnits = units.filter((u) => u.campus === b.campus && u.building === b.building);
            const meter = (0, curves_1.meterAt)(ts, buildingSeed, w, buildingUnits.length);
            for (const metric of METER_METRICS) {
                const topicId = topicIds.get(`${b.campus}/${b.building}/meter/${metric}`);
                if (topicId !== undefined)
                    values.push([topicId, meter[metric]]);
            }
            for (const u of buildingUnits) {
                const unitSeed = (0, curves_1.seedFor)("unit", u.campus, u.building, u.system);
                const sample = (0, curves_1.unitAt)(ts, unitSeed, w, UNIT_CONFIG);
                for (const metric of UNIT_METRICS) {
                    const topicId = topicIds.get(`${u.campus}/${u.building}/${u.system}/${metric}`);
                    if (topicId !== undefined)
                        values.push([topicId, sample[metric]]);
                }
            }
        }
        return values;
    }
    async loadRegistry() {
        const prefix = this.configService.service.synthetic.campusPrefix;
        const rawUnits = await this.prismaService.prisma.unit.findMany({
            where: { campus: { startsWith: prefix } },
            select: { id: true, campus: true, building: true, system: true },
            orderBy: [{ campus: "asc" }, { building: "asc" }, { system: "asc" }],
        });
        if (rawUnits.length === 0)
            return null;
        const seen = new Set();
        const buildings = [];
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
};
exports.SyntheticService = SyntheticService;
__decorate([
    (0, schedule_1.Timeout)(1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyntheticService.prototype, "execute", null);
exports.SyntheticService = SyntheticService = SyntheticService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService,
        topology_service_1.SyntheticTopologyService,
        historian_writer_1.SyntheticHistorianWriter])
], SyntheticService);
//# sourceMappingURL=synthetic.service.js.map