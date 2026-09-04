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
const fs = require("fs");
const path = require("path");
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
        const templatesDir = path.join(__dirname, "templates");
        try {
            this.subscribeHistorianShTemplate = fs.readFileSync(path.join(templatesDir, "subscribe-historian.sh"), "utf8");
            this.subscribeHistorianPs1Template = fs.readFileSync(path.join(templatesDir, "subscribe-historian.ps1"), "utf8");
        }
        catch (err) {
            this.logger.warn(`Could not load subscribe-historian templates from ${templatesDir}: ${err.message}. ` +
                `Path B script fields will be empty on the /historian page.`);
            this.subscribeHistorianShTemplate = "";
            this.subscribeHistorianPs1Template = "";
        }
    }
    async onModuleInit() {
        if (this.configService.instanceName === "Schema") {
            return;
        }
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
        const entry = (0, metrics_1.resolveUnitMetricEntry)(metric, this.configService.historian.topicMap);
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
                value: (0, metrics_1.applyTransform)(this.parseValue(row.value_string), entry.transform),
                timestamp: new Date(row.ts),
                metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) },
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
        const entry = (0, metrics_1.resolveWeatherMetricEntry)(metric, this.configService.historian.topicMap);
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
                value: (0, metrics_1.applyTransform)(this.parseValue(row.value_string), entry.transform),
                timestamp: new Date(row.ts),
                metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) },
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
        const entry = (0, metrics_1.resolveUnitMetricEntry)(metric, this.configService.historian.topicMap);
        const topicPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return {
                    system,
                    metric,
                    data: [],
                    metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) },
                };
            }
            const bucketing = this.resolveBucketing(startTime, endTime);
            const { aggregation } = entry;
            const numericValueExpr = `CASE
        WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
          THEN value_string::double precision
        ELSE NULL
      END`;
            const result = bucketing.mode === "binned"
                ? await this.pool.query(`
          SELECT
            date_bin($4::interval, ts, $2::timestamptz) AS timestamp,
            ${(0, metrics_1.aggregationSql)(aggregation, numericValueExpr)} AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          GROUP BY 1
          ORDER BY 1
        `, [topicId, startTime, endTime, bucketing.sql])
                : await this.pool.query(`
          SELECT
            ts AS timestamp,
            CASE
              WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
                THEN value_string::double precision
              ELSE NULL
            END AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          ORDER BY ts
        `, [topicId, startTime, endTime]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            const data = result.rows.map((row) => ({
                timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
                value: (0, metrics_1.applyTransform)(HistorianService_1.toNumber(row.value), entry.transform),
                system,
                metric,
            }));
            return {
                system,
                metric,
                data,
                metadata: {
                    topics,
                    errors,
                    binning: HistorianService_1.buildBinningInfo(bucketing),
                    aggregation: bucketing.mode === "binned" ? aggregation : undefined,
                    ...HistorianService_1.displayMetadata(entry),
                },
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
        const entry = (0, metrics_1.resolveWeatherMetricEntry)(metric, this.configService.historian.topicMap);
        const topicPath = (0, metrics_1.buildWeatherTopicPath)(campus, building, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return {
                    system: "weather",
                    metric,
                    data: [],
                    metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) },
                };
            }
            const bucketing = this.resolveBucketing(startTime, endTime);
            const { aggregation } = entry;
            const numericValueExpr = `CASE
        WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
          THEN value_string::double precision
        ELSE NULL
      END`;
            const result = bucketing.mode === "binned"
                ? await this.pool.query(`
          SELECT
            date_bin($4::interval, ts, $2::timestamptz) AS timestamp,
            ${(0, metrics_1.aggregationSql)(aggregation, numericValueExpr)} AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          GROUP BY 1
          ORDER BY 1
        `, [topicId, startTime, endTime, bucketing.sql])
                : await this.pool.query(`
          SELECT
            ts AS timestamp,
            ${numericValueExpr} AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          ORDER BY ts
        `, [topicId, startTime, endTime]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            const data = result.rows.map((row) => ({
                timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
                value: (0, metrics_1.applyTransform)(HistorianService_1.toNumber(row.value), entry.transform),
                system: "weather",
                metric,
            }));
            return {
                system: "weather",
                metric,
                data,
                metadata: {
                    topics,
                    errors,
                    binning: HistorianService_1.buildBinningInfo(bucketing),
                    aggregation: bucketing.mode === "binned" ? aggregation : undefined,
                    ...HistorianService_1.displayMetadata(entry),
                },
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
        const entry = (0, metrics_1.resolveUnitMetricEntry)(metric, this.configService.historian.topicMap);
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
                return { aggregates: [], metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) } };
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
                    value: (0, metrics_1.applyTransform)(typeof row.value === "string" ? parseFloat(row.value) : null, entry.transform),
                    metric,
                })),
                metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) },
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
        const entry = (0, metrics_1.resolveWeatherMetricEntry)(metric, this.configService.historian.topicMap);
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
                return { aggregates: [], metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) } };
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
                    value: (0, metrics_1.applyTransform)(typeof row.value === "string" ? parseFloat(row.value) : null, entry.transform),
                    metric,
                })),
                metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) },
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
        const entry = (0, metrics_1.resolveMeterMetricEntry)(metric, this.configService.historian.topicMap);
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
                value: (0, metrics_1.applyTransform)(this.parseValue(row.value_string), entry.transform),
                timestamp: new Date(row.ts),
                metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) },
            };
        }
        catch (error) {
            this.logger.error("Error fetching meter current value", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getMeterTimeSeries(campus, building, metric, startTime, endTime, opts) {
        const errors = [];
        const topics = {};
        const entry = (0, metrics_1.resolveMeterMetricEntry)(metric, this.configService.historian.topicMap);
        const topicPath = (0, metrics_1.buildMeterTopicPath)(campus, building, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        try {
            const topicId = await this.resolveTopicId(topicPath);
            if (topicId === null) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return {
                    system: "meter",
                    metric,
                    data: [],
                    metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) },
                };
            }
            const bucketing = this.resolveBucketing(startTime, endTime, undefined, opts?.rawThreshold);
            const { aggregation } = entry;
            const numericValueExpr = `CASE
        WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
          THEN value_string::double precision
        ELSE NULL
      END`;
            const extraAggs = bucketing.mode === "binned" && opts?.aggregations?.length ? opts.aggregations : [];
            const extraSelects = extraAggs
                .map((agg, i) => `, ${(0, metrics_1.aggregationSql)(agg, numericValueExpr)} AS agg_${i}`)
                .join("");
            const result = bucketing.mode === "binned"
                ? await this.pool.query(`
          SELECT
            date_bin($4::interval, ts, $2::timestamptz) AS timestamp,
            ${(0, metrics_1.aggregationSql)(aggregation, numericValueExpr)} AS value${extraSelects}
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          GROUP BY 1
          ORDER BY 1
        `, [topicId, startTime, endTime, bucketing.sql])
                : await this.pool.query(`
          SELECT
            ts AS timestamp,
            ${numericValueExpr} AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          ORDER BY ts
        `, [topicId, startTime, endTime]);
            if (result.rows.length === 0) {
                errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            const data = result.rows.map((row) => ({
                timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
                value: (0, metrics_1.applyTransform)(HistorianService_1.toNumber(row.value), entry.transform),
                system: "meter",
                metric,
            }));
            const aggregations = extraAggs.length
                ? extraAggs.map((agg, i) => ({
                    aggregation: agg,
                    data: result.rows.map((row) => ({
                        timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
                        value: (0, metrics_1.applyTransform)(HistorianService_1.toNumber(row[`agg_${i}`]), entry.transform),
                        system: "meter",
                        metric,
                    })),
                }))
                : undefined;
            return {
                system: "meter",
                metric,
                data,
                aggregations,
                metadata: {
                    topics,
                    errors,
                    binning: HistorianService_1.buildBinningInfo(bucketing),
                    aggregation: bucketing.mode === "binned" ? aggregation : undefined,
                    ...HistorianService_1.displayMetadata(entry),
                },
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
        const entry = (0, metrics_1.resolveMeterMetricEntry)(metric, this.configService.historian.topicMap);
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
                return { aggregates: [], metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) } };
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
                    value: (0, metrics_1.applyTransform)(typeof row.value === "string" ? parseFloat(row.value) : null, entry.transform),
                    metric,
                })),
                metadata: { topics, errors, ...HistorianService_1.displayMetadata(entry) },
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
        const bucketing = this.resolveBucketing(startTime, endTime, interval ?? undefined);
        const msuEntry = (0, metrics_1.resolveUnitMetricEntry)(metric, this.configService.historian.topicMap);
        const { aggregation: msuAggregation } = msuEntry;
        const binning = HistorianService_1.buildBinningInfo(bucketing);
        const aggregationLabel = bucketing.mode === "binned" ? msuAggregation : undefined;
        const displayMeta = HistorianService_1.displayMetadata(msuEntry);
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
                const aggregation = msuAggregation;
                const valueExpr = `CAST(NULLIF(value_string, 'null') AS double precision)`;
                try {
                    if (bucketing.mode === "binned") {
                        const query = `
              SELECT
                date_bin($4::interval, ts, $1::timestamptz) AS timestamp,
                topic_id,
                ${(0, metrics_1.aggregationSql)(aggregation, valueExpr)} AS value
              FROM data
              WHERE topic_id = ANY($3::int[])
                AND ts >= $1
                AND ts <= $2
              GROUP BY 1, 2
              ORDER BY 1, 2
            `;
                        const result = await this.pool.query(query, [startTime, endTime, topicIds, bucketing.sql]);
                        result.rows.forEach((row) => {
                            const sys = topicIdToSystem.get(row.topic_id);
                            if (!sys)
                                return;
                            queryResult[sys].push({
                                timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
                                value: (0, metrics_1.applyTransform)(typeof row.value === "string" ? parseFloat(row.value) : (row.value ?? null), msuEntry.transform),
                                system: sys,
                                metric,
                            });
                        });
                    }
                    else {
                        const query = `
              SELECT
                ts AS timestamp,
                topic_id,
                CAST(NULLIF(value_string, 'null') AS double precision) AS value
              FROM data
              WHERE topic_id = ANY($3::int[])
                AND ts >= $1
                AND ts <= $2
              ORDER BY topic_id, ts
            `;
                        const result = await this.pool.query(query, [startTime, endTime, topicIds]);
                        result.rows.forEach((row) => {
                            const sys = topicIdToSystem.get(row.topic_id);
                            if (!sys)
                                return;
                            queryResult[sys].push({
                                timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
                                value: (0, metrics_1.applyTransform)(typeof row.value === "string" ? parseFloat(row.value) : (row.value ?? null), msuEntry.transform),
                                system: sys,
                                metric,
                            });
                        });
                    }
                }
                catch (error) {
                    this.logger.error("Error fetching multi-system data", error);
                    throw error;
                }
            }
        }
        const fillBuckets = (existing, sys) => {
            if (bucketing.mode !== "binned")
                return existing;
            const byBucket = new Map();
            for (const pt of existing)
                byBucket.set(pt.timestamp.getTime(), pt);
            const filled = [];
            const fillStartMs = startTime.getTime();
            const fillEndMs = endTime.getTime();
            for (let bucketMs = fillStartMs; bucketMs <= fillEndMs; bucketMs += bucketing.ms) {
                const pt = byBucket.get(bucketMs);
                if (pt) {
                    filled.push(pt);
                }
                else {
                    filled.push({ timestamp: new Date(bucketMs), value: null, system: sys, metric });
                }
            }
            return filled;
        };
        const results = systems.map((sys) => {
            const raw = queryResult[sys] ?? [];
            const data = fillBuckets(raw, sys);
            const errors = [];
            if (raw.length === 0) {
                errors.push(`No data found for topic: ${systemTopics[sys]} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                system: sys,
                data,
                metadata: {
                    topics: { [metric]: systemTopics[sys] },
                    errors,
                    binning,
                    aggregation: aggregationLabel,
                    ...displayMeta,
                },
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
                    binning,
                    aggregation: aggregationLabel,
                    ...displayMeta,
                },
            });
        });
        return results;
    }
    async getSiteAggregateUnit(campus, building, systems, metric, startTime, endTime, crossSystemAggregation, bucketAggregation, interval, excludeSystem) {
        const errors = [];
        const topics = {};
        const entry = (0, metrics_1.resolveUnitMetricEntry)(metric, this.configService.historian.topicMap);
        const effectiveBucketAgg = bucketAggregation ?? entry.aggregation;
        const includedSystems = excludeSystem
            ? systems.filter((s) => s.toLowerCase() !== excludeSystem.toLowerCase())
            : [...systems];
        const systemTopics = {};
        includedSystems.forEach((sys) => {
            const path = (0, metrics_1.buildUnitTopicPath)(campus, building, sys, metric, this.configService.historian.topicMap);
            systemTopics[sys] = path;
            topics[`${sys}.${metric}`] = path;
        });
        const resolved = this.resolveBucketing(startTime, endTime, interval ?? undefined);
        const bucketing = resolved.mode === "binned"
            ? resolved
            : { mode: "binned", ...this.deriveBucketInterval(startTime, endTime) };
        const binning = HistorianService_1.buildBinningInfo(bucketing);
        const displayMeta = HistorianService_1.displayMetadata(entry);
        const system = "site";
        if (includedSystems.length === 0) {
            errors.push("No systems available for site aggregation");
            return {
                system,
                metric,
                data: [],
                metadata: { topics, errors, binning, aggregation: crossSystemAggregation, ...displayMeta },
            };
        }
        try {
            const pathToId = await this.resolveTopicIds(Object.values(systemTopics));
            const topicIds = Array.from(pathToId.values());
            if (topicIds.length === 0) {
                errors.push(`No topics found for site aggregation in ${campus}/${building} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
                return {
                    system,
                    metric,
                    data: [],
                    metadata: { topics, errors, binning, aggregation: crossSystemAggregation, ...displayMeta },
                };
            }
            const valueExpr = `CAST(NULLIF(value_string, 'null') AS double precision)`;
            const query = `
        WITH per_topic AS (
          SELECT
            date_bin($4::interval, ts, $1::timestamptz) AS timestamp,
            topic_id,
            ${(0, metrics_1.aggregationSql)(effectiveBucketAgg, valueExpr)} AS value
          FROM data
          WHERE topic_id = ANY($3::int[])
            AND ts >= $1
            AND ts <= $2
          GROUP BY 1, 2
        )
        SELECT
          timestamp,
          ${(0, metrics_1.aggregationSql)(crossSystemAggregation, "value", "timestamp")} AS value
        FROM per_topic
        WHERE value IS NOT NULL
        GROUP BY timestamp
        ORDER BY timestamp
      `;
            const result = await this.pool.query(query, [
                startTime,
                endTime,
                topicIds,
                bucketing.sql,
            ]);
            if (result.rows.length === 0) {
                errors.push(`No data found for site aggregation in ${campus}/${building} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            const data = result.rows.map((row) => ({
                timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
                value: (0, metrics_1.applyTransform)(HistorianService_1.toNumber(row.value), entry.transform),
                system,
                metric,
            }));
            return {
                system,
                metric,
                data,
                metadata: {
                    topics,
                    errors,
                    binning,
                    aggregation: crossSystemAggregation,
                    ...displayMeta,
                },
            };
        }
        catch (error) {
            this.logger.error("Error fetching site aggregate data", error);
            errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getMultiSystemUnitRanges(campus, building, systems, deniedSystems, metric, startTime, endTime) {
        if (systems.length === 0 && deniedSystems.length === 0) {
            return [];
        }
        const grouped = {};
        systems.forEach((sys) => {
            grouped[sys.toUpperCase()] = [];
        });
        const rangesEntry = (0, metrics_1.resolveUnitMetricEntry)(metric, this.configService.historian.topicMap);
        const rangesDisplayMeta = HistorianService_1.displayMetadata(rangesEntry);
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
                const { aggregation } = rangesEntry;
                const valueExpr = `CAST(NULLIF(value_string, 'null') AS double precision)`;
                const bucketing = this.resolveBucketing(startTime, endTime);
                try {
                    if (bucketing.mode === "binned") {
                        const query = `
              SELECT
                topic_id,
                date_bin($4::interval, ts, $1::timestamptz) AS bucket,
                ${(0, metrics_1.aggregationSql)(aggregation, valueExpr)} AS value
              FROM data
              WHERE topic_id = ANY($3::int[])
                AND ts >= $1
                AND ts <= $2
              GROUP BY 1, 2
              ORDER BY 1, 2
            `;
                        const result = await this.pool.query(query, [startTime, endTime, topicIds, bucketing.sql]);
                        const seriesByTopic = new Map();
                        for (const row of result.rows) {
                            let arr = seriesByTopic.get(row.topic_id);
                            if (!arr) {
                                arr = [];
                                seriesByTopic.set(row.topic_id, arr);
                            }
                            const bucketMs = row.bucket instanceof Date ? row.bucket.getTime() : new Date(row.bucket).getTime();
                            const value = (0, metrics_1.applyTransform)(HistorianService_1.toNumber(row.value), rangesEntry.transform);
                            arr.push({ bucketMs, value });
                        }
                        const stepMs = bucketing.ms;
                        const endMs = endTime.getTime();
                        for (const [topicId, series] of seriesByTopic) {
                            const sys = topicIdToSystem.get(topicId);
                            if (!sys)
                                continue;
                            const key = sys.toUpperCase();
                            if (!grouped[key])
                                continue;
                            let cur = null;
                            for (const pt of series) {
                                if (pt.value == null) {
                                    if (cur) {
                                        grouped[key].push({
                                            startTime: new Date(cur.startMs),
                                            endTime: new Date(pt.bucketMs),
                                            value: cur.value,
                                            system: sys,
                                            metric,
                                        });
                                        cur = null;
                                    }
                                    continue;
                                }
                                if (!cur) {
                                    cur = { startMs: pt.bucketMs, value: pt.value };
                                }
                                else if (pt.value !== cur.value) {
                                    grouped[key].push({
                                        startTime: new Date(cur.startMs),
                                        endTime: new Date(pt.bucketMs),
                                        value: cur.value,
                                        system: sys,
                                        metric,
                                    });
                                    cur = { startMs: pt.bucketMs, value: pt.value };
                                }
                            }
                            if (cur) {
                                const lastBucketMs = series.length > 0 ? series[series.length - 1].bucketMs : cur.startMs;
                                grouped[key].push({
                                    startTime: new Date(cur.startMs),
                                    endTime: new Date(Math.min(lastBucketMs + stepMs, endMs)),
                                    value: cur.value,
                                    system: sys,
                                    metric,
                                });
                            }
                        }
                    }
                    else {
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
                                    value: (0, metrics_1.applyTransform)(row.value, rangesEntry.transform),
                                    system: sys,
                                    metric,
                                });
                            }
                        });
                    }
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
                metadata: { topics: { [metric]: topicPath }, errors, ...rangesDisplayMeta },
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
                    ...rangesDisplayMeta,
                },
            });
        });
        return results;
    }
    async getMultiSystemSetpointErrorRanges(campus, building, systems, deniedSystems, startTime, endTime) {
        if (systems.length === 0 && deniedSystems.length === 0) {
            return [];
        }
        const tempMetric = common_3.UnitMetric.ZoneTemperature;
        const occMetric = common_3.UnitMetric.OccupancyCommand;
        const occHeatMetric = common_3.UnitMetric.OccupiedHeatingSetPoint;
        const occCoolMetric = common_3.UnitMetric.OccupiedCoolingSetPoint;
        const unoccHeatMetric = common_3.UnitMetric.UnoccupiedHeatingSetPoint;
        const unoccCoolMetric = common_3.UnitMetric.UnoccupiedCoolingSetPoint;
        const topicMap = this.configService.historian.topicMap;
        const buildTopics = (sys) => ({
            [tempMetric]: (0, metrics_1.buildUnitTopicPath)(campus, building, sys, tempMetric, topicMap),
            [occMetric]: (0, metrics_1.buildUnitTopicPath)(campus, building, sys, occMetric, topicMap),
            [occHeatMetric]: (0, metrics_1.buildUnitTopicPath)(campus, building, sys, occHeatMetric, topicMap),
            [occCoolMetric]: (0, metrics_1.buildUnitTopicPath)(campus, building, sys, occCoolMetric, topicMap),
            [unoccHeatMetric]: (0, metrics_1.buildUnitTopicPath)(campus, building, sys, unoccHeatMetric, topicMap),
            [unoccCoolMetric]: (0, metrics_1.buildUnitTopicPath)(campus, building, sys, unoccCoolMetric, topicMap),
        });
        const grouped = {};
        systems.forEach((sys) => {
            grouped[sys.toUpperCase()] = [];
        });
        if (systems.length > 0) {
            const sysTopics = new Map(systems.map((sys) => [sys, buildTopics(sys)]));
            const allPaths = [];
            for (const t of sysTopics.values())
                allPaths.push(...Object.values(t));
            const pathToId = await this.resolveTopicIds(allPaths);
            const kindMetric = {
                temp: tempMetric,
                occ: occMetric,
                occHeat: occHeatMetric,
                occCool: occCoolMetric,
                unoccHeat: unoccHeatMetric,
                unoccCool: unoccCoolMetric,
            };
            const idToSystemByKind = {
                temp: new Map(),
                occ: new Map(),
                occHeat: new Map(),
                occCool: new Map(),
                unoccHeat: new Map(),
                unoccCool: new Map(),
            };
            const allTempIds = [];
            const allOccIds = [];
            const allSetpointIds = [];
            for (const [sys, t] of sysTopics) {
                for (const kind of Object.keys(kindMetric)) {
                    const id = pathToId.get(t[kindMetric[kind]]);
                    if (id === undefined)
                        continue;
                    idToSystemByKind[kind].set(id, sys);
                    if (kind === "temp")
                        allTempIds.push(id);
                    else if (kind === "occ")
                        allOccIds.push(id);
                    else
                        allSetpointIds.push(id);
                }
            }
            if (allTempIds.length > 0) {
                const bucketInterval = this.deriveSetpointErrorBucketInterval(startTime, endTime);
                const tempQuery = `
          SELECT
            topic_id,
            date_bin($4::interval, ts, $1::timestamptz) AS bucket,
            AVG(
              CASE
                WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
                  THEN value_string::double precision
                ELSE NULL
              END
            ) AS temp_value
          FROM data
          WHERE topic_id = ANY($3::int[])
            AND ts >= $1
            AND ts <= $2
          GROUP BY 1, 2
          ORDER BY 1, 2
        `;
                const setpointQuery = `
          SELECT
            topic_id,
            ts,
            CASE
              WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
                THEN value_string::double precision
              ELSE NULL
            END AS sp_value
          FROM data
          WHERE topic_id = ANY($3::int[])
            AND ts >= $1::timestamptz - interval '30 days'
            AND ts <= $2
            AND value_string IS NOT NULL
            AND value_string <> 'null'
          ORDER BY topic_id, ts
        `;
                const occupancyQuery = `
          SELECT
            topic_id,
            ts,
            CASE
              WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?$'
                THEN value_string::double precision
              ELSE NULL
            END AS occ_value
          FROM data
          WHERE topic_id = ANY($3::int[])
            AND ts >= $1::timestamptz - interval '30 days'
            AND ts <= $2
            AND value_string IS NOT NULL
            AND value_string <> 'null'
          ORDER BY topic_id, ts
        `;
                try {
                    const tempPromise = this.pool.query(tempQuery, [startTime, endTime, allTempIds, bucketInterval.sql]);
                    const setpointPromise = allSetpointIds.length > 0
                        ? this.pool.query(setpointQuery, [startTime, endTime, allSetpointIds])
                        : Promise.resolve({
                            rows: [],
                        });
                    const occupancyPromise = allOccIds.length > 0
                        ? this.pool.query(occupancyQuery, [startTime, endTime, allOccIds])
                        : Promise.resolve({
                            rows: [],
                        });
                    const [tempResult, setpointResult, occupancyResult] = await Promise.all([
                        tempPromise,
                        setpointPromise,
                        occupancyPromise,
                    ]);
                    const tempByBucketBySys = new Map();
                    for (const row of tempResult.rows) {
                        const sys = idToSystemByKind.temp.get(row.topic_id);
                        if (!sys)
                            continue;
                        const v = HistorianService_1.toNumber(row.temp_value);
                        if (v == null)
                            continue;
                        const bucketMs = row.bucket instanceof Date ? row.bucket.getTime() : new Date(row.bucket).getTime();
                        let m = tempByBucketBySys.get(sys);
                        if (!m) {
                            m = new Map();
                            tempByBucketBySys.set(sys, m);
                        }
                        m.set(bucketMs, v);
                    }
                    const setpointsBySys = new Map();
                    const ensureSetpoints = (sys) => {
                        let entry = setpointsBySys.get(sys);
                        if (!entry) {
                            entry = { occHeat: [], occCool: [], unoccHeat: [], unoccCool: [] };
                            setpointsBySys.set(sys, entry);
                        }
                        return entry;
                    };
                    for (const row of setpointResult.rows) {
                        const v = HistorianService_1.toNumber(row.sp_value);
                        if (v == null)
                            continue;
                        const t = row.ts instanceof Date ? row.ts.getTime() : new Date(row.ts).getTime();
                        const sample = { t, v };
                        const occHeatSys = idToSystemByKind.occHeat.get(row.topic_id);
                        if (occHeatSys) {
                            ensureSetpoints(occHeatSys).occHeat.push(sample);
                            continue;
                        }
                        const occCoolSys = idToSystemByKind.occCool.get(row.topic_id);
                        if (occCoolSys) {
                            ensureSetpoints(occCoolSys).occCool.push(sample);
                            continue;
                        }
                        const unoccHeatSys = idToSystemByKind.unoccHeat.get(row.topic_id);
                        if (unoccHeatSys) {
                            ensureSetpoints(unoccHeatSys).unoccHeat.push(sample);
                            continue;
                        }
                        const unoccCoolSys = idToSystemByKind.unoccCool.get(row.topic_id);
                        if (unoccCoolSys) {
                            ensureSetpoints(unoccCoolSys).unoccCool.push(sample);
                        }
                    }
                    const occupanciesBySys = new Map();
                    for (const row of occupancyResult.rows) {
                        const sys = idToSystemByKind.occ.get(row.topic_id);
                        if (!sys)
                            continue;
                        const v = HistorianService_1.toNumber(row.occ_value);
                        if (v == null)
                            continue;
                        const t = row.ts instanceof Date ? row.ts.getTime() : new Date(row.ts).getTime();
                        let arr = occupanciesBySys.get(sys);
                        if (!arr) {
                            arr = [];
                            occupanciesBySys.set(sys, arr);
                        }
                        arr.push({ t, v });
                    }
                    const startMs = startTime.getTime();
                    const endMs = endTime.getTime();
                    for (const sys of idToSystemByKind.temp.values()) {
                        const tempByBucket = tempByBucketBySys.get(sys) ?? new Map();
                        const sp = setpointsBySys.get(sys) ?? { occHeat: [], occCool: [], unoccHeat: [], unoccCool: [] };
                        const occupancies = occupanciesBySys.get(sys) ?? [];
                        const series = HistorianService_1.computeBucketErrorSeries({
                            startMs,
                            endMs,
                            stepMs: bucketInterval.ms,
                            tempByBucket,
                            occupancies,
                            occHeat: sp.occHeat,
                            occCool: sp.occCool,
                            unoccHeat: sp.unoccHeat,
                            unoccCool: sp.unoccCool,
                        });
                        const ranges = HistorianService_1.collapseErrorSeriesToRanges(series, endMs, sys, tempMetric);
                        const key = sys.toUpperCase();
                        if (grouped[key])
                            grouped[key].push(...ranges);
                    }
                }
                catch (error) {
                    this.logger.error("Error fetching setpoint error ranges", error);
                    throw error;
                }
            }
        }
        const results = systems.map((sys) => {
            const ranges = grouped[sys.toUpperCase()] || [];
            const errors = [];
            if (ranges.length === 0) {
                errors.push(`No setpoint error data found for ${sys} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                system: sys,
                ranges,
                metadata: {
                    topics: buildTopics(sys),
                    errors,
                },
            };
        });
        deniedSystems.forEach((sys) => {
            results.push({
                system: sys,
                ranges: [],
                metadata: {
                    topics: buildTopics(sys),
                    errors: [`Access denied: User has no permissions for ${campus}/${building}/${sys}`],
                },
            });
        });
        return results;
    }
    static snapToNiceSeconds(targetSec) {
        const list = HistorianService_1.NICE_BUCKET_SECONDS;
        return list.find((s) => s >= targetSec) ?? list[list.length - 1];
    }
    deriveBucketInterval(startTime, endTime) {
        const rangeMs = Math.max(1, endTime.getTime() - startTime.getTime());
        const targetBuckets = Math.max(1, this.configService.historian.binning.count);
        const targetSec = Math.max(1, Math.ceil(rangeMs / 1000 / targetBuckets));
        const chosen = HistorianService_1.snapToNiceSeconds(targetSec);
        return { sql: `${chosen} seconds`, ms: chosen * 1000 };
    }
    static computeSetpointErrorFloorSec(binning) {
        let raw;
        if (binning.setpointErrorMinBucket) {
            raw = Math.max(1, Math.ceil(HistorianService_1.parseClientInterval(binning.setpointErrorMinBucket).ms / 1000));
        }
        else {
            const thresholdMs = Math.max(0, binning.start) * HistorianService_1.msPerDurationUnit(binning.unit);
            raw = Math.max(1, Math.ceil(thresholdMs / 1000 / Math.max(1, binning.count)));
        }
        return HistorianService_1.snapToNiceSeconds(raw);
    }
    deriveSetpointErrorBucketInterval(startTime, endTime) {
        const base = this.deriveBucketInterval(startTime, endTime);
        const flooredSec = HistorianService_1.computeSetpointErrorFloorSec(this.configService.historian.binning);
        if (base.ms >= flooredSec * 1000)
            return base;
        return { sql: `${flooredSec} seconds`, ms: flooredSec * 1000 };
    }
    resolveBucketing(startTime, endTime, clientInterval, rawThresholdOverride) {
        if (clientInterval) {
            const parsed = HistorianService_1.parseClientInterval(clientInterval);
            return { mode: "binned", sql: parsed.sql, ms: parsed.ms };
        }
        const thresholdMs = rawThresholdOverride
            ? Math.max(0, HistorianService_1.parseClientInterval(rawThresholdOverride).ms)
            : Math.max(0, this.configService.historian.binning.start) *
                HistorianService_1.msPerDurationUnit(this.configService.historian.binning.unit);
        const rangeMs = Math.max(0, endTime.getTime() - startTime.getTime());
        if (thresholdMs > 0 && rangeMs <= thresholdMs) {
            return { mode: "raw" };
        }
        const derived = this.deriveBucketInterval(startTime, endTime);
        return { mode: "binned", sql: derived.sql, ms: derived.ms };
    }
    static msPerDurationUnit(unit) {
        switch (unit) {
            case "milliseconds": return 1;
            case "seconds": return 1000;
            case "minutes": return 60_000;
            case "hours": return 3_600_000;
            case "days": return 86_400_000;
            case "weeks": return 604_800_000;
            case "months": return 30 * 86_400_000;
            case "years": return 365 * 86_400_000;
        }
    }
    static parseClientInterval(interval) {
        const match = interval.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error(`Invalid interval format: "${interval}". Use e.g. "5m", "1h", "30s".`);
        }
        const n = parseInt(match[1], 10);
        const unit = match[2];
        const unitMap = {
            s: { name: "seconds", ms: 1000 },
            m: { name: "minutes", ms: 60_000 },
            h: { name: "hours", ms: 3_600_000 },
            d: { name: "days", ms: 86_400_000 },
        };
        const u = unitMap[unit];
        return { sql: `${n} ${u.name}`, ms: n * u.ms };
    }
    static formatIntervalLabel(ms) {
        if (!Number.isFinite(ms) || ms <= 0)
            return `${Math.max(0, Math.round(ms))}ms`;
        const day = 86_400_000;
        const hour = 3_600_000;
        const minute = 60_000;
        const second = 1000;
        if (ms % day === 0)
            return `${ms / day}d`;
        if (ms % hour === 0)
            return `${ms / hour}h`;
        if (ms % minute === 0)
            return `${ms / minute}m`;
        return `${Math.round(ms / second)}s`;
    }
    static buildBinningInfo(bucketing) {
        if (bucketing.mode === "raw") {
            return { mode: "raw" };
        }
        return {
            mode: "binned",
            intervalMs: bucketing.ms,
            intervalLabel: HistorianService_1.formatIntervalLabel(bucketing.ms),
        };
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
    static displayMetadata(entry) {
        return {
            format: entry.format,
            prefix: entry.prefix === "" ? undefined : entry.prefix,
            suffix: entry.suffix === "" ? undefined : entry.suffix,
        };
    }
    static computeBucketErrorSeries(args) {
        const { startMs, endMs, stepMs, tempByBucket, occupancies, occHeat, occCool, unoccHeat, unoccCool } = args;
        const out = [];
        let occIdx = -1;
        let ohIdx = -1;
        let ocIdx = -1;
        let uhIdx = -1;
        let ucIdx = -1;
        for (let bucketMs = startMs; bucketMs <= endMs; bucketMs += stepMs) {
            const bucketEndMs = bucketMs + stepMs;
            while (occIdx + 1 < occupancies.length && occupancies[occIdx + 1].t <= bucketEndMs)
                occIdx++;
            while (ohIdx + 1 < occHeat.length && occHeat[ohIdx + 1].t <= bucketEndMs)
                ohIdx++;
            while (ocIdx + 1 < occCool.length && occCool[ocIdx + 1].t <= bucketEndMs)
                ocIdx++;
            while (uhIdx + 1 < unoccHeat.length && unoccHeat[uhIdx + 1].t <= bucketEndMs)
                uhIdx++;
            while (ucIdx + 1 < unoccCool.length && unoccCool[ucIdx + 1].t <= bucketEndMs)
                ucIdx++;
            const temp = tempByBucket.get(bucketMs);
            let value = null;
            if (temp != null && occIdx >= 0) {
                const occupiedMode = occupancies[occIdx].v === 2 || occupancies[occIdx].v === 1;
                const heat = occupiedMode
                    ? ohIdx >= 0
                        ? occHeat[ohIdx].v
                        : null
                    : uhIdx >= 0
                        ? unoccHeat[uhIdx].v
                        : null;
                const cool = occupiedMode
                    ? ocIdx >= 0
                        ? occCool[ocIdx].v
                        : null
                    : ucIdx >= 0
                        ? unoccCool[ucIdx].v
                        : null;
                if (heat != null && cool != null) {
                    value = temp < heat ? temp - heat : temp > cool ? temp - cool : 0;
                }
            }
            out.push({ bucketMs, value });
        }
        return out;
    }
    static collapseErrorSeriesToRanges(series, endMs, system, metric) {
        const ranges = [];
        let cur = null;
        for (const pt of series) {
            if (pt.value == null) {
                if (cur) {
                    ranges.push({
                        startTime: new Date(cur.startMs),
                        endTime: new Date(pt.bucketMs),
                        value: Math.round(cur.value * 10) / 10,
                        system,
                        metric,
                    });
                    cur = null;
                }
                continue;
            }
            if (!cur) {
                cur = { startMs: pt.bucketMs, value: pt.value };
            }
            else if (Math.abs(pt.value - cur.value) > 0.5) {
                ranges.push({
                    startTime: new Date(cur.startMs),
                    endTime: new Date(pt.bucketMs),
                    value: Math.round(cur.value * 10) / 10,
                    system,
                    metric,
                });
                cur = { startMs: pt.bucketMs, value: pt.value };
            }
        }
        if (cur) {
            ranges.push({
                startTime: new Date(cur.startMs),
                endTime: new Date(endMs),
                value: Math.round(cur.value * 10) / 10,
                system,
                metric,
            });
        }
        return ranges;
    }
    async calculateSetpointError(campus, building, system, startTime, endTime) {
        const errors = [];
        const tempMetric = common_3.UnitMetric.ZoneTemperature;
        const occMetric = common_3.UnitMetric.OccupancyCommand;
        const occHeatMetric = common_3.UnitMetric.OccupiedHeatingSetPoint;
        const occCoolMetric = common_3.UnitMetric.OccupiedCoolingSetPoint;
        const unoccHeatMetric = common_3.UnitMetric.UnoccupiedHeatingSetPoint;
        const unoccCoolMetric = common_3.UnitMetric.UnoccupiedCoolingSetPoint;
        const topicMap = this.configService.historian.topicMap;
        const tempPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, tempMetric, topicMap);
        const occupancyPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, occMetric, topicMap);
        const occHeatPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, occHeatMetric, topicMap);
        const occCoolPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, occCoolMetric, topicMap);
        const unoccHeatPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, unoccHeatMetric, topicMap);
        const unoccCoolPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, unoccCoolMetric, topicMap);
        const topics = {
            [tempMetric]: tempPath,
            [occMetric]: occupancyPath,
            [occHeatMetric]: occHeatPath,
            [occCoolMetric]: occCoolPath,
            [unoccHeatMetric]: unoccHeatPath,
            [unoccCoolMetric]: unoccCoolPath,
        };
        const bucketInterval = this.deriveSetpointErrorBucketInterval(startTime, endTime);
        try {
            const pathToId = await this.resolveTopicIds([
                tempPath,
                occupancyPath,
                occHeatPath,
                occCoolPath,
                unoccHeatPath,
                unoccCoolPath,
            ]);
            const tempId = pathToId.get(tempPath);
            const occupancyId = pathToId.get(occupancyPath);
            const setpointIds = [
                pathToId.get(occHeatPath),
                pathToId.get(occCoolPath),
                pathToId.get(unoccHeatPath),
                pathToId.get(unoccCoolPath),
            ].filter((id) => id !== undefined);
            if (tempId === undefined) {
                errors.push(`Topic not found: ${tempPath}`);
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
          topic_id,
          ts,
          CASE
            WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
              THEN value_string::double precision
            ELSE NULL
          END AS sp_value
        FROM data
        WHERE topic_id = ANY($3::int[])
          AND ts >= $1::timestamptz - interval '30 days'
          AND ts <= $2
          AND value_string IS NOT NULL
          AND value_string <> 'null'
        ORDER BY topic_id, ts
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
            const tempPromise = tempId !== undefined
                ? this.pool.query(tempQuery, [
                    startTime,
                    endTime,
                    bucketInterval.sql,
                    tempId,
                ])
                : Promise.resolve({ rows: [] });
            const setpointPromise = setpointIds.length > 0
                ? this.pool.query(setpointQuery, [
                    startTime,
                    endTime,
                    setpointIds,
                ])
                : Promise.resolve({
                    rows: [],
                });
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
            const occHeatId = pathToId.get(occHeatPath);
            const occCoolId = pathToId.get(occCoolPath);
            const unoccHeatId = pathToId.get(unoccHeatPath);
            const unoccCoolId = pathToId.get(unoccCoolPath);
            const occHeat = [];
            const occCool = [];
            const unoccHeat = [];
            const unoccCool = [];
            for (const row of setpointResult.rows) {
                const v = HistorianService_1.toNumber(row.sp_value);
                if (v == null)
                    continue;
                const t = row.ts instanceof Date ? row.ts.getTime() : new Date(row.ts).getTime();
                const sample = { t, v };
                if (row.topic_id === occHeatId)
                    occHeat.push(sample);
                else if (row.topic_id === occCoolId)
                    occCool.push(sample);
                else if (row.topic_id === unoccHeatId)
                    unoccHeat.push(sample);
                else if (row.topic_id === unoccCoolId)
                    unoccCool.push(sample);
            }
            const occupancies = occupancyResult.rows
                .map((r) => ({
                t: r.ts instanceof Date ? r.ts.getTime() : new Date(r.ts).getTime(),
                v: HistorianService_1.toNumber(r.occ_value),
            }))
                .filter((o) => o.v != null);
            const startMs = startTime.getTime();
            const endMs = endTime.getTime();
            const series = HistorianService_1.computeBucketErrorSeries({
                startMs,
                endMs,
                stepMs: bucketInterval.ms,
                tempByBucket,
                occupancies,
                occHeat,
                occCool,
                unoccHeat,
                unoccCool,
            });
            const data = series.map((pt) => ({
                timestamp: new Date(pt.bucketMs),
                value: pt.value,
                system,
                metric: tempMetric,
            }));
            if (data.every((d) => d.value == null)) {
                errors.push(`No setpoint error data found for ${system} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            return {
                system,
                metric: tempMetric,
                data,
                metadata: {
                    topics,
                    errors,
                    binning: HistorianService_1.buildBinningInfo({
                        mode: "binned",
                        sql: bucketInterval.sql,
                        ms: bucketInterval.ms,
                    }),
                    aggregation: common_3.MetricAggregation.Mean,
                },
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
            const createSubscriptionSql = `CREATE SUBSCRIPTION historian_sub
CONNECTION 'host={{HOSTNAME}} port=${replicationPort} dbname=historian user=replicator password=YOUR_REPLICATOR_PASSWORD sslmode=${sslMode}'
PUBLICATION historian_pub
WITH (
    copy_data = false,
    create_slot = true,
    enabled = true,
    slot_name = 'historian_sub_slot'
);
-- copy_data=false: streaming starts NOW; run the backfill procedure in the
-- next card to fill historical data. Resumable across cellular disconnects
-- because the procedure per-chunk COMMITs.`;
            const backfillProcedureSql = `-- Enable dblink so we can pull from the publisher inside a stored procedure.
CREATE EXTENSION IF NOT EXISTS dblink;

-- Dedicated schema for backfill bookkeeping. Kept off 'public' so it can never
-- leak into a FOR TABLES IN SCHEMA public publication or be replicated by a
-- cascaded topology. Safe to leave in place after backfill completes.
CREATE SCHEMA IF NOT EXISTS backfill;

-- Persistent config — populated on first run; a zero-override re-CALL resumes.
CREATE TABLE IF NOT EXISTS backfill.config (
    id             integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    publisher_conn text NOT NULL,       -- host/port/user/db/sslmode; NO password
    start_ts       timestamp NOT NULL,
    end_ts         timestamp NOT NULL,  -- captured on first run; fixed thereafter
    chunk_interval interval  NOT NULL DEFAULT '1 week',
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Per-chunk checkpoint table.
CREATE TABLE IF NOT EXISTS backfill.progress (
    chunk_start  timestamp PRIMARY KEY,
    chunk_end    timestamp NOT NULL,
    inserted     bigint,
    completed_at timestamptz NOT NULL DEFAULT now()
);

-- Pending-chunks view for operator visibility: SELECT count(*) FROM backfill.pending;
CREATE OR REPLACE VIEW backfill.pending AS
SELECT gs::timestamp AS chunk_start,
       LEAST(gs + cfg.chunk_interval, cfg.end_ts)::timestamp AS chunk_end
FROM (SELECT * FROM backfill.config WHERE id = 1) AS cfg,
     generate_series(cfg.start_ts, cfg.end_ts - '1 microsecond'::interval, cfg.chunk_interval) AS gs
WHERE NOT EXISTS (
    SELECT 1 FROM backfill.progress p WHERE p.chunk_start = gs::timestamp
);

-- Resumable backfill. First positional arg is the (transient) publisher password.
-- Any non-null overrides UPSERT into backfill.config; a zero-override call reads
-- config and resumes. Per-chunk COMMIT so cellular disconnects only lose the
-- in-flight chunk.
CREATE OR REPLACE PROCEDURE backfill.run_backfill(
    publisher_password text,
    publisher_conn     text      DEFAULT NULL,
    start_ts           timestamp DEFAULT NULL,
    end_ts             timestamp DEFAULT NULL,
    chunk_interval     interval  DEFAULT NULL
) LANGUAGE plpgsql AS $BODY$
#variable_conflict use_variable
DECLARE
    cfg backfill.config%ROWTYPE;
    effective_conn text;
    cs timestamp;
    ce timestamp;
BEGIN
    IF publisher_password IS NULL THEN
        RAISE EXCEPTION 'publisher_password is required (transient; not persisted)';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM backfill.config WHERE id = 1) THEN
        IF publisher_conn IS NULL OR start_ts IS NULL THEN
            RAISE EXCEPTION 'First-time run requires publisher_conn and start_ts';
        END IF;
        INSERT INTO backfill.config (id, publisher_conn, start_ts, end_ts, chunk_interval)
        VALUES (
            1,
            publisher_conn,
            start_ts,
            COALESCE(end_ts, NOW()::timestamp),
            COALESCE(chunk_interval, '1 week'::interval)
        );
    ELSE
        UPDATE backfill.config c SET
            publisher_conn = COALESCE(publisher_conn, c.publisher_conn),
            start_ts       = COALESCE(start_ts,       c.start_ts),
            end_ts         = COALESCE(end_ts,         c.end_ts),
            chunk_interval = COALESCE(chunk_interval, c.chunk_interval),
            updated_at     = now()
        WHERE c.id = 1;
    END IF;

    SELECT * INTO cfg FROM backfill.config WHERE id = 1;
    effective_conn := cfg.publisher_conn || ' password=' || publisher_password;

    RAISE NOTICE 'Backfill window: [%, %) chunk=%. Pending: %',
        cfg.start_ts, cfg.end_ts, cfg.chunk_interval,
        (SELECT count(*) FROM backfill.pending);

    cs := cfg.start_ts;
    WHILE cs < cfg.end_ts LOOP
        ce := LEAST(cs + cfg.chunk_interval, cfg.end_ts);
        IF NOT EXISTS (SELECT 1 FROM backfill.progress WHERE chunk_start = cs) THEN
            RAISE NOTICE '[chunk] % -> %', cs, ce;
            DROP TABLE IF EXISTS backfill.stage;
            CREATE UNLOGGED TABLE backfill.stage (topic_id integer, ts timestamp, value_string text);
            EXECUTE format(
                'INSERT INTO backfill.stage SELECT * FROM dblink(%L, %L) AS t(topic_id integer, ts timestamp, value_string text)',
                effective_conn,
                format('SELECT topic_id, ts, value_string FROM public.data WHERE ts >= %L AND ts < %L', cs, ce)
            );
            INSERT INTO public.data (topic_id, ts, value_string)
            SELECT topic_id, ts, value_string FROM backfill.stage
            ON CONFLICT (topic_id, ts) DO NOTHING;
            INSERT INTO backfill.progress (chunk_start, chunk_end, inserted)
            VALUES (cs, ce, (SELECT count(*) FROM backfill.stage));
            DROP TABLE backfill.stage;
            COMMIT;
        END IF;
        cs := ce;
    END LOOP;
END $BODY$;

-- Backfill topics (small; single one-shot merge).
INSERT INTO public.topics (topic_id, topic_name, metadata)
SELECT * FROM dblink(
    'host={{HOSTNAME}} port=${replicationPort} dbname=historian user=replicator password=YOUR_REPLICATOR_PASSWORD sslmode=${sslMode}',
    'SELECT topic_id, topic_name, metadata FROM public.topics'
) AS t(topic_id integer, topic_name text, metadata text)
ON CONFLICT (topic_id) DO UPDATE
  SET topic_name = EXCLUDED.topic_name, metadata = EXCLUDED.metadata;

-- FIRST RUN — configures backfill.config and processes chunks. Edit start_ts
-- to the earliest publisher timestamp you care about (see MIN(ts) on publisher).
CALL backfill.run_backfill(
    publisher_password := 'YOUR_REPLICATOR_PASSWORD',
    publisher_conn     := 'host={{HOSTNAME}} port=${replicationPort} dbname=historian user=replicator sslmode=${sslMode}',
    start_ts           := '2026-01-01 00:00:00'::timestamp
);

-- RESUME (subsequent calls) — reads persisted config; only the transient
-- password is required. Re-run at any time; completed chunks are skipped.
-- CALL backfill.run_backfill(publisher_password := 'YOUR_REPLICATOR_PASSWORD');

-- OPERATOR VISIBILITY
--   SELECT * FROM backfill.config;              -- current run parameters
--   SELECT count(*) FROM backfill.pending;      -- chunks remaining
--   SELECT * FROM backfill.progress ORDER BY chunk_start DESC LIMIT 10;`;
            const shPreamble = `# Set these once (replace placeholders with real values), then paste
# each step below. Cards 1-4 are one-liners; Card 5 (backfill) is the
# resumable script — download the .sh from Card 5 for that.
export PUB_HOST={{HOSTNAME}}
export PUB_PORT=${replicationPort}
export PUB_USER=replicator
export PUB_PASSWORD=YOUR_REPLICATOR_PASSWORD
export SUB_HOST=YOUR_SUBSCRIBER_HOSTNAME
export SUB_PORT=5432
export SUB_USER=YOUR_SUBSCRIBER_USER
export SUB_DB=historian
export SUB_PASSWORD=YOUR_SUBSCRIBER_PASSWORD`;
            const ps1Preamble = `# Set these once (replace placeholders with real values), then paste
# each step below. Cards 1-4 are one-liners; Card 5 (backfill) is the
# resumable script — download the .ps1 from Card 5 for that.
$env:PUB_HOST     = "{{HOSTNAME}}"
$env:PUB_PORT     = "${replicationPort}"
$env:PUB_USER     = "replicator"
$env:PUB_PASSWORD = "YOUR_REPLICATOR_PASSWORD"
$env:SUB_HOST     = "YOUR_SUBSCRIBER_HOSTNAME"
$env:SUB_PORT     = "5432"
$env:SUB_USER     = "YOUR_SUBSCRIBER_USER"
$env:SUB_DB       = "historian"
$env:SUB_PASSWORD = "YOUR_SUBSCRIBER_PASSWORD"`;
            const createTablesCmdSh = `PGPASSWORD="$PUB_PASSWORD" pg_dump \\
    -h "$PUB_HOST" -p "$PUB_PORT" -U "$PUB_USER" -d historian \\
    --schema-only --no-owner --no-privileges \\
    -t public.data -t public.topics -t public.topics_topic_id_seq \\
  | PGPASSWORD="$SUB_PASSWORD" psql \\
    -h "$SUB_HOST" -p "$SUB_PORT" -U "$SUB_USER" -d "$SUB_DB" -v ON_ERROR_STOP=1`;
            const createTablesCmdPs1 = `$env:PGPASSWORD = $env:PUB_PASSWORD
$ddl = & pg_dump -h $env:PUB_HOST -p $env:PUB_PORT -U $env:PUB_USER -d historian \`
    --schema-only --no-owner --no-privileges \`
    -t public.data -t public.topics -t public.topics_topic_id_seq
$env:PGPASSWORD = $env:SUB_PASSWORD
$ddl | & psql -h $env:SUB_HOST -p $env:SUB_PORT -U $env:SUB_USER -d $env:SUB_DB -v ON_ERROR_STOP=1
Remove-Item Env:PGPASSWORD`;
            const heredocConstraints = `ALTER TABLE public.topics ADD PRIMARY KEY (topic_id);
ALTER TABLE public.data   ADD PRIMARY KEY (topic_id, ts);`;
            const createConstraintsCmdSh = `PGPASSWORD="$SUB_PASSWORD" psql \\
    -h "$SUB_HOST" -p "$SUB_PORT" -U "$SUB_USER" -d "$SUB_DB" -v ON_ERROR_STOP=1 <<'SQL'
${heredocConstraints}
SQL`;
            const createConstraintsCmdPs1 = `$env:PGPASSWORD = $env:SUB_PASSWORD
@'
${heredocConstraints}
'@ | & psql -h $env:SUB_HOST -p $env:SUB_PORT -U $env:SUB_USER -d $env:SUB_DB -v ON_ERROR_STOP=1
Remove-Item Env:PGPASSWORD`;
            const createIndexesCmdSh = `PGPASSWORD="$SUB_PASSWORD" psql \\
    -h "$SUB_HOST" -p "$SUB_PORT" -U "$SUB_USER" -d "$SUB_DB" -v ON_ERROR_STOP=1 <<'SQL'
${createIndexesSql}
SQL`;
            const createIndexesCmdPs1 = `$env:PGPASSWORD = $env:SUB_PASSWORD
@'
${createIndexesSql}
'@ | & psql -h $env:SUB_HOST -p $env:SUB_PORT -U $env:SUB_USER -d $env:SUB_DB -v ON_ERROR_STOP=1
Remove-Item Env:PGPASSWORD`;
            const createSubscriptionCmdSh = `PGPASSWORD="$SUB_PASSWORD" psql \\
    -h "$SUB_HOST" -p "$SUB_PORT" -U "$SUB_USER" -d "$SUB_DB" -v ON_ERROR_STOP=1 <<SQL
CREATE SUBSCRIPTION historian_sub
CONNECTION 'host=$PUB_HOST port=$PUB_PORT dbname=historian user=$PUB_USER password=$PUB_PASSWORD sslmode=${sslMode}'
PUBLICATION historian_pub
WITH (copy_data=false, create_slot=true, enabled=true, slot_name='historian_sub_slot');
SQL`;
            const createSubscriptionCmdPs1 = `$env:PGPASSWORD = $env:SUB_PASSWORD
@"
CREATE SUBSCRIPTION historian_sub
CONNECTION 'host=$($env:PUB_HOST) port=$($env:PUB_PORT) dbname=historian user=$($env:PUB_USER) password=$($env:PUB_PASSWORD) sslmode=${sslMode}'
PUBLICATION historian_pub
WITH (copy_data=false, create_slot=true, enabled=true, slot_name='historian_sub_slot');
"@ | & psql -h $env:SUB_HOST -p $env:SUB_PORT -U $env:SUB_USER -d $env:SUB_DB -v ON_ERROR_STOP=1
Remove-Item Env:PGPASSWORD`;
            const linuxScript = this.subscribeHistorianShTemplate
                .replace(/\{\{HOSTNAME\}\}/g, "{{HOSTNAME}}")
                .replace(/\{\{PORT\}\}/g, String(replicationPort))
                .replace(/\{\{SSLMODE\}\}/g, sslMode);
            const windowsScript = this.subscribeHistorianPs1Template
                .replace(/\{\{HOSTNAME\}\}/g, "{{HOSTNAME}}")
                .replace(/\{\{PORT\}\}/g, String(replicationPort))
                .replace(/\{\{SSLMODE\}\}/g, sslMode);
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
                    createSubscriptionSql,
                    backfillProcedureSql,
                    createTablesCmdSh,
                    createConstraintsCmdSh,
                    createIndexesCmdSh,
                    createSubscriptionCmdSh,
                    linuxScript,
                    createTablesCmdPs1,
                    createConstraintsCmdPs1,
                    createIndexesCmdPs1,
                    createSubscriptionCmdPs1,
                    windowsScript,
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
HistorianService.NICE_BUCKET_SECONDS = [
    10, 30,
    60, 120, 300, 600, 900, 1800,
    3600, 7200, 10800, 21600, 43200,
    86400, 604800,
];
exports.HistorianService = HistorianService = HistorianService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService])
], HistorianService);
//# sourceMappingURL=historian.service.js.map