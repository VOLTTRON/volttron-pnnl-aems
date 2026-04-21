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
    async getUnitCurrentValue(campus, building, system, metric) {
        const errors = [];
        const topics = {};
        const topicPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, metric, this.configService.historian.topicMap);
        topics[metric] = topicPath;
        const query = `
      SELECT
        ts,
        value_string,
        topic_name
      FROM data
      NATURAL JOIN topics
      WHERE topic_name ILIKE $1
      ORDER BY ts DESC
      LIMIT 1
    `;
        try {
            const result = await this.pool.query(query, [
                topicPath,
            ]);
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
        const query = `
      SELECT
        ts,
        value_string,
        topic_name
      FROM data
      NATURAL JOIN topics
      WHERE topic_name ILIKE $1
      ORDER BY ts DESC
      LIMIT 1
    `;
        try {
            const result = await this.pool.query(query, [
                topicPath,
            ]);
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
        const query = `
      SELECT
        ts,
        value_string
      FROM data
      NATURAL JOIN topics
      WHERE topic_name ILIKE $1
        AND ts >= $2
        AND ts <= $3
      ORDER BY ts
    `;
        try {
            const result = await this.pool.query(query, [
                topicPath,
                startTime,
                endTime,
            ]);
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
        const query = `
      SELECT
        ts,
        value_string
      FROM data
      NATURAL JOIN topics
      WHERE topic_name ILIKE $1
        AND ts >= $2
        AND ts <= $3
      ORDER BY ts
    `;
        try {
            const result = await this.pool.query(query, [
                topicPath,
                startTime,
                endTime,
            ]);
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
        const query = `
      SELECT
        date_trunc('${intervalMap[intervalUnit]}', ts) AS timestamp,
        ${aggFunction}(${valueExpr}) AS value
      FROM data
      NATURAL JOIN topics
      WHERE topic_name ILIKE $1
        AND ts >= $2
        AND ts <= $3
      GROUP BY 1
      ORDER BY 1
    `;
        try {
            const result = await this.pool.query(query, [
                topicPath,
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
        const query = `
      SELECT
        date_trunc('${intervalMap[intervalUnit]}', ts) AS timestamp,
        ${aggFunction}(${valueExpr}) AS value
      FROM data
      NATURAL JOIN topics
      WHERE topic_name ILIKE $1
        AND ts >= $2
        AND ts <= $3
      GROUP BY 1
      ORDER BY 1
    `;
        try {
            const result = await this.pool.query(query, [
                topicPath,
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
        const query = `
      SELECT
        ts,
        value_string,
        topic_name
      FROM data
      NATURAL JOIN topics
      WHERE topic_name ILIKE $1
      ORDER BY ts DESC
      LIMIT 1
    `;
        try {
            const result = await this.pool.query(query, [
                topicPath,
            ]);
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
        const query = `
      SELECT
        ts,
        value_string
      FROM data
      NATURAL JOIN topics
      WHERE topic_name ILIKE $1
        AND ts >= $2
        AND ts <= $3
      ORDER BY ts
    `;
        try {
            const result = await this.pool.query(query, [
                topicPath,
                startTime,
                endTime,
            ]);
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
        const query = `
      SELECT
        date_trunc('${intervalMap[intervalUnit]}', ts) AS timestamp,
        ${aggFunction}(${valueExpr}) AS value
      FROM data
      NATURAL JOIN topics
      WHERE topic_name ILIKE $1
        AND ts >= $2
        AND ts <= $3
      GROUP BY 1
      ORDER BY 1
    `;
        try {
            const result = await this.pool.query(query, [
                topicPath,
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
        if (systems.length > 0) {
            const caseStatements = systems.map((sys) => {
                return `MAX(CASE WHEN UPPER(split_part(topic_name, '/', 3)) = UPPER('${sys}') THEN CAST(NULLIF(value_string, 'null') AS double precision) END) AS "${sys}"`;
            });
            let timeGroup = "ts";
            const params = [startTime, endTime];
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
          ${caseStatements.join(",\n          ")}
        FROM data
        NATURAL JOIN topics
        WHERE topic_name LIKE '${campus}/${building}/%/${metric}'
          AND ts >= $1
          AND ts <= $2
        GROUP BY 1
        ORDER BY 1
      `;
            try {
                const result = await this.pool.query(query, params);
                systems.forEach((sys) => {
                    queryResult[sys] = [];
                });
                result.rows.forEach((row) => {
                    const timestamp = new Date(row.timestamp);
                    systems.forEach((sys) => {
                        queryResult[sys].push({
                            timestamp,
                            value: typeof row[sys] === "string" ? parseFloat(row[sys]) : (row[sys] ?? null),
                            system: sys,
                            metric,
                        });
                    });
                });
            }
            catch (error) {
                this.logger.error("Error fetching multi-system data", error);
                throw error;
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
            const query = `
        WITH system_data AS (
          SELECT 
            UPPER(split_part(topic_name, '/', 3)) as system,
            ts,
            CAST(NULLIF(value_string, 'null') AS double precision) as value
          FROM data
          NATURAL JOIN topics
          WHERE topic_name LIKE '${campus}/${building}/%/${metric}'
            AND ts >= $1
            AND ts <= $2
            AND CAST(NULLIF(value_string, 'null') AS double precision) IS NOT NULL
          ORDER BY system, ts
        ),
        value_changes AS (
          SELECT 
            system,
            ts,
            value,
            LAG(value) OVER (PARTITION BY system ORDER BY ts) as prev_value,
            LEAD(ts) OVER (PARTITION BY system ORDER BY ts) as next_ts
          FROM system_data
        ),
        range_starts AS (
          SELECT 
            system,
            ts as start_time,
            next_ts as end_time,
            value
          FROM value_changes
          WHERE prev_value IS NULL OR prev_value != value
        )
        SELECT 
          system,
          start_time,
          COALESCE(end_time, $2) as end_time,
          value
        FROM range_starts
        ORDER BY system, start_time
      `;
            try {
                const result = await this.pool.query(query, [startTime, endTime]);
                result.rows.forEach((row) => {
                    const systemKey = row.system.toUpperCase();
                    if (grouped[systemKey]) {
                        grouped[systemKey].push({
                            startTime: new Date(row.start_time),
                            endTime: new Date(row.end_time),
                            value: row.value,
                            system: row.system,
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
            const query = `
        WITH zone_temps AS (
          SELECT
            UPPER(split_part(topic_name, '/', 3)) as system,
            ts,
            CAST(NULLIF(value_string, 'null') AS double precision) AS temp_value
          FROM data
          NATURAL JOIN topics
          WHERE topic_name LIKE '${campus}/${building}/%/ZoneTemperature'
            AND ts >= $1
            AND ts <= $2
        ),
        zone_setpoints AS (
          SELECT
            UPPER(split_part(topic_name, '/', 3)) as system,
            ts,
            CAST(NULLIF(value_string, 'null') AS double precision) AS sp_value
          FROM data
          NATURAL JOIN topics
          WHERE topic_name LIKE '${campus}/${building}/%/EffectiveZoneTemperatureSetPoint'
            AND ts >= $1
            AND ts <= $2
        ),
        error_data AS (
          SELECT 
            t.system,
            t.ts,
            ROUND((t.temp_value - s.sp_value)::numeric, 1) AS error_value
          FROM zone_temps t
          JOIN zone_setpoints s ON t.system = s.system AND t.ts = s.ts
          WHERE t.temp_value IS NOT NULL AND s.sp_value IS NOT NULL
          ORDER BY t.system, t.ts
        ),
        value_changes AS (
          SELECT 
            system,
            ts,
            error_value,
            LAG(error_value) OVER (PARTITION BY system ORDER BY ts) as prev_value,
            LEAD(ts) OVER (PARTITION BY system ORDER BY ts) as next_ts
          FROM error_data
        ),
        range_starts AS (
          SELECT 
            system,
            ts as start_time,
            next_ts as end_time,
            error_value
          FROM value_changes
          WHERE prev_value IS NULL OR ABS(prev_value - error_value) > 0.5
        )
        SELECT 
          system,
          start_time,
          COALESCE(end_time, $2) as end_time,
          error_value as value
        FROM range_starts
        ORDER BY system, start_time
      `;
            try {
                const result = await this.pool.query(query, [startTime, endTime]);
                result.rows.forEach((row) => {
                    const systemKey = row.system.toUpperCase();
                    if (grouped[systemKey]) {
                        grouped[systemKey].push({
                            startTime: new Date(row.start_time),
                            endTime: new Date(row.end_time),
                            value: row.value,
                            system: row.system,
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
    async calculateSetpointError(campus, building, system, startTime, endTime) {
        const errors = [];
        const tempMetric = common_3.UnitMetric.ZoneTemperature;
        const spMetric = common_3.UnitMetric.EffectiveZoneTemperatureSetPoint;
        const tempPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, tempMetric, this.configService.historian.topicMap);
        const setpointPath = (0, metrics_1.buildUnitTopicPath)(campus, building, system, spMetric, this.configService.historian.topicMap);
        const topics = {
            [tempMetric]: tempPath,
            [spMetric]: setpointPath,
        };
        const query = `
      WITH zone_temps AS (
        SELECT
          ts,
          CAST(NULLIF(value_string, 'null') AS double precision) AS temp_value
        FROM data
        NATURAL JOIN topics
        WHERE topic_name ILIKE $1
          AND ts >= $3
          AND ts <= $4
      ),
      zone_setpoints AS (
        SELECT
          ts,
          CAST(NULLIF(value_string, 'null') AS double precision) AS sp_value
        FROM data
        NATURAL JOIN topics
        WHERE topic_name ILIKE $2
          AND ts >= $3
          AND ts <= $4
      )
      SELECT
        t.ts AS timestamp,
        t.temp_value - s.sp_value AS value
      FROM zone_temps t
      JOIN zone_setpoints s ON t.ts = s.ts
      WHERE t.temp_value IS NOT NULL AND s.sp_value IS NOT NULL
      ORDER BY t.ts
    `;
        try {
            const result = await this.pool.query(query, [
                tempPath,
                setpointPath,
                startTime,
                endTime,
            ]);
            if (result.rows.length === 0) {
                errors.push(`No setpoint error data found for ${system} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
            }
            const data = result.rows.map((row) => ({
                timestamp: new Date(row.timestamp),
                value: typeof row.value === "string" ? parseFloat(row.value) : null,
                system,
                metric: tempMetric,
            }));
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