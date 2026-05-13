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
var HistorianService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistorianService = exports.MeterMetric = exports.WeatherMetric = exports.UnitMetric = exports.CalculationType = exports.AggregationType = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const common_2 = require("@nestjs/common");
const app_config_1 = require("../app.config");
const prisma_service_1 = require("../prisma/prisma.service");
const https = require("https");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const common_3 = require("@local/common");
Object.defineProperty(exports, "AggregationType", { enumerable: true, get: function () { return common_3.AggregationType; } });
Object.defineProperty(exports, "CalculationType", { enumerable: true, get: function () { return common_3.CalculationType; } });
Object.defineProperty(exports, "UnitMetric", { enumerable: true, get: function () { return common_3.UnitMetric; } });
Object.defineProperty(exports, "WeatherMetric", { enumerable: true, get: function () { return common_3.WeatherMetric; } });
Object.defineProperty(exports, "MeterMetric", { enumerable: true, get: function () { return common_3.MeterMetric; } });
const metrics_1 = require("./metrics");
let HistorianService = HistorianService_1 = class HistorianService {
    constructor(configService, prismaService) {
        this.configService = configService;
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(HistorianService_1.name);
        this.topicIdCache = new Map();
        const { historian } = configService;
        if (historian.url) {
            this.pool = new pg_1.Pool({
                connectionString: historian.url,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
        }
        else {
            this.pool = new pg_1.Pool({
                host: historian.host,
                port: historian.port,
                database: historian.name,
                user: historian.username,
                password: historian.password,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
        }
        this.pool.on("error", (err) => {
            this.logger.error("Unexpected error on idle historian database client", err);
        });
    }
    async onModuleInit() {
        try {
            const client = await this.pool.connect();
            client.release();
        }
        catch (error) {
            this.logger.error("Failed to connect to historian database", error);
        }
    }
    async onModuleDestroy() {
        await this.pool.end();
        this.logger.log("Historian database connection pool closed");
    }
    async filterHistorianAccess(user, campus, building, system) {
        const whereClause = user.authRoles.admin
            ? {}
            : {
                users: { some: { id: user.id } },
            };
        if (campus) {
            whereClause.campus = { equals: campus, mode: "insensitive" };
        }
        if (building) {
            whereClause.building = { equals: building, mode: "insensitive" };
        }
        const userSystems = await this.prismaService.prisma.unit.findMany({
            where: whereClause,
            select: { campus: true, building: true, system: true },
        });
        const requestedSystems = Array.isArray(system) ? system : system ? [system] : [];
        const requestedSystemsLower = requestedSystems.map((s) => s.toLowerCase());
        const allowedSystems = userSystems
            .filter((s) => requestedSystemsLower.includes(s.system.toLowerCase()))
            .map((s) => ({ campus: s.campus, building: s.building, system: s.system }));
        if (requestedSystems.includes("weather")) {
            allowedSystems.push({ campus: campus ?? "", building: building ?? "", system: "weather" });
        }
        if (requestedSystems.includes("meter")) {
            allowedSystems.push({ campus: campus ?? "", building: building ?? "", system: "meter" });
        }
        return {
            allowedSystems,
        };
    }
    parseValue(valueString) {
        if (valueString === null || valueString === "null") {
            return null;
        }
        const parsed = parseFloat(valueString);
        return isNaN(parsed) ? null : parsed;
    }
    async resolveTopicId(topicPath) {
        const key = topicPath.toLowerCase();
        const cached = this.topicIdCache.get(key);
        if (cached !== undefined)
            return cached;
        const { rows } = await this.pool.query(`SELECT topic_id FROM topics WHERE lower(topic_name) = $1 LIMIT 1`, [key]);
        if (rows.length === 0)
            return null;
        this.topicIdCache.set(key, rows[0].topic_id);
        return rows[0].topic_id;
    }
    async resolveTopicIds(topicPaths) {
        const result = new Map();
        const toFetch = [];
        for (const p of topicPaths) {
            const cached = this.topicIdCache.get(p.toLowerCase());
            if (cached !== undefined)
                result.set(p, cached);
            else
                toFetch.push(p);
        }
        if (toFetch.length > 0) {
            const lowered = toFetch.map((p) => p.toLowerCase());
            const { rows } = await this.pool.query(`SELECT topic_id, topic_name FROM topics WHERE lower(topic_name) = ANY($1)`, [lowered]);
            for (const row of rows) {
                this.topicIdCache.set(row.topic_name.toLowerCase(), row.topic_id);
            }
            for (const p of toFetch) {
                const id = this.topicIdCache.get(p.toLowerCase());
                if (id !== undefined)
                    result.set(p, id);
            }
        }
        return result;
    }
    async getUnitCurrentValue(campus, building, system, metric) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath}`);
                return null;
            }
            const result = await this.pool.query(`SELECT ts, value_string FROM data WHERE topic_id = $1 ORDER BY ts DESC LIMIT 1`, [topicId]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath}`);
                return null;
            }
            const row = result.rows[0];
            return {
                system,
                metric,
                value: this.parseValue(row.value_string),
                timestamp: new Date(row.ts),
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error fetching unit current value", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getWeatherCurrentValue(campus, building, metric) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildWeatherTopicPath)(campus, building, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath}`);
                return null;
            }
            const result = await this.pool.query(`SELECT ts, value_string FROM data WHERE topic_id = $1 ORDER BY ts DESC LIMIT 1`, [topicId]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath}`);
                return null;
            }
            const row = result.rows[0];
            return {
                system: "weather",
                metric,
                value: this.parseValue(row.value_string),
                timestamp: new Date(row.ts),
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error fetching weather current value", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getUnitTimeSeries(campus, building, system, metric, startTime, endTime) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return { system, metric, data: [], metadata: { topics, errors } };
            }
            const result = await this.pool.query(`SELECT ts, value_string FROM data WHERE topic_id = $1 AND ts >= $2 AND ts <= $3 ORDER BY ts`, [topicId, startTime, endTime]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            const data = result.rows.map((row) => ({
                timestamp: new Date(row.ts),
                value: this.parseValue(row.value_string),
                system,
                metric,
            }));
            return {
                system,
                metric,
                data,
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error fetching unit time series", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getWeatherTimeSeries(campus, building, metric, startTime, endTime) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildWeatherTopicPath)(campus, building, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return { system: "weather", metric, data: [], metadata: { topics, errors } };
            }
            const result = await this.pool.query(`SELECT ts, value_string FROM data WHERE topic_id = $1 AND ts >= $2 AND ts <= $3 ORDER BY ts`, [topicId, startTime, endTime]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            const data = result.rows.map((row) => ({
                timestamp: new Date(row.ts),
                value: this.parseValue(row.value_string),
                system: "weather",
                metric,
            }));
            return {
                system: "weather",
                metric,
                data,
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error fetching weather time series", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getUnitAggregated(campus, building, system, metric, startTime, endTime, interval, aggregation) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
        if (!intervalMatch) {
            throw new Error("Invalid interval format. Use format like '1m', '5m', '1h', etc.");
        }
        const [, , intervalUnit] = intervalMatch;
        const intervalMap = {
            s: "seconds",
            m: "minutes",
            h: "hours",
            d: "days",
        };
        const aggFunction = aggregation.toLowerCase();
        const valueExpr = aggregation === common_3.AggregationType.Count ? "*" : "CAST(NULLIF(value_string, 'null') AS double precision)";
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return { aggregates: [], metadata: { topics, errors } };
            }
            const query = `
        SELECT
          date_trunc('${intervalMap[intervalUnit]}', ts) AS timestamp,
          ${aggFunction}(${valueExpr}) AS value
        FROM data
        WHERE topic_id = $1
          AND ts >= $2
          AND ts <= $3
        GROUP BY 1
        ORDER BY 1
      `;
            const result = await this.pool.query(query, [
                topicId,
                startTime,
                endTime,
            ]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                aggregates: result.rows.map((row) => ({
                    timestamp: new Date(row.timestamp),
                    value: typeof row.value === "string" ? parseFloat(row.value) : null,
                    metric,
                })),
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error fetching aggregated data", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getWeatherAggregated(campus, building, metric, startTime, endTime, interval, aggregation) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildWeatherTopicPath)(campus, building, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
        if (!intervalMatch) {
            throw new Error("Invalid interval format. Use format like '1m', '5m', '1h', etc.");
        }
        const [, , intervalUnit] = intervalMatch;
        const intervalMap = {
            s: "seconds",
            m: "minutes",
            h: "hours",
            d: "days",
        };
        const aggFunction = aggregation.toLowerCase();
        const valueExpr = aggregation === common_3.AggregationType.Count ? "*" : "CAST(NULLIF(value_string, 'null') AS double precision)";
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return { aggregates: [], metadata: { topics, errors } };
            }
            const query = `
        SELECT
          date_trunc('${intervalMap[intervalUnit]}', ts) AS timestamp,
          ${aggFunction}(${valueExpr}) AS value
        FROM data
        WHERE topic_id = $1
          AND ts >= $2
          AND ts <= $3
        GROUP BY 1
        ORDER BY 1
      `;
            const result = await this.pool.query(query, [
                topicId,
                startTime,
                endTime,
            ]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                aggregates: result.rows.map((row) => ({
                    timestamp: new Date(row.timestamp),
                    value: typeof row.value === "string" ? parseFloat(row.value) : null,
                    metric,
                })),
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error fetching aggregated data", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getMeterCurrentValue(campus, building, metric) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildMeterTopicPath)(campus, building, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath}`);
                return null;
            }
            const result = await this.pool.query(`SELECT ts, value_string FROM data WHERE topic_id = $1 ORDER BY ts DESC LIMIT 1`, [topicId]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath}`);
                return null;
            }
            const row = result.rows[0];
            return {
                system: "meter",
                metric,
                value: this.parseValue(row.value_string),
                timestamp: new Date(row.ts),
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error fetching meter current value", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getMeterTimeSeries(campus, building, metric, startTime, endTime) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildMeterTopicPath)(campus, building, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return { system: "meter", metric, data: [], metadata: { topics, errors } };
            }
            const result = await this.pool.query(`SELECT ts, value_string FROM data WHERE topic_id = $1 AND ts >= $2 AND ts <= $3 ORDER BY ts`, [topicId, startTime, endTime]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            const data = result.rows.map((row) => ({
                timestamp: new Date(row.ts),
                value: this.parseValue(row.value_string),
                system: "meter",
                metric,
            }));
            return {
                system: "meter",
                metric,
                data,
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error fetching meter time series", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getMeterAggregated(campus, building, metric, startTime, endTime, interval, aggregation) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildMeterTopicPath)(campus, building, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
        if (!intervalMatch) {
            throw new Error("Invalid interval format. Use format like '1m', '5m', '1h', etc.");
        }
        const [, , intervalUnit] = intervalMatch;
        const intervalMap = {
            s: "seconds",
            m: "minutes",
            h: "hours",
            d: "days",
        };
        const aggFunction = aggregation.toLowerCase();
        const valueExpr = aggregation === common_3.AggregationType.Count ? "*" : "CAST(NULLIF(value_string, 'null') AS double precision)";
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return { aggregates: [], metadata: { topics, errors } };
            }
            const query = `
        SELECT
          date_trunc('${intervalMap[intervalUnit]}', ts) AS timestamp,
          ${aggFunction}(${valueExpr}) AS value
        FROM data
        WHERE topic_id = $1
          AND ts >= $2
          AND ts <= $3
        GROUP BY 1
        ORDER BY 1
      `;
            const result = await this.pool.query(query, [
                topicId,
                startTime,
                endTime,
            ]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                aggregates: result.rows.map((row) => ({
                    timestamp: new Date(row.timestamp),
                    value: typeof row.value === "string" ? parseFloat(row.value) : null,
                    metric,
                })),
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error fetching meter aggregated data", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getMultiSystemUnit(campus, building, systems, deniedSystems, metric, startTime, endTime, interval) {
        if (systems.length === 0 && deniedSystems.length === 0) {
            return [];
        }
        const systemTopics = {};
        systems.forEach((sys) => {
            systemTopics[sys] = (0, metrics_1.buildUnitTopicPath)(campus, building, sys, metric, this.configService.historian.topicMap);
        });
        const queryResult = {};
        systems.forEach((sys) => {
            queryResult[sys] = [];
        });
        if (systems.length > 0) {
            const pathToId = await this.resolveTopicIds(Object.values(systemTopics));
            const topicIdToSystem = new Map();
            const topicIds = [];
            for (const sys of systems) {
                const id = pathToId.get(systemTopics[sys]);
                if (id !== undefined) {
                    topicIdToSystem.set(id, sys);
                    topicIds.push(id);
                }
            }
            if (topicIds.length > 0) {
                let timeGroup = "ts";
                const params = [startTime, endTime, topicIds];
                if (interval) {
                    const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
                    if (!intervalMatch) {
                        throw new Error("Invalid interval format");
                    }
                    const [, , intervalUnit] = intervalMatch;
                    const intervalMap = {
                        s: "second",
                        m: "minute",
                        h: "hour",
                        d: "day",
                    };
                    timeGroup = `date_trunc('${intervalMap[intervalUnit]}', ts)`;
                }
                const query = `
          SELECT
            ${timeGroup} AS timestamp,
            topic_id,
            AVG(CAST(NULLIF(value_string, 'null') AS double precision)) AS value
          FROM data
          WHERE topic_id = ANY($3::int[])
            AND ts >= $1
            AND ts <= $2
          GROUP BY 1, 2
          ORDER BY 1, 2
        `;
                try {
                    const result = await this.pool.query(query, params);
                    result.rows.forEach((row) => {
                        const sys = topicIdToSystem.get(row.topic_id);
                        if (!sys)
                            return;
                        queryResult[sys].push({
                            timestamp: new Date(row.timestamp),
                            value: typeof row.value === "string" ? parseFloat(row.value) : (row.value ?? null),
                            system: sys,
                            metric,
                        });
                    });
                }
                catch (error) {
                    this.logger.error("Error fetching multi-system data", error);
                    throw error;
                }
            }
        }
        const results = systems.map((sys) => {
            const data = queryResult[sys] ?? [];
            const errors = [];
            if (data.length === 0) {
                errors.push(`No data found for topic: ${systemTopics[sys]} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                system: sys,
                data,
                metadata: { topics: { [metric]: systemTopics[sys] }, errors },
            };
        });
        deniedSystems.forEach((sys) => {
            const topicPath = (0, metrics_1.buildUnitTopicPath)(campus, building, sys, metric, this.configService.historian.topicMap);
            results.push({
                system: sys,
                data: [],
                metadata: {
                    topics: { [metric]: topicPath },
                    errors: [`Access denied: User has no permissions for ${campus}/${building}/${sys}`],
                },
            });
        });
        return results;
    }
    async getMultiSystemUnitRanges(campus, building, systems, deniedSystems, metric, startTime, endTime) {
        if (systems.length === 0 && deniedSystems.length === 0) {
            return [];
        }
        const grouped = {};
        systems.forEach((sys) => {
            grouped[sys.toUpperCase()] = [];
        });
        if (systems.length > 0) {
            const systemTopics = new Map(systems.map((sys) => [sys, (0, metrics_1.buildUnitTopicPath)(campus, building, sys, metric, this.configService.historian.topicMap)]));
            const pathToId = await this.resolveTopicIds([...systemTopics.values()]);
            const topicIdToSystem = new Map();
            const topicIds = [];
            for (const [sys, path] of systemTopics) {
                const id = pathToId.get(path);
                if (id !== undefined) {
                    topicIdToSystem.set(id, sys);
                    topicIds.push(id);
                }
            }
            if (topicIds.length > 0) {
                const query = `
          WITH system_data AS (
            SELECT
              topic_id,
              ts,
              CAST(NULLIF(value_string, 'null') AS double precision) as value
            FROM data
            WHERE topic_id = ANY($3::int[])
              AND ts >= $1
              AND ts <= $2
              AND CAST(NULLIF(value_string, 'null') AS double precision) IS NOT NULL
            ORDER BY topic_id, ts
          ),
          value_changes AS (
            SELECT
              topic_id,
              ts,
              value,
              LAG(value) OVER (PARTITION BY topic_id ORDER BY ts) as prev_value,
              LEAD(ts) OVER (PARTITION BY topic_id ORDER BY ts) as next_ts
            FROM system_data
          ),
          range_starts AS (
            SELECT
              topic_id,
              ts as start_time,
              next_ts as end_time,
              value
            FROM value_changes
            WHERE prev_value IS NULL OR prev_value != value
          )
          SELECT
            topic_id,
            start_time,
            COALESCE(end_time, $2) as end_time,
            value
          FROM range_starts
          ORDER BY topic_id, start_time
        `;
                try {
                    const result = await this.pool.query(query, [startTime, endTime, topicIds]);
                    result.rows.forEach((row) => {
                        const sys = topicIdToSystem.get(row.topic_id);
                        if (!sys)
                            return;
                        const key = sys.toUpperCase();
                        if (grouped[key]) {
                            grouped[key].push({
                                startTime: new Date(row.start_time),
                                endTime: new Date(row.end_time),
                                value: row.value,
                                system: sys,
                                metric,
                            });
                        }
                    });
                }
                catch (error) {
                    this.logger.error("Error fetching multi-system ranges", error);
                    throw error;
                }
            }
        }
        const results = systems.map((sys) => {
            const ranges = grouped[sys.toUpperCase()] || [];
            const topicPath = (0, metrics_1.buildUnitTopicPath)(campus, building, sys, metric, this.configService.historian.topicMap);
            const errors = [];
            if (ranges.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                system: sys,
                ranges,
                metadata: { topics: { [metric]: topicPath }, errors },
            };
        });
        deniedSystems.forEach((sys) => {
            const topicPath = (0, metrics_1.buildUnitTopicPath)(campus, building, sys, metric, this.configService.historian.topicMap);
            results.push({
                system: sys,
                ranges: [],
                metadata: {
                    topics: { [metric]: topicPath },
                    errors: [`Access denied: User has no permissions for ${campus}/${building}/${sys}`],
                },
            });
        });
        return results;
    }
    async getMultiSystemSetpointErrorRanges(campus, building, systems, deniedSystems, startTime, endTime) {
        if (systems.length === 0 && deniedSystems.length === 0) {
            return [];
        }
        const grouped = {};
        systems.forEach((sys) => {
            grouped[sys.toUpperCase()] = [];
        });
        if (systems.length > 0) {
            const tempPaths = new Map(systems.map((sys) => [
                sys,
                (0, metrics_1.buildUnitTopicPath)(campus, building, sys, common_3.UnitMetric.ZoneTemperature, this.configService.historian.topicMap),
            ]));
            const spPaths = new Map(systems.map((sys) => [
                sys,
                (0, metrics_1.buildUnitTopicPath)(campus, building, sys, common_3.UnitMetric.EffectiveZoneTemperatureSetPoint, this.configService.historian.topicMap),
            ]));
            const allPaths = [...tempPaths.values(), ...spPaths.values()];
            const pathToId = await this.resolveTopicIds(allPaths);
            const tempIdToSystem = new Map();
            const spSystemToId = new Map();
            for (const [sys, path] of tempPaths) {
                const id = pathToId.get(path);
                if (id !== undefined)
                    tempIdToSystem.set(id, sys);
            }
            for (const [sys, path] of spPaths) {
                const id = pathToId.get(path);
                if (id !== undefined)
                    spSystemToId.set(sys, id);
            }
            const tempIds = [];
            const spIds = [];
            const tempIdToSpId = new Map();
            for (const [id, sys] of tempIdToSystem) {
                const spId = spSystemToId.get(sys);
                if (spId !== undefined) {
                    tempIds.push(id);
                    spIds.push(spId);
                    tempIdToSpId.set(id, spId);
                }
            }
            if (tempIds.length > 0) {
                const query = `
          WITH sys_map AS (
            SELECT * FROM unnest($3::int[], $4::int[]) AS m(temp_id, sp_id)
          ),
          zone_temps AS (
            SELECT
              topic_id AS temp_id,
              ts,
              CAST(NULLIF(value_string, 'null') AS double precision) AS temp_value
            FROM data
            WHERE topic_id = ANY($3::int[])
              AND ts >= $1
              AND ts <= $2
          ),
          zone_setpoints AS (
            SELECT
              topic_id AS sp_id,
              ts,
              CAST(NULLIF(value_string, 'null') AS double precision) AS sp_value
            FROM data
            WHERE topic_id = ANY($4::int[])
              AND ts >= $1
              AND ts <= $2
          ),
          error_data AS (
            SELECT
              t.temp_id,
              t.ts,
              ROUND((t.temp_value - s.sp_value)::numeric, 1) AS error_value
            FROM zone_temps t
            JOIN sys_map m ON m.temp_id = t.temp_id
            JOIN zone_setpoints s ON s.sp_id = m.sp_id AND s.ts = t.ts
            WHERE t.temp_value IS NOT NULL AND s.sp_value IS NOT NULL
            ORDER BY t.temp_id, t.ts
          ),
          value_changes AS (
            SELECT
              temp_id,
              ts,
              error_value,
              LAG(error_value) OVER (PARTITION BY temp_id ORDER BY ts) as prev_value,
              LEAD(ts) OVER (PARTITION BY temp_id ORDER BY ts) as next_ts
            FROM error_data
          ),
          range_starts AS (
            SELECT
              temp_id,
              ts as start_time,
              next_ts as end_time,
              error_value
            FROM value_changes
            WHERE prev_value IS NULL OR ABS(prev_value - error_value) > 0.5
          )
          SELECT
            temp_id,
            start_time,
            COALESCE(end_time, $2) as end_time,
            error_value as value
          FROM range_starts
          ORDER BY temp_id, start_time
        `;
                try {
                    const result = await this.pool.query(query, [startTime, endTime, tempIds, spIds]);
                    result.rows.forEach((row) => {
                        const sys = tempIdToSystem.get(row.temp_id);
                        if (!sys)
                            return;
                        const key = sys.toUpperCase();
                        if (grouped[key]) {
                            grouped[key].push({
                                startTime: new Date(row.start_time),
                                endTime: new Date(row.end_time),
                                value: row.value,
                                system: sys,
                                metric: common_3.UnitMetric.ZoneTemperature,
                            });
                        }
                    });
                }
                catch (error) {
                    this.logger.error("Error fetching setpoint error ranges", error);
                    throw error;
                }
            }
        }
        const tempMetric = common_3.UnitMetric.ZoneTemperature;
        const spMetric = common_3.UnitMetric.EffectiveZoneTemperatureSetPoint;
        const results = systems.map((sys) => {
            const ranges = grouped[sys.toUpperCase()] || [];
            const tempPath = (0, metrics_1.buildUnitTopicPath)(campus, building, sys, tempMetric, this.configService.historian.topicMap);
            const spPath = (0, metrics_1.buildUnitTopicPath)(campus, building, sys, spMetric, this.configService.historian.topicMap);
            const errors = [];
            if (ranges.length === 0) {
                errors.push(`No setpoint error data found for ${sys} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                system: sys,
                ranges,
                metadata: {
                    topics: { [tempMetric]: tempPath, [spMetric]: spPath },
                    errors,
                },
            };
        });
        deniedSystems.forEach((sys) => {
            const tempPath = (0, metrics_1.buildUnitTopicPath)(campus, building, sys, tempMetric, this.configService.historian.topicMap);
            const spPath = (0, metrics_1.buildUnitTopicPath)(campus, building, sys, spMetric, this.configService.historian.topicMap);
            results.push({
                system: sys,
                ranges: [],
                metadata: {
                    topics: { [tempMetric]: tempPath, [spMetric]: spPath },
                    errors: [`Access denied: User has no permissions for ${campus}/${building}/${sys}`],
                },
            });
        });
        return results;
    }
    static deriveBucketInterval(startTime, endTime) {
        const rangeMs = Math.max(1, endTime.getTime() - startTime.getTime());
        const targetBuckets = 500;
        const targetSec = Math.max(1, Math.ceil(rangeMs / 1000 / targetBuckets));
        const niceSeconds = [
            10, 30,
            60, 120, 300, 600, 900, 1800,
            3600, 7200, 10800, 21600, 43200,
            86400, 604800,
        ];
        const chosen = niceSeconds.find((s) => s >= targetSec) ?? niceSeconds[niceSeconds.length - 1];
        return { sql: `${chosen} seconds`, ms: chosen * 1000 };
    }
    static toNumber(v) {
        if (typeof v === "number")
            return isFinite(v) ? v : null;
        if (typeof v === "string") {
            const n = parseFloat(v);
            return isFinite(n) ? n : null;
        }
        return null;
    }
    async calculateSetpointError(campus, building, system, startTime, endTime) {
        const errors = [];
        const tempMetric = common_3.UnitMetric.ZoneTemperature;
        const spMetric = common_3.UnitMetric.EffectiveZoneTemperatureSetPoint;
        const occMetric = common_3.UnitMetric.OccupancyCommand;
        const tempPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, tempMetric, this.configService.historian.topicMap);
        const setpointPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, spMetric, this.configService.historian.topicMap);
        const occupancyPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, occMetric, this.configService.historian.topicMap);
        const topics = {
            [tempMetric]: tempPath,
            [spMetric]: setpointPath,
            [occMetric]: occupancyPath,
        };
        const bucketInterval = HistorianService_1.deriveBucketInterval(startTime, endTime);
        try {
            const pathToId = await this.resolveTopicIds([tempPath, setpointPath, occupancyPath]);
            const tempId = pathToId.get(tempPath);
            const setpointId = pathToId.get(setpointPath);
            const occupancyId = pathToId.get(occupancyPath);
            if (tempId === undefined) {
                errors.push(`Topic not found: ${tempPath}`);
                return { system, metric: tempMetric, data: [], metadata: { topics, errors } };
            }
            const tempQuery = `
        SELECT
          date_bin($3::interval, ts, $1::timestamptz) AS bucket,
          AVG(
            CASE
              WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
                THEN value_string::double precision
              ELSE NULL
            END
          ) AS temp_value
        FROM data
        WHERE topic_id = $4
          AND ts >= $1
          AND ts <= $2
        GROUP BY 1
        ORDER BY 1
      `;
            const setpointQuery = `
        SELECT
          ts,
          CASE
            WHEN value_string LIKE '{%}'
              THEN (value_string::jsonb ->> 'OccupiedSetPoint')::double precision
            WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
              THEN value_string::double precision
            ELSE NULL
          END AS occupied_sp,
          CASE
            WHEN value_string LIKE '{%}'
              THEN (value_string::jsonb ->> 'UnoccupiedHeatingSetPoint')::double precision
            ELSE NULL
          END AS unocc_heat_sp,
          CASE
            WHEN value_string LIKE '{%}'
              THEN (value_string::jsonb ->> 'UnoccupiedCoolingSetPoint')::double precision
            ELSE NULL
          END AS unocc_cool_sp
        FROM data
        WHERE topic_id = $3
          AND ts >= $1::timestamptz - interval '30 days'
          AND ts <= $2
          AND value_string IS NOT NULL
          AND value_string <> 'null'
        ORDER BY ts
      `;
            const occupancyQuery = `
        SELECT
          ts,
          CASE
            WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?$'
              THEN value_string::double precision
            ELSE NULL
          END AS occ_value
        FROM data
        WHERE topic_id = $3
          AND ts >= $1::timestamptz - interval '30 days'
          AND ts <= $2
          AND value_string IS NOT NULL
          AND value_string <> 'null'
        ORDER BY ts
      `;
            const tempPromise = this.pool.query(tempQuery, [startTime, endTime, bucketInterval.sql, tempId]);
            const setpointPromise = setpointId !== undefined
                ? this.pool.query(setpointQuery, [startTime, endTime, setpointId])
                : Promise.resolve({ rows: [] });
            const occupancyPromise = occupancyId !== undefined
                ? this.pool.query(occupancyQuery, [
                    startTime,
                    endTime,
                    occupancyId,
                ])
                : Promise.resolve({ rows: [] });
            const [tempResult, setpointResult, occupancyResult] = await Promise.all([
                tempPromise,
                setpointPromise,
                occupancyPromise,
            ]);
            const tempByBucket = new Map();
            for (const row of tempResult.rows) {
                const bucketMs = row.bucket instanceof Date ? row.bucket.getTime() : new Date(row.bucket).getTime();
                const v = HistorianService_1.toNumber(row.temp_value);
                if (v != null)
                    tempByBucket.set(bucketMs, v);
            }
            const setpoints = setpointResult.rows
                .map((r) => ({
                t: r.ts instanceof Date ? r.ts.getTime() : new Date(r.ts).getTime(),
                occupied: HistorianService_1.toNumber(r.occupied_sp),
                unoccHeat: HistorianService_1.toNumber(r.unocc_heat_sp),
                unoccCool: HistorianService_1.toNumber(r.unocc_cool_sp),
            }))
                .filter((s) => s.occupied != null || s.unoccHeat != null || s.unoccCool != null);
            const occupancies = occupancyResult.rows
                .map((r) => ({
                t: r.ts instanceof Date ? r.ts.getTime() : new Date(r.ts).getTime(),
                v: HistorianService_1.toNumber(r.occ_value),
            }))
                .filter((o) => o.v != null);
            const data = [];
            const startMs = startTime.getTime();
            const endMs = endTime.getTime();
            const stepMs = bucketInterval.ms;
            let spIdx = -1;
            let occIdx = -1;
            for (let bucketMs = startMs; bucketMs <= endMs; bucketMs += stepMs) {
                const bucketEndMs = bucketMs + stepMs;
                while (spIdx + 1 < setpoints.length && setpoints[spIdx + 1].t <= bucketEndMs)
                    spIdx++;
                while (occIdx + 1 < occupancies.length && occupancies[occIdx + 1].t <= bucketEndMs)
                    occIdx++;
                const temp = tempByBucket.get(bucketMs);
                const sp = spIdx >= 0 ? setpoints[spIdx] : null;
                const occ = occIdx >= 0 ? occupancies[occIdx] : null;
                let value = null;
                if (temp != null) {
                    if (occ?.v === 2 && sp?.occupied != null) {
                        value = temp - sp.occupied;
                    }
                    else if (occ?.v === 3 && sp?.unoccHeat != null && sp?.unoccCool != null) {
                        value =
                            temp < sp.unoccHeat
                                ? temp - sp.unoccHeat
                                : temp > sp.unoccCool
                                    ? temp - sp.unoccCool
                                    : 0;
                    }
                    else if (sp?.occupied != null) {
                        value = temp - sp.occupied;
                    }
                }
                data.push({
                    timestamp: new Date(bucketMs),
                    value,
                    system,
                    metric: tempMetric,
                });
            }
            if (data.every((d) => d.value == null)) {
                errors.push(`No setpoint error data found for ${system} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                system,
                metric: tempMetric,
                data,
                metadata: { topics, errors },
            };
        }
        catch (error) {
            this.logger.error("Error calculating setpoint error", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async isProxyCertificateSelfSigned() {
        return new Promise((resolve) => {
            const { proxy } = this.configService;
            const host = proxy.host || "localhost";
            const port = parseInt(proxy.port || "443");
            if (proxy.protocol !== "https") {
                this.logger.debug("Proxy is not HTTPS, defaulting to sslmode=prefer");
                resolve(true);
                return;
            }
            const options = {
                host,
                port,
                method: "GET",
                rejectUnauthorized: false,
            };
            const req = https.request(options, (res) => {
                const cert = res.socket.getPeerCertificate();
                if (!cert || Object.keys(cert).length === 0) {
                    this.logger.debug("No certificate found, defaulting to sslmode=prefer");
                    resolve(true);
                    return;
                }
                const isSelfSigned = cert.issuer && cert.subject && JSON.stringify(cert.issuer) === JSON.stringify(cert.subject);
                this.logger.debug(`Certificate is ${isSelfSigned ? "self-signed" : "CA-signed"}`);
                resolve(isSelfSigned);
            });
            req.on("error", (error) => {
                this.logger.warn(`Failed to check proxy certificate: ${error.message}, defaulting to sslmode=prefer`);
                resolve(true);
            });
            req.setTimeout(5000, () => {
                req.destroy();
                this.logger.warn("Certificate check timed out, defaulting to sslmode=prefer");
                resolve(true);
            });
            req.end();
        });
    }
    async ensureTablesInPublication() {
        try {
            const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('data', 'topics')
      `;
            const tableResult = await this.pool.query(tableCheckQuery);
            const existingTables = tableResult.rows.map((row) => row.table_name);
            if (existingTables.length === 0) {
                this.logger.debug("No historian tables exist yet");
                return;
            }
            const pubTablesQuery = `
        SELECT tablename 
        FROM pg_publication_tables 
        WHERE pubname = 'historian_pub'
      `;
            const pubTablesResult = await this.pool.query(pubTablesQuery);
            const publishedTables = pubTablesResult.rows.map((row) => row.tablename);
            const missingTables = existingTables.filter((table) => !publishedTables.includes(table));
            if (missingTables.length > 0) {
                for (const table of missingTables) {
                    const addTableQuery = `ALTER PUBLICATION historian_pub ADD TABLE ${table}`;
                    await this.pool.query(addTableQuery);
                }
            }
        }
        catch (error) {
            this.logger.error("Error ensuring tables in publication", error);
        }
    }
    async getSystemPublishingStatus() {
        try {
            const validCampuses = new Set(["PNNL", "CAMPUS2", "CAMPUS3"]);
            const validBuildings = new Set(["ROB", "ETB", "PSF", "BUILDING2"]);
            const query = `
        SELECT 
          topic_name,
          MAX(ts) as last_published
        FROM data
        NATURAL JOIN topics
        WHERE topic_name LIKE '%/%'
        GROUP BY topic_name
        ORDER BY last_published DESC
      `;
            const result = await this.pool.query(query);
            const now = new Date();
            return result.rows
                .map((row) => {
                const topicName = row.topic_name;
                const parts = topicName.split("/");
                let campus = "";
                let building = "";
                let remainingParts = [...parts];
                for (let i = 0; i < parts.length; i++) {
                    if (validCampuses.has(parts[i])) {
                        campus = parts[i];
                        remainingParts = parts.slice(i + 1);
                        break;
                    }
                }
                if (campus && remainingParts.length > 0) {
                    for (let i = 0; i < remainingParts.length; i++) {
                        if (validBuildings.has(remainingParts[i])) {
                            building = remainingParts[i];
                            remainingParts = remainingParts.slice(i + 1);
                            break;
                        }
                    }
                }
                const lastPublished = new Date(row.last_published);
                const minutesAgo = Math.floor((now.getTime() - lastPublished.getTime()) / 1000 / 60);
                let status;
                if (minutesAgo < 5) {
                    status = "active";
                }
                else if (minutesAgo < 60) {
                    status = "stale";
                }
                else {
                    status = "inactive";
                }
                return {
                    campus,
                    building,
                    system: remainingParts.length > 1 ? remainingParts[0] : "",
                    metric: remainingParts.length > 1 ? remainingParts.slice(1).join("/") : remainingParts.join("/"),
                    lastPublished,
                    minutesAgo,
                    status,
                };
            })
                .filter((record) => record.campus && record.building);
        }
        catch (error) {
            this.logger.error("Error fetching system publishing status", error);
            throw error;
        }
    }
    async getReplicationInfo() {
        try {
            await this.ensureTablesInPublication();
            const pubQuery = `
        SELECT 
          p.pubname,
          array_agg(pt.schemaname || '.' || pt.tablename) as tables
        FROM pg_publication p
        LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
        WHERE p.pubname = 'historian_pub'
        GROUP BY p.pubname
      `;
            const pubResult = await this.pool.query(pubQuery);
            const publicationName = pubResult.rows[0]?.pubname || "historian_pub";
            const publishedTables = pubResult.rows[0]?.tables || [];
            const connQuery = `
        SELECT COUNT(*) as count
        FROM pg_stat_replication
        WHERE application_name LIKE '%historian%'
      `;
            const connResult = await this.pool.query(connQuery);
            const activeConnections = typeof connResult.rows[0]?.count === "string"
                ? parseInt(connResult.rows[0]?.count)
                : (connResult.rows[0]?.count ?? 0);
            const slotsQuery = `
        SELECT 
          slot_name,
          plugin,
          slot_type,
          active,
          restart_lsn,
          confirmed_flush_lsn
        FROM pg_replication_slots
        WHERE slot_name LIKE '%historian%'
      `;
            const slotsResult = await this.pool.query(slotsQuery);
            const replicationSlots = slotsResult.rows.map((row) => ({
                slotName: row.slot_name,
                plugin: row.plugin,
                slotType: row.slot_type,
                active: row.active,
                restartLsn: row.restart_lsn,
                confirmedFlushLsn: row.confirmed_flush_lsn,
            }));
            const { historian } = this.configService;
            const host = historian.host || "localhost";
            const port = historian.port || 5432;
            const database = historian.name || "historian";
            const username = historian.username || "postgres";
            const password = historian.password || "";
            const sequenceQuery = `
        SELECT DISTINCT
          substring(c.column_default from 'nextval\\(''([^'']+)''') as sequence_name
        FROM information_schema.columns c
        WHERE c.table_name IN ('data', 'topics')
          AND c.column_default LIKE '%nextval%'
        ORDER BY 1
      `;
            let sequenceNames = [];
            try {
                const sequenceResult = await this.pool.query(sequenceQuery);
                sequenceNames = sequenceResult.rows
                    .map((row) => row.sequence_name)
                    .filter((name) => name !== null);
            }
            catch (seqError) {
                this.logger.warn(`Failed to query sequences: ${seqError?.message || seqError}`);
            }
            const tableArgs = ["-t data", "-t topics", ...sequenceNames.map((seq) => `-t ${seq}`)].join(" ");
            const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --schema-only ${tableArgs}`;
            let pgDumpOutput = "";
            try {
                const { stdout } = await execAsync(pgDumpCommand, {
                    env: { ...process.env, PGPASSWORD: password },
                    maxBuffer: 10 * 1024 * 1024,
                });
                pgDumpOutput = stdout;
            }
            catch (dumpError) {
                this.logger.warn(`pg_dump failed, falling back to manual schema generation: ${dumpError?.message}`);
                pgDumpOutput = "";
            }
            let createTablesSql = "";
            let createConstraintsSql = "";
            let createIndexesSql = "";
            if (pgDumpOutput) {
                const lines = pgDumpOutput.split("\n");
                const sequenceLines = [];
                const tableLines = [];
                const constraintLines = [];
                const indexLines = [];
                let currentSection = "skip";
                let currentStatement = "";
                for (const line of lines) {
                    if (line.startsWith("--") || line.match(/^SET /i) || line.match(/^SELECT pg_catalog/i)) {
                        continue;
                    }
                    if (line.match(/^CREATE SEQUENCE/i)) {
                        currentSection = "sequence";
                        currentStatement = line.replace(/^CREATE SEQUENCE/i, "CREATE SEQUENCE IF NOT EXISTS");
                    }
                    else if (line.match(/^CREATE TABLE/i)) {
                        currentSection = "table";
                        currentStatement = line.replace(/^CREATE TABLE/i, "CREATE TABLE IF NOT EXISTS");
                    }
                    else if (line.match(/^ALTER TABLE .* ADD CONSTRAINT/i) && line.match(/PRIMARY KEY/i)) {
                        currentSection = "constraint";
                        currentStatement = line;
                    }
                    else if (line.match(/^CREATE .*INDEX/i)) {
                        currentSection = "index";
                        currentStatement = line;
                    }
                    else if (line.trim() === "") {
                        if (currentStatement && currentSection !== "skip") {
                            if (currentSection === "sequence") {
                                sequenceLines.push(currentStatement);
                            }
                            else if (currentSection === "table") {
                                tableLines.push(currentStatement);
                            }
                            else if (currentSection === "constraint") {
                                constraintLines.push(currentStatement);
                            }
                            else if (currentSection === "index") {
                                indexLines.push(currentStatement);
                            }
                        }
                        currentStatement = "";
                        currentSection = "skip";
                    }
                    else {
                        if (currentSection !== "skip") {
                            currentStatement += "\n" + line;
                        }
                    }
                }
                if (currentStatement && currentSection !== "skip") {
                    if (currentSection === "sequence") {
                        sequenceLines.push(currentStatement);
                    }
                    else if (currentSection === "table") {
                        tableLines.push(currentStatement);
                    }
                    else if (currentSection === "constraint") {
                        constraintLines.push(currentStatement);
                    }
                    else if (currentSection === "index") {
                        indexLines.push(currentStatement);
                    }
                }
                createTablesSql = [...sequenceLines, ...tableLines].join("\n\n");
                createConstraintsSql = constraintLines.join("\n");
                createIndexesSql = indexLines.join("\n");
            }
            if (!createTablesSql) {
                const sequenceQuery = `
          SELECT DISTINCT
            substring(c.column_default from 'nextval\\(''([^'']+)''') as sequence_name
          FROM information_schema.columns c
          WHERE c.table_name IN ('data', 'topics')
            AND c.column_default LIKE '%nextval%'
          ORDER BY 1
        `;
                const sequenceResult = await this.pool.query(sequenceQuery);
                const createSequencesSql = sequenceResult.rows
                    .filter((row) => row.sequence_name !== null)
                    .map((row) => `CREATE SEQUENCE IF NOT EXISTS ${row.sequence_name};`)
                    .join("\n");
                const tableSchemaQuery = `
          SELECT 
            t.table_name,
            string_agg(
              '    ' || c.column_name || ' ' || 
              UPPER(c.data_type) || 
              CASE 
                WHEN c.character_maximum_length IS NOT NULL 
                THEN '(' || c.character_maximum_length || ')'
                ELSE ''
              END ||
              CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
              CASE 
                WHEN c.column_default IS NOT NULL 
                THEN ' DEFAULT ' || c.column_default 
                ELSE '' 
              END,
              E',\\n'
              ORDER BY c.ordinal_position
            ) as columns
          FROM information_schema.tables t
          JOIN information_schema.columns c ON t.table_name = c.table_name
          WHERE t.table_schema = 'public' 
            AND t.table_name IN ('data', 'topics')
          GROUP BY t.table_name
          ORDER BY t.table_name
        `;
                const schemaResult = await this.pool.query(tableSchemaQuery);
                createTablesSql = [
                    createSequencesSql,
                    schemaResult.rows
                        .map((row) => `CREATE TABLE IF NOT EXISTS ${row.table_name} (\n${row.columns}\n);`)
                        .join("\n\n"),
                ]
                    .filter((sql) => sql.length > 0)
                    .join("\n\n");
            }
            if (!createConstraintsSql) {
                const pkQuery = `
          SELECT 
            tc.table_name,
            string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as pk_columns
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY' 
            AND tc.table_name IN ('data', 'topics')
          GROUP BY tc.table_name
          ORDER BY tc.table_name
        `;
                const pkResult = await this.pool.query(pkQuery);
                createConstraintsSql = pkResult.rows
                    .map((row) => `ALTER TABLE ${row.table_name} ADD PRIMARY KEY (${row.pk_columns});`)
                    .join("\n");
            }
            if (!createIndexesSql) {
                const idxQuery = `
          SELECT indexdef || ';' as idx
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename IN ('data', 'topics')
            AND indexname NOT LIKE '%_pkey'
          ORDER BY tablename, indexname
        `;
                const idxResult = await this.pool.query(idxQuery);
                createIndexesSql = idxResult.rows.map((row) => row.idx).join("\n");
            }
            const isSelfSigned = await this.isProxyCertificateSelfSigned();
            const sslMode = isSelfSigned ? "prefer" : "require";
            const replicationPort = this.configService.historian.replicationPort;
            const createSubscriptionTemplate = `CREATE SUBSCRIPTION historian_sub
CONNECTION 'host={{HOSTNAME}} port=${replicationPort} dbname=historian user=replicator password=YOUR_REPLICATOR_PASSWORD sslmode=${sslMode}'
PUBLICATION historian_pub
WITH (
    copy_data = true,
    create_slot = true,
    enabled = true,
    slot_name = 'historian_sub_slot'
);`;
            const checkSchemaMatchSql = `-- On subscriber: Compare table structures
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('data', 'topics')
ORDER BY table_name, ordinal_position;`;
            const checkReplicationLagSql = `-- On subscriber: Check replication lag
SELECT 
    subname AS subscription_name,
    latest_end_lsn,
    latest_end_time,
    NOW() - latest_end_time AS replication_lag
FROM pg_stat_subscription
WHERE subname = 'historian_sub';`;
            const checkSubscriptionStatusSql = `-- On subscriber: Check subscription and sync status
SELECT 
    subname,
    relname,
    CASE srsubstate
        WHEN 'i' THEN 'Initializing'
        WHEN 'd' THEN 'Data is being copied'
        WHEN 's' THEN 'Synchronized'
        WHEN 'r' THEN 'Ready (streaming)'
    END as sync_state
FROM pg_subscription_rel psr
JOIN pg_subscription ps ON ps.oid = psr.srsubid
JOIN pg_class pc ON pc.oid = psr.srrelid
WHERE subname = 'historian_sub';`;
            const checkSyncErrorsSql = `-- On subscriber: Check for sync errors
SELECT 
    subname,
    sync_error_count,
    apply_error_count
FROM pg_stat_subscription_stats
WHERE subname = 'historian_sub';`;
            const systemPublishingStatus = await this.getSystemPublishingStatus();
            return {
                publisherInfo: {
                    publicationName,
                    publishedTables,
                    activeConnections,
                    replicationSlots,
                },
                subscriberSetupSql: {
                    createTablesSql,
                    createConstraintsSql,
                    createIndexesSql,
                    createSubscriptionTemplate,
                },
                monitoringSql: {
                    checkSchemaMatchSql,
                    checkReplicationLagSql,
                    checkSubscriptionStatusSql,
                    checkSyncErrorsSql,
                },
                systemPublishingStatus,
            };
        }
        catch (error) {
            this.logger.error("Error fetching replication info", error);
            throw error;
        }
    }
};
exports.HistorianService = HistorianService;
exports.HistorianService = HistorianService = HistorianService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService])
], HistorianService);
//# sourceMappingURL=historian.service.js.map