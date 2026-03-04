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
exports.HistorianService = exports.CalculationType = exports.AggregationType = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const common_2 = require("@nestjs/common");
const app_config_1 = require("../app.config");
const prisma_service_1 = require("../prisma/prisma.service");
const historian_types_1 = require("./historian.types");
Object.defineProperty(exports, "AggregationType", { enumerable: true, get: function () { return historian_types_1.AggregationType; } });
Object.defineProperty(exports, "CalculationType", { enumerable: true, get: function () { return historian_types_1.CalculationType; } });
let HistorianService = HistorianService_1 = class HistorianService {
    constructor(configService, prismaService) {
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
            this.logger.log("Successfully connected to historian database");
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
    async filterHistorianAccess(userId, isAdmin, requestedCampus, requestedBuilding, requestedUnit) {
        if (isAdmin) {
            return null;
        }
        if (!userId) {
            return { allowedUnits: [], isEmpty: true };
        }
        const whereClause = {
            users: { some: { id: userId } },
        };
        if (requestedCampus) {
            whereClause.campus = requestedCampus;
        }
        if (requestedBuilding) {
            whereClause.building = requestedBuilding;
        }
        const userUnits = await this.prismaService.prisma.unit.findMany({
            where: whereClause,
            select: { campus: true, building: true, name: true },
        });
        if (userUnits.length === 0) {
            return { allowedUnits: [], isEmpty: true };
        }
        if (requestedUnit) {
            const requestedUnits = Array.isArray(requestedUnit) ? requestedUnit : [requestedUnit];
            const allowedUnits = userUnits
                .filter((u) => requestedUnits.includes(u.name))
                .map((u) => ({ campus: u.campus, building: u.building, unit: u.name }));
            return {
                allowedUnits,
                isEmpty: allowedUnits.length === 0,
            };
        }
        return {
            allowedUnits: userUnits.map((u) => ({
                campus: u.campus,
                building: u.building,
                unit: u.name,
            })),
            isEmpty: false,
        };
    }
    buildTopicPattern(topicPattern, campus, building, unit) {
        let pattern = topicPattern;
        if (campus) {
            pattern = pattern.replace("%CAMPUS%", campus);
        }
        else {
            pattern = pattern.replace("%CAMPUS%", "%");
        }
        if (building) {
            pattern = pattern.replace("%BUILDING%", building);
        }
        else {
            pattern = pattern.replace("%BUILDING%", "%");
        }
        if (unit) {
            pattern = pattern.replace("%UNIT%", unit);
        }
        else {
            pattern = pattern.replace("%UNIT%", "%");
        }
        return pattern;
    }
    parseValue(valueString) {
        if (valueString === null || valueString === "null") {
            return null;
        }
        const parsed = parseFloat(valueString);
        return isNaN(parsed) ? null : parsed;
    }
    async getCurrentValues(topicPatterns, campus, building, unit) {
        if (topicPatterns.length === 0) {
            return [];
        }
        const patterns = topicPatterns.map((pattern) => this.buildTopicPattern(pattern, campus, building, unit));
        const query = `
      WITH latest_data AS (
        SELECT DISTINCT ON (topic_name)
          ts,
          value_string,
          topic_name
        FROM data
        NATURAL JOIN topics
        WHERE ${patterns.map((_, i) => `topic_name LIKE $${i + 1}`).join(" OR ")}
        ORDER BY topic_name, ts DESC
      )
      SELECT
        ts AS timestamp,
        value_string,
        topic_name
      FROM latest_data
      ORDER BY topic_name
    `;
        try {
            const result = await this.pool.query(query, patterns);
            return result.rows.map((row) => ({
                topicName: row.topic_name,
                value: this.parseValue(row.value_string),
                timestamp: new Date(row.timestamp),
            }));
        }
        catch (error) {
            this.logger.error("Error fetching current values", error);
            throw error;
        }
    }
    async getTimeSeries(topicPatterns, startTime, endTime, campus, building, unit) {
        if (topicPatterns.length === 0) {
            return [];
        }
        const patterns = topicPatterns.map((pattern) => this.buildTopicPattern(pattern, campus, building, unit));
        const query = `
      SELECT
        ts AS timestamp,
        value_string,
        topic_name
      FROM data
      NATURAL JOIN topics
      WHERE (${patterns.map((_, i) => `topic_name LIKE $${i + 1}`).join(" OR ")})
        AND ts >= $${patterns.length + 1}
        AND ts <= $${patterns.length + 2}
      ORDER BY topic_name, ts
    `;
        try {
            const result = await this.pool.query(query, [...patterns, startTime, endTime]);
            const grouped = result.rows.reduce((acc, row) => {
                const topicName = row.topic_name;
                if (!acc[topicName]) {
                    acc[topicName] = [];
                }
                acc[topicName].push({
                    timestamp: new Date(row.timestamp),
                    value: this.parseValue(row.value_string),
                    topicName: row.topic_name,
                });
                return acc;
            }, {});
            return Object.entries(grouped).map(([topicName, data]) => ({
                topicName,
                data,
            }));
        }
        catch (error) {
            this.logger.error("Error fetching time series data", error);
            throw error;
        }
    }
    async getAggregated(topicPattern, startTime, endTime, interval, aggregation, campus, building, unit) {
        const pattern = this.buildTopicPattern(topicPattern, campus, building, unit);
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
        const valueExpr = aggregation === historian_types_1.AggregationType.COUNT
            ? "*"
            : "CAST(NULLIF(value_string, 'null') AS double precision)";
        const query = `
      SELECT
        date_trunc('${intervalMap[intervalUnit]}', ts) AS timestamp,
        ${aggFunction}(${valueExpr}) AS value
      FROM data
      NATURAL JOIN topics
      WHERE topic_name LIKE $1
        AND ts >= $2
        AND ts <= $3
      GROUP BY 1
      ORDER BY 1
    `;
        try {
            const result = await this.pool.query(query, [pattern, startTime, endTime]);
            return result.rows.map((row) => ({
                timestamp: new Date(row.timestamp),
                value: row.value !== null ? parseFloat(row.value) : null,
                topicPattern: pattern,
            }));
        }
        catch (error) {
            this.logger.error("Error fetching aggregated data", error);
            throw error;
        }
    }
    async getMultiUnit(topicPattern, units, startTime, endTime, interval, campus, building) {
        if (units.length === 0) {
            return {};
        }
        const caseStatements = units.map((unit, i) => {
            return `MAX(CASE WHEN topic_name LIKE $${i + 1} THEN CAST(NULLIF(value_string, 'null') AS double precision) END) AS "${unit}"`;
        });
        const patterns = units.map((unit) => this.buildTopicPattern(topicPattern, campus, building, unit));
        let timeGroup = "ts";
        const params = [...patterns, startTime, endTime];
        if (interval) {
            const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
            if (!intervalMatch) {
                throw new Error("Invalid interval format. Use format like '1m', '5m', '1h', etc.");
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
        ${caseStatements.join(",\n        ")}
      FROM data
      NATURAL JOIN topics
      WHERE (${patterns.map((_, i) => `topic_name LIKE $${i + 1}`).join(" OR ")})
        AND ts >= $${patterns.length + 1}
        AND ts <= $${patterns.length + 2}
      GROUP BY 1
      ORDER BY 1
    `;
        try {
            const result = await this.pool.query(query, params);
            const grouped = {};
            units.forEach((unit) => {
                grouped[unit] = [];
            });
            result.rows.forEach((row) => {
                const timestamp = new Date(row.timestamp);
                units.forEach((unit) => {
                    grouped[unit].push({
                        timestamp,
                        value: row[unit] !== null ? parseFloat(row[unit]) : null,
                        topicName: unit,
                    });
                });
            });
            return grouped;
        }
        catch (error) {
            this.logger.error("Error fetching multi-unit data", error);
            throw error;
        }
    }
    async getCalculated(calculation, topicPatterns, startTime, endTime, campus, building, unit, options) {
        switch (calculation) {
            case historian_types_1.CalculationType.SETPOINT_ERROR:
                return this.calculateSetpointError(topicPatterns, startTime, endTime, campus, building, unit);
            case historian_types_1.CalculationType.ROLLING_AVERAGE:
                return this.calculateRollingAverage(topicPatterns[0], startTime, endTime, options?.window || "30 minutes", campus, building, unit);
            default:
                throw new Error(`Unsupported calculation type: ${calculation}`);
        }
    }
    async calculateSetpointError(topicPatterns, startTime, endTime, campus, building, unit) {
        if (topicPatterns.length !== 2) {
            throw new Error("Setpoint error calculation requires exactly 2 topic patterns");
        }
        const [tempPattern, setpointPattern] = topicPatterns.map((pattern) => this.buildTopicPattern(pattern, campus, building, unit));
        const query = `
      WITH zone_temps AS (
        SELECT
          ts,
          CAST(NULLIF(value_string, 'null') AS double precision) AS temp_value
        FROM data
        NATURAL JOIN topics
        WHERE topic_name LIKE $1
          AND ts >= $3
          AND ts <= $4
      ),
      zone_setpoints AS (
        SELECT
          ts,
          CAST(NULLIF(value_string, 'null') AS double precision) AS sp_value
        FROM data
        NATURAL JOIN topics
        WHERE topic_name LIKE $2
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
            const result = await this.pool.query(query, [tempPattern, setpointPattern, startTime, endTime]);
            return result.rows.map((row) => ({
                timestamp: new Date(row.timestamp),
                value: row.value !== null ? parseFloat(row.value) : null,
                topicName: "setpoint_error",
            }));
        }
        catch (error) {
            this.logger.error("Error calculating setpoint error", error);
            throw error;
        }
    }
    async calculateRollingAverage(topicPattern, startTime, endTime, window, campus, building, unit) {
        const pattern = this.buildTopicPattern(topicPattern, campus, building, unit);
        const query = `
      SELECT
        ts AS timestamp,
        CAST(NULLIF(value_string, 'null') AS double precision) AS instantaneous,
        AVG(CAST(NULLIF(value_string, 'null') AS double precision)) OVER (
          ORDER BY ts
          RANGE BETWEEN INTERVAL '${window}' PRECEDING AND CURRENT ROW
        ) AS value
      FROM data
      NATURAL JOIN topics
      WHERE topic_name = $1
        AND ts >= $2
        AND ts <= $3
      ORDER BY ts
    `;
        try {
            const result = await this.pool.query(query, [pattern, startTime, endTime]);
            return result.rows.map((row) => ({
                timestamp: new Date(row.timestamp),
                value: row.value !== null ? parseFloat(row.value) : null,
                topicName: `${pattern}_rolling_avg`,
            }));
        }
        catch (error) {
            this.logger.error("Error calculating rolling average", error);
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