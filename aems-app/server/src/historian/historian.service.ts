import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";
import { Inject } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import * as tls from "tls";
import * as https from "https";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
import {
  HistorianDataPoint,
  HistorianTimeSeries,
  HistorianAggregate,
  HistorianAggregateResult,
  HistorianMetricCurrent,
  HistorianQueryMetadata,
  HistorianBinningInfo,
  HistorianMultiSystemData,
  AggregationType,
  CalculationType,
  HistorianReplicationInfo,
  PublisherInfo,
  SubscriberSetupSql,
  MonitoringSql,
  ReplicationSlot,
  SystemPublishingStatus,
  HistorianDataRange,
  HistorianMultiSystemRanges,
  UnitMetric,
  WeatherMetric,
  MeterMetric,
  MetricAggregation,
} from "@local/common";
import {
  buildUnitTopicPath,
  buildWeatherTopicPath,
  buildMeterTopicPath,
  resolveUnitMetricEntry,
  resolveWeatherMetricEntry,
  resolveMeterMetricEntry,
  aggregationSql,
  applyTransform,
  ResolvedMetricEntry,
} from "./metrics";

// Re-export types for convenience
export {
  HistorianDataPoint,
  HistorianTimeSeries,
  HistorianAggregate,
  HistorianAggregateResult,
  HistorianMetricCurrent,
  HistorianQueryMetadata,
  HistorianMultiSystemData,
  AggregationType,
  CalculationType,
  HistorianReplicationInfo,
  PublisherInfo,
  SubscriberSetupSql,
  MonitoringSql,
  ReplicationSlot,
  SystemPublishingStatus,
  UnitMetric,
  WeatherMetric,
  MeterMetric,
};

export interface SystemAccess {
  campus: string;
  building: string;
  system: string;
}

export interface HistorianAccessControl {
  allowedSystems: SystemAccess[];
}

interface HistorianDataRow {
  ts: string;
  topic_id: number;
  value_string: string;
}

@Injectable()
export class HistorianService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(HistorianService.name);
  private pool: Pool;

  constructor(
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private readonly prismaService: PrismaService,
  ) {
    // Initialize PostgreSQL connection pool for historian database
    const { historian } = configService;

    if (historian.url) {
      // Use full connection string if provided
      this.pool = new Pool({
        connectionString: historian.url,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    } else {
      // Use individual connection parameters
      this.pool = new Pool({
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
    } catch (error) {
      this.logger.error("Failed to connect to historian database", error);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log("Historian database connection pool closed");
  }

  /**
   * Filter historian query parameters based on user's system assignments
   */
  async filterHistorianAccess(
    user: Express.User,
    campus?: string,
    building?: string,
    system?: string | string[],
  ): Promise<HistorianAccessControl> {
    const whereClause: {
      users?: { some: { id: string } };
      campus?: { equals: string; mode: "insensitive" };
      building?: { equals: string; mode: "insensitive" };
    } = user.authRoles.admin
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
    // Case-insensitive comparison for system names
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

  private parseValue(valueString: string | null): number | null {
    if (valueString === null || valueString === "null") {
      return null;
    }
    const parsed = parseFloat(valueString);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Lazy cache of topic_name (lower-cased) → topic_id. `topics` rarely
   * changes, so once populated, the `data` queries that follow can seek
   * directly into the composite PK `(topic_id, ts)` instead of paying for
   * a JOIN + ILIKE each call.
   */
  private topicIdCache = new Map<string, number>();

  /**
   * Resolve a single topic path to its topic_id. Case-insensitive, cached.
   * Relies on the functional index `topics(lower(topic_name))`.
   */
  private async resolveTopicId(topicPath: string): Promise<number | null> {
    const key = topicPath.toLowerCase();
    const cached = this.topicIdCache.get(key);
    if (cached !== undefined) return cached;
    const { rows } = await this.pool.query<{ topic_id: number }>(
      `SELECT topic_id FROM topics WHERE lower(topic_name) = $1 LIMIT 1`,
      [key],
    );
    if (rows.length === 0) return null;
    this.topicIdCache.set(key, rows[0].topic_id);
    return rows[0].topic_id;
  }

  /**
   * Batch-resolve many topic paths in one query. Returns a map from the
   * caller-supplied path back to topic_id (missing entries mean the topic
   * isn't in the historian).
   */
  private async resolveTopicIds(topicPaths: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    const toFetch: string[] = [];
    for (const p of topicPaths) {
      const cached = this.topicIdCache.get(p.toLowerCase());
      if (cached !== undefined) result.set(p, cached);
      else toFetch.push(p);
    }
    if (toFetch.length > 0) {
      const lowered = toFetch.map((p) => p.toLowerCase());
      const { rows } = await this.pool.query<{ topic_id: number; topic_name: string }>(
        `SELECT topic_id, topic_name FROM topics WHERE lower(topic_name) = ANY($1)`,
        [lowered],
      );
      for (const row of rows) {
        this.topicIdCache.set(row.topic_name.toLowerCase(), row.topic_id);
      }
      for (const p of toFetch) {
        const id = this.topicIdCache.get(p.toLowerCase());
        if (id !== undefined) result.set(p, id);
      }
    }
    return result;
  }

  /**
   * Get current value for a unit metric
   */
  async getUnitCurrentValue(
    campus: string,
    building: string,
    system: string,
    metric: UnitMetric,
  ): Promise<HistorianMetricCurrent | null> {
    const errors: string[] = [];
    const topics: Record<string, string> = {};

    const entry = resolveUnitMetricEntry(metric, this.configService.historian.topicMap);
    const topicPath = buildUnitTopicPath(campus, building, system, metric, this.configService.historian.topicMap);
    topics[metric] = topicPath;

    try {
      const topicId = await this.resolveTopicId(topicPath);
      if (topicId === null) {
        errors.push(`No data found for topic: ${topicPath}`);
        return null;
      }

      const result = await this.pool.query<Pick<HistorianDataRow, "ts" | "value_string">>(
        `SELECT ts, value_string FROM data WHERE topic_id = $1 ORDER BY ts DESC LIMIT 1`,
        [topicId],
      );

      if (result.rows.length === 0) {
        errors.push(`No data found for topic: ${topicPath}`);
        return null;
      }

      const row = result.rows[0];
      return {
        system,
        metric,
        value: applyTransform(this.parseValue(row.value_string), entry.transform),
        timestamp: new Date(row.ts),
        metadata: { topics, errors, ...HistorianService.displayMetadata(entry) },
      };
    } catch (error) {
      this.logger.error("Error fetching unit current value", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get current value for a weather metric
   */
  async getWeatherCurrentValue(
    campus: string,
    building: string,
    metric: WeatherMetric,
  ): Promise<HistorianMetricCurrent | null> {
    const errors: string[] = [];
    const topics: Record<string, string> = {};

    const entry = resolveWeatherMetricEntry(metric, this.configService.historian.topicMap);
    const topicPath = buildWeatherTopicPath(campus, building, metric, this.configService.historian.topicMap);
    topics[metric] = topicPath;

    try {
      const topicId = await this.resolveTopicId(topicPath);
      if (topicId === null) {
        errors.push(`No data found for topic: ${topicPath}`);
        return null;
      }

      const result = await this.pool.query<Pick<HistorianDataRow, "ts" | "value_string">>(
        `SELECT ts, value_string FROM data WHERE topic_id = $1 ORDER BY ts DESC LIMIT 1`,
        [topicId],
      );

      if (result.rows.length === 0) {
        errors.push(`No data found for topic: ${topicPath}`);
        return null;
      }

      const row = result.rows[0];
      return {
        system: "weather",
        metric,
        value: applyTransform(this.parseValue(row.value_string), entry.transform),
        timestamp: new Date(row.ts),
        metadata: { topics, errors, ...HistorianService.displayMetadata(entry) },
      };
    } catch (error) {
      this.logger.error("Error fetching weather current value", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get time series data for a unit metric
   */
  async getUnitTimeSeries(
    campus: string,
    building: string,
    system: string,
    metric: UnitMetric,
    startTime: Date,
    endTime: Date,
  ): Promise<HistorianTimeSeries> {
    const errors: string[] = [];
    const topics: Record<string, string> = {};

    const entry = resolveUnitMetricEntry(metric, this.configService.historian.topicMap);
    const topicPath = buildUnitTopicPath(campus, building, system, metric, this.configService.historian.topicMap);
    topics[metric] = topicPath;

    try {
      const topicId = await this.resolveTopicId(topicPath);
      if (topicId === null) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
        return {
          system,
          metric,
          data: [],
          metadata: { topics, errors, ...HistorianService.displayMetadata(entry) },
        };
      }

      // Bin only when the range exceeds the configured threshold; otherwise
      // emit raw historian samples. The aggregation is whatever the topic map
      // declares for this metric (configurable per-metric).
      const bucketing = this.resolveBucketing(startTime, endTime);
      const { aggregation } = entry;
      const numericValueExpr = `CASE
        WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
          THEN value_string::double precision
        ELSE NULL
      END`;

      const result =
        bucketing.mode === "binned"
          ? await this.pool.query<{ timestamp: Date | string; value: number | string | null }>(
              `
          SELECT
            date_bin($4::interval, ts, $2::timestamptz) AS timestamp,
            ${aggregationSql(aggregation, numericValueExpr)} AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          GROUP BY 1
          ORDER BY 1
        `,
              [topicId, startTime, endTime, bucketing.sql],
            )
          : await this.pool.query<{ timestamp: Date | string; value: number | string | null }>(
              `
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
        `,
              [topicId, startTime, endTime],
            );

      if (result.rows.length === 0) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
      }

      const data: HistorianDataPoint[] = result.rows.map((row) => ({
        timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
        value: applyTransform(HistorianService.toNumber(row.value), entry.transform),
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
          binning: HistorianService.buildBinningInfo(bucketing),
          aggregation: bucketing.mode === "binned" ? aggregation : undefined,
          ...HistorianService.displayMetadata(entry),
        },
      };
    } catch (error) {
      this.logger.error("Error fetching unit time series", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get time series data for a weather metric
   */
  async getWeatherTimeSeries(
    campus: string,
    building: string,
    metric: WeatherMetric,
    startTime: Date,
    endTime: Date,
  ): Promise<HistorianTimeSeries> {
    const errors: string[] = [];
    const topics: Record<string, string> = {};

    const entry = resolveWeatherMetricEntry(metric, this.configService.historian.topicMap);
    const topicPath = buildWeatherTopicPath(campus, building, metric, this.configService.historian.topicMap);
    topics[metric] = topicPath;

    try {
      const topicId = await this.resolveTopicId(topicPath);
      if (topicId === null) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
        return {
          system: "weather",
          metric,
          data: [],
          metadata: { topics, errors, ...HistorianService.displayMetadata(entry) },
        };
      }

      const bucketing = this.resolveBucketing(startTime, endTime);
      const { aggregation } = entry;
      const numericValueExpr = `CASE
        WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
          THEN value_string::double precision
        ELSE NULL
      END`;

      const result =
        bucketing.mode === "binned"
          ? await this.pool.query<{ timestamp: Date | string; value: number | string | null }>(
              `
          SELECT
            date_bin($4::interval, ts, $2::timestamptz) AS timestamp,
            ${aggregationSql(aggregation, numericValueExpr)} AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          GROUP BY 1
          ORDER BY 1
        `,
              [topicId, startTime, endTime, bucketing.sql],
            )
          : await this.pool.query<{ timestamp: Date | string; value: number | string | null }>(
              `
          SELECT
            ts AS timestamp,
            ${numericValueExpr} AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          ORDER BY ts
        `,
              [topicId, startTime, endTime],
            );

      if (result.rows.length === 0) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
      }

      const data: HistorianDataPoint[] = result.rows.map((row) => ({
        timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
        value: applyTransform(HistorianService.toNumber(row.value), entry.transform),
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
          binning: HistorianService.buildBinningInfo(bucketing),
          aggregation: bucketing.mode === "binned" ? aggregation : undefined,
          ...HistorianService.displayMetadata(entry),
        },
      };
    } catch (error) {
      this.logger.error("Error fetching weather time series", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get aggregated data for a unit metric
   */
  async getUnitAggregated(
    campus: string,
    building: string,
    system: string,
    metric: UnitMetric,
    startTime: Date,
    endTime: Date,
    interval: string,
    aggregation: AggregationType,
  ): Promise<HistorianAggregateResult> {
    const errors: string[] = [];
    const topics: Record<string, string> = {};

    const entry = resolveUnitMetricEntry(metric, this.configService.historian.topicMap);
    const topicPath = buildUnitTopicPath(campus, building, system, metric, this.configService.historian.topicMap);
    topics[metric] = topicPath;

    const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
    if (!intervalMatch) {
      throw new Error("Invalid interval format. Use format like '1m', '5m', '1h', etc.");
    }

    const [, , intervalUnit] = intervalMatch;
    const intervalMap: Record<string, string> = {
      s: "seconds",
      m: "minutes",
      h: "hours",
      d: "days",
    };

    const aggFunction = aggregation.toLowerCase();
    const valueExpr =
      aggregation === AggregationType.Count ? "*" : "CAST(NULLIF(value_string, 'null') AS double precision)";

    try {
      const topicId = await this.resolveTopicId(topicPath);
      if (topicId === null) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
        return { aggregates: [], metadata: { topics, errors, ...HistorianService.displayMetadata(entry) } };
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
      const result = await this.pool.query<{ timestamp: string; value: number | string | null }>(query, [
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
          value: applyTransform(typeof row.value === "string" ? parseFloat(row.value) : null, entry.transform),
          metric,
        })),
        metadata: { topics, errors, ...HistorianService.displayMetadata(entry) },
      };
    } catch (error) {
      this.logger.error("Error fetching aggregated data", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get aggregated data for a weather metric
   */
  async getWeatherAggregated(
    campus: string,
    building: string,
    metric: WeatherMetric,
    startTime: Date,
    endTime: Date,
    interval: string,
    aggregation: AggregationType,
  ): Promise<HistorianAggregateResult> {
    const errors: string[] = [];
    const topics: Record<string, string> = {};

    const entry = resolveWeatherMetricEntry(metric, this.configService.historian.topicMap);
    const topicPath = buildWeatherTopicPath(campus, building, metric, this.configService.historian.topicMap);
    topics[metric] = topicPath;

    const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
    if (!intervalMatch) {
      throw new Error("Invalid interval format. Use format like '1m', '5m', '1h', etc.");
    }

    const [, , intervalUnit] = intervalMatch;
    const intervalMap: Record<string, string> = {
      s: "seconds",
      m: "minutes",
      h: "hours",
      d: "days",
    };

    const aggFunction = aggregation.toLowerCase();
    const valueExpr =
      aggregation === AggregationType.Count ? "*" : "CAST(NULLIF(value_string, 'null') AS double precision)";

    try {
      const topicId = await this.resolveTopicId(topicPath);
      if (topicId === null) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
        return { aggregates: [], metadata: { topics, errors, ...HistorianService.displayMetadata(entry) } };
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
      const result = await this.pool.query<{ timestamp: string; value: number | string | null }>(query, [
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
          value: applyTransform(typeof row.value === "string" ? parseFloat(row.value) : null, entry.transform),
          metric,
        })),
        metadata: { topics, errors, ...HistorianService.displayMetadata(entry) },
      };
    } catch (error) {
      this.logger.error("Error fetching aggregated data", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get current value for a meter metric
   */
  async getMeterCurrentValue(
    campus: string,
    building: string,
    metric: MeterMetric,
  ): Promise<HistorianMetricCurrent | null> {
    const errors: string[] = [];
    const topics: Record<string, string> = {};

    const entry = resolveMeterMetricEntry(metric, this.configService.historian.topicMap);
    const topicPath = buildMeterTopicPath(campus, building, metric, this.configService.historian.topicMap);
    topics[metric] = topicPath;

    try {
      const topicId = await this.resolveTopicId(topicPath);
      if (topicId === null) {
        errors.push(`No data found for topic: ${topicPath}`);
        return null;
      }

      const result = await this.pool.query<Pick<HistorianDataRow, "ts" | "value_string">>(
        `SELECT ts, value_string FROM data WHERE topic_id = $1 ORDER BY ts DESC LIMIT 1`,
        [topicId],
      );

      if (result.rows.length === 0) {
        errors.push(`No data found for topic: ${topicPath}`);
        return null;
      }

      const row = result.rows[0];
      return {
        system: "meter",
        metric,
        value: applyTransform(this.parseValue(row.value_string), entry.transform),
        timestamp: new Date(row.ts),
        metadata: { topics, errors, ...HistorianService.displayMetadata(entry) },
      };
    } catch (error) {
      this.logger.error("Error fetching meter current value", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get time series data for a meter metric
   */
  async getMeterTimeSeries(
    campus: string,
    building: string,
    metric: MeterMetric,
    startTime: Date,
    endTime: Date,
  ): Promise<HistorianTimeSeries> {
    const errors: string[] = [];
    const topics: Record<string, string> = {};

    const entry = resolveMeterMetricEntry(metric, this.configService.historian.topicMap);
    const topicPath = buildMeterTopicPath(campus, building, metric, this.configService.historian.topicMap);
    topics[metric] = topicPath;

    try {
      const topicId = await this.resolveTopicId(topicPath);
      if (topicId === null) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
        return {
          system: "meter",
          metric,
          data: [],
          metadata: { topics, errors, ...HistorianService.displayMetadata(entry) },
        };
      }

      const bucketing = this.resolveBucketing(startTime, endTime);
      const { aggregation } = entry;
      const numericValueExpr = `CASE
        WHEN value_string ~ '^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$'
          THEN value_string::double precision
        ELSE NULL
      END`;

      const result =
        bucketing.mode === "binned"
          ? await this.pool.query<{ timestamp: Date | string; value: number | string | null }>(
              `
          SELECT
            date_bin($4::interval, ts, $2::timestamptz) AS timestamp,
            ${aggregationSql(aggregation, numericValueExpr)} AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          GROUP BY 1
          ORDER BY 1
        `,
              [topicId, startTime, endTime, bucketing.sql],
            )
          : await this.pool.query<{ timestamp: Date | string; value: number | string | null }>(
              `
          SELECT
            ts AS timestamp,
            ${numericValueExpr} AS value
          FROM data
          WHERE topic_id = $1
            AND ts >= $2
            AND ts <= $3
          ORDER BY ts
        `,
              [topicId, startTime, endTime],
            );

      if (result.rows.length === 0) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
      }

      const data: HistorianDataPoint[] = result.rows.map((row) => ({
        timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
        value: applyTransform(HistorianService.toNumber(row.value), entry.transform),
        system: "meter",
        metric,
      }));

      return {
        system: "meter",
        metric,
        data,
        metadata: {
          topics,
          errors,
          binning: HistorianService.buildBinningInfo(bucketing),
          aggregation: bucketing.mode === "binned" ? aggregation : undefined,
          ...HistorianService.displayMetadata(entry),
        },
      };
    } catch (error) {
      this.logger.error("Error fetching meter time series", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get aggregated data for a meter metric
   */
  async getMeterAggregated(
    campus: string,
    building: string,
    metric: MeterMetric,
    startTime: Date,
    endTime: Date,
    interval: string,
    aggregation: AggregationType,
  ): Promise<HistorianAggregateResult> {
    const errors: string[] = [];
    const topics: Record<string, string> = {};

    const entry = resolveMeterMetricEntry(metric, this.configService.historian.topicMap);
    const topicPath = buildMeterTopicPath(campus, building, metric, this.configService.historian.topicMap);
    topics[metric] = topicPath;

    const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
    if (!intervalMatch) {
      throw new Error("Invalid interval format. Use format like '1m', '5m', '1h', etc.");
    }

    const [, , intervalUnit] = intervalMatch;
    const intervalMap: Record<string, string> = {
      s: "seconds",
      m: "minutes",
      h: "hours",
      d: "days",
    };

    const aggFunction = aggregation.toLowerCase();
    const valueExpr =
      aggregation === AggregationType.Count ? "*" : "CAST(NULLIF(value_string, 'null') AS double precision)";

    try {
      const topicId = await this.resolveTopicId(topicPath);
      if (topicId === null) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
        return { aggregates: [], metadata: { topics, errors, ...HistorianService.displayMetadata(entry) } };
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
      const result = await this.pool.query<{ timestamp: string; value: number | string | null }>(query, [
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
          value: applyTransform(typeof row.value === "string" ? parseFloat(row.value) : null, entry.transform),
          metric,
        })),
        metadata: { topics, errors, ...HistorianService.displayMetadata(entry) },
      };
    } catch (error) {
      this.logger.error("Error fetching meter aggregated data", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get multi-system data for a unit metric
   * Returns per-system results with metadata including constructed topic paths and any errors
   */
  async getMultiSystemUnit(
    campus: string,
    building: string,
    systems: string[],
    deniedSystems: string[],
    metric: UnitMetric,
    startTime: Date,
    endTime: Date,
    interval?: string,
  ): Promise<HistorianMultiSystemData[]> {
    if (systems.length === 0 && deniedSystems.length === 0) {
      return [];
    }

    // Build per-system topic paths for metadata
    const systemTopics: Record<string, string> = {};
    systems.forEach((sys) => {
      systemTopics[sys] = buildUnitTopicPath(campus, building, sys, metric, this.configService.historian.topicMap);
    });

    const queryResult: Record<string, HistorianDataPoint[]> = {};
    systems.forEach((sys) => {
      queryResult[sys] = [];
    });

    const bucketing = this.resolveBucketing(startTime, endTime, interval ?? undefined);
    const msuEntry = resolveUnitMetricEntry(metric, this.configService.historian.topicMap);
    const { aggregation: msuAggregation } = msuEntry;
    const binning = HistorianService.buildBinningInfo(bucketing);
    const aggregationLabel = bucketing.mode === "binned" ? msuAggregation : undefined;
    const displayMeta = HistorianService.displayMetadata(msuEntry);

    if (systems.length > 0) {
      // Resolve every system's topic_id up front so the data query is a
      // pure composite-PK scan on (topic_id, ts) — no JOIN, no ILIKE, and
      // no string-interpolated system names.
      const pathToId = await this.resolveTopicIds(Object.values(systemTopics));
      const topicIdToSystem = new Map<number, string>();
      const topicIds: number[] = [];
      for (const sys of systems) {
        const id = pathToId.get(systemTopics[sys]);
        if (id !== undefined) {
          topicIdToSystem.set(id, sys);
          topicIds.push(id);
        }
      }

      if (topicIds.length > 0) {
        // Aggregation comes from the topic map — no more guessing per metric.
        const aggregation = msuAggregation;
        const valueExpr = `CAST(NULLIF(value_string, 'null') AS double precision)`;

        try {
          if (bucketing.mode === "binned") {
            const query = `
              SELECT
                date_bin($4::interval, ts, $1::timestamptz) AS timestamp,
                topic_id,
                ${aggregationSql(aggregation, valueExpr)} AS value
              FROM data
              WHERE topic_id = ANY($3::int[])
                AND ts >= $1
                AND ts <= $2
              GROUP BY 1, 2
              ORDER BY 1, 2
            `;
            const result = await this.pool.query<{
              timestamp: Date | string;
              topic_id: number;
              value: number | string | null;
            }>(query, [startTime, endTime, topicIds, bucketing.sql]);
            result.rows.forEach((row) => {
              const sys = topicIdToSystem.get(row.topic_id);
              if (!sys) return;
              queryResult[sys].push({
                timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
                value: applyTransform(
                  typeof row.value === "string" ? parseFloat(row.value) : (row.value ?? null),
                  msuEntry.transform,
                ),
                system: sys,
                metric,
              });
            });
          } else {
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
            const result = await this.pool.query<{
              timestamp: Date | string;
              topic_id: number;
              value: number | string | null;
            }>(query, [startTime, endTime, topicIds]);
            result.rows.forEach((row) => {
              const sys = topicIdToSystem.get(row.topic_id);
              if (!sys) return;
              queryResult[sys].push({
                timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp),
                value: applyTransform(
                  typeof row.value === "string" ? parseFloat(row.value) : (row.value ?? null),
                  msuEntry.transform,
                ),
                system: sys,
                metric,
              });
            });
          }
        } catch (error) {
          this.logger.error("Error fetching multi-system data", error);
          throw error;
        }
      }
    }

    // Bucket grid used to fill gaps with explicit null points so the client
    // can render "Unknown" as discrete segments aligned with real data
    // points, instead of relying on a separate full-width background bar.
    // The grid matches Postgres `date_bin($interval, ts, $startTime)`, which
    // anchors buckets at `startTime + N*stepMs`. Only meaningful when binned;
    // raw mode preserves historian timestamps as-is.
    const fillBuckets = (existing: HistorianDataPoint[], sys: string): HistorianDataPoint[] => {
      if (bucketing.mode !== "binned") return existing;
      const byBucket = new Map<number, HistorianDataPoint>();
      for (const pt of existing) byBucket.set(pt.timestamp.getTime(), pt);
      const filled: HistorianDataPoint[] = [];
      const fillStartMs = startTime.getTime();
      const fillEndMs = endTime.getTime();
      for (let bucketMs = fillStartMs; bucketMs <= fillEndMs; bucketMs += bucketing.ms) {
        const pt = byBucket.get(bucketMs);
        if (pt) {
          filled.push(pt);
        } else {
          filled.push({ timestamp: new Date(bucketMs), value: null, system: sys, metric });
        }
      }
      return filled;
    };

    // Build results for allowed systems
    const results: HistorianMultiSystemData[] = systems.map((sys) => {
      const raw = queryResult[sys] ?? [];
      const data = fillBuckets(raw, sys);
      const errors: string[] = [];
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

    // Add denied systems with access error
    deniedSystems.forEach((sys) => {
      const topicPath = buildUnitTopicPath(campus, building, sys, metric, this.configService.historian.topicMap);
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

  /**
   * Get multi-system data as ranges (optimized for timeline visualizations)
   * Consolidates consecutive identical values into ranges to reduce data transfer
   */
  async getMultiSystemUnitRanges(
    campus: string,
    building: string,
    systems: string[],
    deniedSystems: string[],
    metric: UnitMetric,
    startTime: Date,
    endTime: Date,
  ): Promise<HistorianMultiSystemRanges[]> {
    if (systems.length === 0 && deniedSystems.length === 0) {
      return [];
    }

    const grouped: Record<string, HistorianDataRange[]> = {};
    systems.forEach((sys) => {
      grouped[sys.toUpperCase()] = [];
    });

    const rangesEntry = resolveUnitMetricEntry(metric, this.configService.historian.topicMap);
    const rangesDisplayMeta = HistorianService.displayMetadata(rangesEntry);

    if (systems.length > 0) {
      // Pre-resolve each system's topic_id so the data scan is pure PK.
      const systemTopics = new Map<string, string>(
        systems.map((sys) => [sys, buildUnitTopicPath(campus, building, sys, metric, this.configService.historian.topicMap)]),
      );
      const pathToId = await this.resolveTopicIds([...systemTopics.values()]);
      const topicIdToSystem = new Map<number, string>();
      const topicIds: number[] = [];
      for (const [sys, path] of systemTopics) {
        const id = pathToId.get(path);
        if (id !== undefined) {
          topicIdToSystem.set(id, sys);
          topicIds.push(id);
        }
      }

      if (topicIds.length > 0) {
        // Aggregation comes from the topic map. The prior raw-ts path stayed
        // unaligned with the binned dashboard grid; binning + the configured
        // aggregation keeps timelines consistent with the rest of the view.
        const { aggregation } = rangesEntry;
        const valueExpr = `CAST(NULLIF(value_string, 'null') AS double precision)`;
        const bucketing = this.resolveBucketing(startTime, endTime);

        try {
          if (bucketing.mode === "binned") {
            const query = `
              SELECT
                topic_id,
                date_bin($4::interval, ts, $1::timestamptz) AS bucket,
                ${aggregationSql(aggregation, valueExpr)} AS value
              FROM data
              WHERE topic_id = ANY($3::int[])
                AND ts >= $1
                AND ts <= $2
              GROUP BY 1, 2
              ORDER BY 1, 2
            `;
            const result = await this.pool.query<{
              topic_id: number;
              bucket: Date | string;
              value: number | string | null;
            }>(query, [startTime, endTime, topicIds, bucketing.sql]);

            // Group bucketed samples per topic, then collapse consecutive
            // identical buckets into ranges. Boundaries land on the same grid
            // as `getMultiSystemUnit` so the timeline lines up.
            const seriesByTopic = new Map<number, Array<{ bucketMs: number; value: number | null }>>();
            for (const row of result.rows) {
              let arr = seriesByTopic.get(row.topic_id);
              if (!arr) {
                arr = [];
                seriesByTopic.set(row.topic_id, arr);
              }
              const bucketMs = row.bucket instanceof Date ? row.bucket.getTime() : new Date(row.bucket).getTime();
              const value = applyTransform(HistorianService.toNumber(row.value), rangesEntry.transform);
              arr.push({ bucketMs, value });
            }

            const stepMs = bucketing.ms;
            const endMs = endTime.getTime();
            for (const [topicId, series] of seriesByTopic) {
              const sys = topicIdToSystem.get(topicId);
              if (!sys) continue;
              const key = sys.toUpperCase();
              if (!grouped[key]) continue;
              let cur: { startMs: number; value: number } | null = null;
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
                } else if (pt.value !== cur.value) {
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
          } else {
            // Below the binning threshold the dashboard renders raw historian
            // samples, so ranges use the original CTE that emits historian
            // `ts` values directly — alignment is moot when neither side bins.
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
            const result = await this.pool.query<{
              topic_id: number;
              start_time: string;
              end_time: string;
              value: number;
            }>(query, [startTime, endTime, topicIds]);

            result.rows.forEach((row) => {
              const sys = topicIdToSystem.get(row.topic_id);
              if (!sys) return;
              const key = sys.toUpperCase();
              if (grouped[key]) {
                grouped[key].push({
                  startTime: new Date(row.start_time),
                  endTime: new Date(row.end_time),
                  value: applyTransform(row.value, rangesEntry.transform),
                  system: sys,
                  metric,
                });
              }
            });
          }
        } catch (error) {
          this.logger.error("Error fetching multi-system ranges", error);
          throw error;
        }
      }
    }

    // Build results for allowed systems
    const results: HistorianMultiSystemRanges[] = systems.map((sys) => {
      const ranges = grouped[sys.toUpperCase()] || [];
      const topicPath = buildUnitTopicPath(campus, building, sys, metric, this.configService.historian.topicMap);
      const errors: string[] = [];
      if (ranges.length === 0) {
        errors.push(`No data found for topic: ${topicPath} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`);
      }
      return {
        system: sys,
        ranges,
        metadata: { topics: { [metric]: topicPath }, errors, ...rangesDisplayMeta },
      };
    });

    // Add denied systems with access error
    deniedSystems.forEach((sys) => {
      const topicPath = buildUnitTopicPath(campus, building, sys, metric, this.configService.historian.topicMap);
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

  /**
   * Get setpoint error as ranges (optimized for timeline visualizations)
   * Groups similar error values into ranges to reduce data transfer
   */
  async getMultiSystemSetpointErrorRanges(
    campus: string,
    building: string,
    systems: string[],
    deniedSystems: string[],
    startTime: Date,
    endTime: Date,
  ): Promise<HistorianMultiSystemRanges[]> {
    if (systems.length === 0 && deniedSystems.length === 0) {
      return [];
    }

    const tempMetric = UnitMetric.ZoneTemperature;
    const occMetric = UnitMetric.OccupancyCommand;
    const occHeatMetric = UnitMetric.OccupiedHeatingSetPoint;
    const occCoolMetric = UnitMetric.OccupiedCoolingSetPoint;
    const unoccHeatMetric = UnitMetric.UnoccupiedHeatingSetPoint;
    const unoccCoolMetric = UnitMetric.UnoccupiedCoolingSetPoint;
    const topicMap = this.configService.historian.topicMap;

    const buildTopics = (sys: string): Record<string, string> => ({
      [tempMetric]: buildUnitTopicPath(campus, building, sys, tempMetric, topicMap),
      [occMetric]: buildUnitTopicPath(campus, building, sys, occMetric, topicMap),
      [occHeatMetric]: buildUnitTopicPath(campus, building, sys, occHeatMetric, topicMap),
      [occCoolMetric]: buildUnitTopicPath(campus, building, sys, occCoolMetric, topicMap),
      [unoccHeatMetric]: buildUnitTopicPath(campus, building, sys, unoccHeatMetric, topicMap),
      [unoccCoolMetric]: buildUnitTopicPath(campus, building, sys, unoccCoolMetric, topicMap),
    });

    const grouped: Record<string, HistorianDataRange[]> = {};
    systems.forEach((sys) => {
      grouped[sys.toUpperCase()] = [];
    });

    if (systems.length > 0) {
      const sysTopics = new Map<string, ReturnType<typeof buildTopics>>(systems.map((sys) => [sys, buildTopics(sys)]));
      const allPaths: string[] = [];
      for (const t of sysTopics.values()) allPaths.push(...Object.values(t));
      const pathToId = await this.resolveTopicIds(allPaths);

      // For each topic kind, build a topic_id -> system map, and collect the
      // set of ids to query.
      type Kind = "temp" | "occ" | "occHeat" | "occCool" | "unoccHeat" | "unoccCool";
      const kindMetric: Record<Kind, UnitMetric> = {
        temp: tempMetric,
        occ: occMetric,
        occHeat: occHeatMetric,
        occCool: occCoolMetric,
        unoccHeat: unoccHeatMetric,
        unoccCool: unoccCoolMetric,
      };
      const idToSystemByKind: Record<Kind, Map<number, string>> = {
        temp: new Map(),
        occ: new Map(),
        occHeat: new Map(),
        occCool: new Map(),
        unoccHeat: new Map(),
        unoccCool: new Map(),
      };
      const allTempIds: number[] = [];
      const allOccIds: number[] = [];
      const allSetpointIds: number[] = [];
      for (const [sys, t] of sysTopics) {
        for (const kind of Object.keys(kindMetric) as Kind[]) {
          const id = pathToId.get(t[kindMetric[kind]]);
          if (id === undefined) continue;
          idToSystemByKind[kind].set(id, sys);
          if (kind === "temp") allTempIds.push(id);
          else if (kind === "occ") allOccIds.push(id);
          else allSetpointIds.push(id);
        }
      }

      if (allTempIds.length > 0) {
        // Setpoint-error always bins because the per-bucket walk in
        // computeBucketErrorSeries needs a fixed grid. The width is also
        // floored (see `deriveSetpointErrorBucketInterval`) so short ranges
        // don't pick a grid finer than the RTU sampling cadence and litter
        // the chart with spurious "Missing Data" stripes.
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
          const tempPromise = this.pool.query<{
            topic_id: number;
            bucket: Date | string;
            temp_value: number | string | null;
          }>(tempQuery, [startTime, endTime, allTempIds, bucketInterval.sql]);
          const setpointPromise =
            allSetpointIds.length > 0
              ? this.pool.query<{ topic_id: number; ts: Date | string; sp_value: number | string | null }>(
                  setpointQuery,
                  [startTime, endTime, allSetpointIds],
                )
              : Promise.resolve({
                  rows: [] as Array<{ topic_id: number; ts: Date | string; sp_value: number | string | null }>,
                });
          const occupancyPromise =
            allOccIds.length > 0
              ? this.pool.query<{ topic_id: number; ts: Date | string; occ_value: number | string | null }>(
                  occupancyQuery,
                  [startTime, endTime, allOccIds],
                )
              : Promise.resolve({
                  rows: [] as Array<{ topic_id: number; ts: Date | string; occ_value: number | string | null }>,
                });

          const [tempResult, setpointResult, occupancyResult] = await Promise.all([
            tempPromise,
            setpointPromise,
            occupancyPromise,
          ]);

          // Bucket per system.
          const tempByBucketBySys = new Map<string, Map<number, number>>();
          for (const row of tempResult.rows) {
            const sys = idToSystemByKind.temp.get(row.topic_id);
            if (!sys) continue;
            const v = HistorianService.toNumber(row.temp_value);
            if (v == null) continue;
            const bucketMs = row.bucket instanceof Date ? row.bucket.getTime() : new Date(row.bucket).getTime();
            let m = tempByBucketBySys.get(sys);
            if (!m) {
              m = new Map();
              tempByBucketBySys.set(sys, m);
            }
            m.set(bucketMs, v);
          }

          // Setpoints partitioned by (system, kind).
          type Sample = { t: number; v: number };
          const setpointsBySys = new Map<
            string,
            { occHeat: Sample[]; occCool: Sample[]; unoccHeat: Sample[]; unoccCool: Sample[] }
          >();
          const ensureSetpoints = (sys: string) => {
            let entry = setpointsBySys.get(sys);
            if (!entry) {
              entry = { occHeat: [], occCool: [], unoccHeat: [], unoccCool: [] };
              setpointsBySys.set(sys, entry);
            }
            return entry;
          };
          for (const row of setpointResult.rows) {
            const v = HistorianService.toNumber(row.sp_value);
            if (v == null) continue;
            const t = row.ts instanceof Date ? row.ts.getTime() : new Date(row.ts).getTime();
            const sample: Sample = { t, v };
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

          // Occupancy per system.
          const occupanciesBySys = new Map<string, Sample[]>();
          for (const row of occupancyResult.rows) {
            const sys = idToSystemByKind.occ.get(row.topic_id);
            if (!sys) continue;
            const v = HistorianService.toNumber(row.occ_value);
            if (v == null) continue;
            const t = row.ts instanceof Date ? row.ts.getTime() : new Date(row.ts).getTime();
            let arr = occupanciesBySys.get(sys);
            if (!arr) {
              arr = [];
              occupanciesBySys.set(sys, arr);
            }
            arr.push({ t, v });
          }

          // Run the same bucket walk + range collapse per system.
          const startMs = startTime.getTime();
          const endMs = endTime.getTime();
          for (const sys of idToSystemByKind.temp.values()) {
            const tempByBucket = tempByBucketBySys.get(sys) ?? new Map<number, number>();
            const sp = setpointsBySys.get(sys) ?? { occHeat: [], occCool: [], unoccHeat: [], unoccCool: [] };
            const occupancies = occupanciesBySys.get(sys) ?? [];
            const series = HistorianService.computeBucketErrorSeries({
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
            const ranges = HistorianService.collapseErrorSeriesToRanges(series, endMs, sys, tempMetric);
            const key = sys.toUpperCase();
            if (grouped[key]) grouped[key].push(...ranges);
          }
        } catch (error) {
          this.logger.error("Error fetching setpoint error ranges", error);
          throw error;
        }
      }
    }

    const results: HistorianMultiSystemRanges[] = systems.map((sys) => {
      const ranges = grouped[sys.toUpperCase()] || [];
      const errors: string[] = [];
      if (ranges.length === 0) {
        errors.push(
          `No setpoint error data found for ${sys} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`,
        );
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

  /**
   * Human-readable bucket widths (seconds). Both `deriveBucketInterval` and
   * `deriveSetpointErrorBucketInterval` snap their target up to the next
   * entry here so SQL `date_bin` and the JS bucket walk land on the same
   * grid.
   */
  private static readonly NICE_BUCKET_SECONDS = [
    10, 30,
    60, 120, 300, 600, 900, 1800,
    3600, 7200, 10800, 21600, 43200,
    86400, 604800,
  ];

  private static snapToNiceSeconds(targetSec: number): number {
    const list = HistorianService.NICE_BUCKET_SECONDS;
    return list.find((s) => s >= targetSec) ?? list[list.length - 1];
  }

  /**
   * Derive a sensible bucket interval for a query range, targeting the
   * configured `historian.binning.count` and snapping to a human-readable
   * width. Returns both a Postgres interval literal (e.g. "300 seconds")
   * and the corresponding width in milliseconds so JS and SQL see the same
   * value.
   */
  private deriveBucketInterval(startTime: Date, endTime: Date): { sql: string; ms: number } {
    const rangeMs = Math.max(1, endTime.getTime() - startTime.getTime());
    const targetBuckets = Math.max(1, this.configService.historian.binning.count);
    const targetSec = Math.max(1, Math.ceil(rangeMs / 1000 / targetBuckets));
    const chosen = HistorianService.snapToNiceSeconds(targetSec);
    return { sql: `${chosen} seconds`, ms: chosen * 1000 };
  }

  /**
   * Compute the minimum setpoint-error bucket width (seconds, snapped to
   * the nice list) from binning config. Pure function — exposed for tests.
   * Honors an explicit `setpointErrorMinBucket` override; otherwise derives
   * from `start * unit / count` (the bucket width binning would produce
   * for a range exactly at the raw threshold).
   */
  static computeSetpointErrorFloorSec(binning: {
    count: number;
    start: number;
    unit: "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years";
    setpointErrorMinBucket?: string;
  }): number {
    let raw: number;
    if (binning.setpointErrorMinBucket) {
      raw = Math.max(1, Math.ceil(HistorianService.parseClientInterval(binning.setpointErrorMinBucket).ms / 1000));
    } else {
      const thresholdMs = Math.max(0, binning.start) * HistorianService.msPerDurationUnit(binning.unit);
      raw = Math.max(1, Math.ceil(thresholdMs / 1000 / Math.max(1, binning.count)));
    }
    return HistorianService.snapToNiceSeconds(raw);
  }

  /**
   * Setpoint-error bucket interval. The error series is computed by walking
   * a fixed grid (LOCF over occupancy + four setpoints, AVG over zone temp),
   * so on short ranges `deriveBucketInterval` produces buckets finer than
   * the RTU sampling cadence and most buckets land empty — which the client
   * then renders as spurious "Missing Data" stripes. Floor the width at
   * either an explicit override (`HISTORIAN_SETPOINT_ERROR_MIN_BUCKET`,
   * e.g. `5m`) or the implicit threshold derived from the binning config
   * (`start * unit / count` — i.e. the bucket width binning would produce
   * for a range exactly at the raw threshold).
   */
  private deriveSetpointErrorBucketInterval(startTime: Date, endTime: Date): { sql: string; ms: number } {
    const base = this.deriveBucketInterval(startTime, endTime);
    const flooredSec = HistorianService.computeSetpointErrorFloorSec(this.configService.historian.binning);
    if (base.ms >= flooredSec * 1000) return base;
    return { sql: `${flooredSec} seconds`, ms: flooredSec * 1000 };
  }

  /**
   * Resolve how a query should be bucketed for a given range and optional
   * client-supplied interval. When the requested range is at or below the
   * configured `historian.binning.start * unit` threshold, returns `raw` so
   * the caller can skip `date_bin` and emit historian `ts` values directly.
   * An explicit `clientInterval` always forces binning.
   */
  private resolveBucketing(
    startTime: Date,
    endTime: Date,
    clientInterval?: string,
  ): { mode: "binned"; sql: string; ms: number } | { mode: "raw" } {
    if (clientInterval) {
      const parsed = HistorianService.parseClientInterval(clientInterval);
      return { mode: "binned", sql: parsed.sql, ms: parsed.ms };
    }
    const { start, unit } = this.configService.historian.binning;
    const thresholdMs = Math.max(0, start) * HistorianService.msPerDurationUnit(unit);
    const rangeMs = Math.max(0, endTime.getTime() - startTime.getTime());
    if (thresholdMs > 0 && rangeMs <= thresholdMs) {
      return { mode: "raw" };
    }
    const derived = this.deriveBucketInterval(startTime, endTime);
    return { mode: "binned", sql: derived.sql, ms: derived.ms };
  }

  /**
   * Convert a duration unit (as parsed by `toDurationUnit`) to milliseconds.
   * Months and years use 30/365 day approximations — fine for a binning
   * threshold where exact calendar arithmetic isn't required.
   */
  private static msPerDurationUnit(
    unit: "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years",
  ): number {
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

  /**
   * Parse a client-supplied interval string like "5m" / "1h" into the same
   * { sql, ms } shape that `deriveBucketInterval` produces, so every
   * bucketed query can use a single `date_bin` call site.
   */
  private static parseClientInterval(interval: string): { sql: string; ms: number } {
    const match = interval.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid interval format: "${interval}". Use e.g. "5m", "1h", "30s".`);
    }
    const n = parseInt(match[1], 10);
    const unit = match[2];
    const unitMap: Record<string, { name: string; ms: number }> = {
      s: { name: "seconds", ms: 1000 },
      m: { name: "minutes", ms: 60_000 },
      h: { name: "hours", ms: 3_600_000 },
      d: { name: "days", ms: 86_400_000 },
    };
    const u = unitMap[unit];
    return { sql: `${n} ${u.name}`, ms: n * u.ms };
  }

  /**
   * Format a millisecond bucket width as a short human label like "5m" or
   * "1h", choosing the largest whole unit that divides cleanly. Falls back
   * to seconds for sub-minute or non-divisible widths so the label always
   * round-trips to a valid client-interval string.
   */
  private static formatIntervalLabel(ms: number): string {
    if (!Number.isFinite(ms) || ms <= 0) return `${Math.max(0, Math.round(ms))}ms`;
    const day = 86_400_000;
    const hour = 3_600_000;
    const minute = 60_000;
    const second = 1000;
    if (ms % day === 0) return `${ms / day}d`;
    if (ms % hour === 0) return `${ms / hour}h`;
    if (ms % minute === 0) return `${ms / minute}m`;
    return `${Math.round(ms / second)}s`;
  }

  /**
   * Build the binning metadata that gets attached to historian results so
   * the dashboard can show whether the values it received are raw historian
   * samples or fixed-width buckets, and what bucket width was used.
   */
  private static buildBinningInfo(
    bucketing: { mode: "binned"; sql: string; ms: number } | { mode: "raw" },
  ): HistorianBinningInfo {
    if (bucketing.mode === "raw") {
      return { mode: "raw" };
    }
    return {
      mode: "binned",
      intervalMs: bucketing.ms,
      intervalLabel: HistorianService.formatIntervalLabel(bucketing.ms),
    };
  }

  private static toNumber(v: string | number | null | undefined): number | null {
    if (typeof v === "number") return isFinite(v) ? v : null;
    if (typeof v === "string") {
      const n = parseFloat(v);
      return isFinite(n) ? n : null;
    }
    return null;
  }

  /**
   * Extract the display-only fields (format / prefix / suffix) from a
   * resolved metric entry into a partial `HistorianQueryMetadata` so callers
   * can spread them onto their response metadata. Empty strings are dropped
   * so they don't bloat serialized payloads.
   */
  private static displayMetadata(
    entry: ResolvedMetricEntry,
  ): Pick<HistorianQueryMetadata, "format" | "prefix" | "suffix"> {
    return {
      format: entry.format,
      prefix: entry.prefix === "" ? undefined : entry.prefix,
      suffix: entry.suffix === "" ? undefined : entry.suffix,
    };
  }

  /**
   * Walk a regular bucket grid and emit the occupancy-aware setpoint error per
   * bucket. Inside the active deadband (occupied or unoccupied based on the
   * occupancy state) the error is 0; below heat or above cool it is the
   * signed distance to that edge. Occupancy state 1 (unknown) is treated as
   * occupied — matches the dashboard's behavior.
   *
   * All sample arrays must be sorted ascending by `t`. The walk is O(N + M)
   * via per-stream LOCF index pointers.
   */
  private static computeBucketErrorSeries(args: {
    startMs: number;
    endMs: number;
    stepMs: number;
    tempByBucket: Map<number, number>;
    occupancies: Array<{ t: number; v: number }>;
    occHeat: Array<{ t: number; v: number }>;
    occCool: Array<{ t: number; v: number }>;
    unoccHeat: Array<{ t: number; v: number }>;
    unoccCool: Array<{ t: number; v: number }>;
  }): Array<{ bucketMs: number; value: number | null }> {
    const { startMs, endMs, stepMs, tempByBucket, occupancies, occHeat, occCool, unoccHeat, unoccCool } = args;
    const out: Array<{ bucketMs: number; value: number | null }> = [];
    let occIdx = -1;
    let ohIdx = -1;
    let ocIdx = -1;
    let uhIdx = -1;
    let ucIdx = -1;

    for (let bucketMs = startMs; bucketMs <= endMs; bucketMs += stepMs) {
      const bucketEndMs = bucketMs + stepMs;
      while (occIdx + 1 < occupancies.length && occupancies[occIdx + 1].t <= bucketEndMs) occIdx++;
      while (ohIdx + 1 < occHeat.length && occHeat[ohIdx + 1].t <= bucketEndMs) ohIdx++;
      while (ocIdx + 1 < occCool.length && occCool[ocIdx + 1].t <= bucketEndMs) ocIdx++;
      while (uhIdx + 1 < unoccHeat.length && unoccHeat[uhIdx + 1].t <= bucketEndMs) uhIdx++;
      while (ucIdx + 1 < unoccCool.length && unoccCool[ucIdx + 1].t <= bucketEndMs) ucIdx++;

      const temp = tempByBucket.get(bucketMs);
      let value: number | null = null;
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

  /**
   * Collapse a per-bucket error series into ranges, opening a new range when
   * the value moves more than 0.5° from the open range's value (matches the
   * threshold used by the previous SQL-side implementation). Null buckets
   * close any open range without starting a new one.
   */
  private static collapseErrorSeriesToRanges(
    series: Array<{ bucketMs: number; value: number | null }>,
    endMs: number,
    system: string,
    metric: UnitMetric,
  ): HistorianDataRange[] {
    const ranges: HistorianDataRange[] = [];
    let cur: { startMs: number; value: number } | null = null;
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
      } else if (Math.abs(pt.value - cur.value) > 0.5) {
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

  /**
   * Calculate occupancy-aware setpoint error for a system.
   *
   * Zone temp is bucketed (AVG) onto the auto-derived grid; occupancy and the
   * four heating/cooling setpoints use LOCF with a 30-day pre-window so
   * sparsely-published values still cover the whole range.
   *
   * Error formula:
   *   Occupied (or Unknown) -> 0 inside [OccHeat, OccCool], signed distance otherwise
   *   Unoccupied            -> 0 inside [UnoccHeat, UnoccCool], signed distance otherwise
   */
  async calculateSetpointError(
    campus: string,
    building: string,
    system: string,
    startTime: Date,
    endTime: Date,
  ): Promise<HistorianTimeSeries> {
    const errors: string[] = [];
    const tempMetric = UnitMetric.ZoneTemperature;
    const occMetric = UnitMetric.OccupancyCommand;
    const occHeatMetric = UnitMetric.OccupiedHeatingSetPoint;
    const occCoolMetric = UnitMetric.OccupiedCoolingSetPoint;
    const unoccHeatMetric = UnitMetric.UnoccupiedHeatingSetPoint;
    const unoccCoolMetric = UnitMetric.UnoccupiedCoolingSetPoint;

    const topicMap = this.configService.historian.topicMap;
    const tempPath = buildUnitTopicPath(campus, building, system, tempMetric, topicMap);
    const occupancyPath = buildUnitTopicPath(campus, building, system, occMetric, topicMap);
    const occHeatPath = buildUnitTopicPath(campus, building, system, occHeatMetric, topicMap);
    const occCoolPath = buildUnitTopicPath(campus, building, system, occCoolMetric, topicMap);
    const unoccHeatPath = buildUnitTopicPath(campus, building, system, unoccHeatMetric, topicMap);
    const unoccCoolPath = buildUnitTopicPath(campus, building, system, unoccCoolMetric, topicMap);

    const topics: Record<string, string> = {
      [tempMetric]: tempPath,
      [occMetric]: occupancyPath,
      [occHeatMetric]: occHeatPath,
      [occCoolMetric]: occCoolPath,
      [unoccHeatMetric]: unoccHeatPath,
      [unoccCoolMetric]: unoccCoolPath,
    };

    // Setpoint-error always bins because the per-bucket walk in
    // computeBucketErrorSeries needs a fixed grid. The width is also floored
    // (see `deriveSetpointErrorBucketInterval`) so short ranges don't pick a
    // grid finer than the RTU sampling cadence.
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
      const setpointIds: number[] = [
        pathToId.get(occHeatPath),
        pathToId.get(occCoolPath),
        pathToId.get(unoccHeatPath),
        pathToId.get(unoccCoolPath),
      ].filter((id): id is number => id !== undefined);

      if (tempId === undefined) {
        errors.push(`Topic not found: ${tempPath}`);
        // Don't bail out — fall through with no temp samples so the bucket
        // grid still gets emitted (all-null), and the client renders the
        // system as a continuous "Unknown" row instead of an empty y-axis
        // category.
      }

      // Three small, index-friendly queries run in parallel — each a pure
      // PK(topic_id, ts) range scan.
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

      const tempPromise =
        tempId !== undefined
          ? this.pool.query<{ bucket: Date | string; temp_value: number | string | null }>(tempQuery, [
              startTime,
              endTime,
              bucketInterval.sql,
              tempId,
            ])
          : Promise.resolve({ rows: [] as Array<{ bucket: Date | string; temp_value: number | string | null }> });
      const setpointPromise =
        setpointIds.length > 0
          ? this.pool.query<{ topic_id: number; ts: Date | string; sp_value: number | string | null }>(setpointQuery, [
              startTime,
              endTime,
              setpointIds,
            ])
          : Promise.resolve({
              rows: [] as Array<{ topic_id: number; ts: Date | string; sp_value: number | string | null }>,
            });
      const occupancyPromise =
        occupancyId !== undefined
          ? this.pool.query<{ ts: Date | string; occ_value: number | string | null }>(occupancyQuery, [
              startTime,
              endTime,
              occupancyId,
            ])
          : Promise.resolve({ rows: [] as Array<{ ts: Date | string; occ_value: number | string | null }> });

      const [tempResult, setpointResult, occupancyResult] = await Promise.all([
        tempPromise,
        setpointPromise,
        occupancyPromise,
      ]);

      const tempByBucket = new Map<number, number>();
      for (const row of tempResult.rows) {
        const bucketMs = row.bucket instanceof Date ? row.bucket.getTime() : new Date(row.bucket).getTime();
        const v = HistorianService.toNumber(row.temp_value);
        if (v != null) tempByBucket.set(bucketMs, v);
      }

      const occHeatId = pathToId.get(occHeatPath);
      const occCoolId = pathToId.get(occCoolPath);
      const unoccHeatId = pathToId.get(unoccHeatPath);
      const unoccCoolId = pathToId.get(unoccCoolPath);
      const occHeat: Array<{ t: number; v: number }> = [];
      const occCool: Array<{ t: number; v: number }> = [];
      const unoccHeat: Array<{ t: number; v: number }> = [];
      const unoccCool: Array<{ t: number; v: number }> = [];
      for (const row of setpointResult.rows) {
        const v = HistorianService.toNumber(row.sp_value);
        if (v == null) continue;
        const t = row.ts instanceof Date ? row.ts.getTime() : new Date(row.ts).getTime();
        const sample = { t, v };
        if (row.topic_id === occHeatId) occHeat.push(sample);
        else if (row.topic_id === occCoolId) occCool.push(sample);
        else if (row.topic_id === unoccHeatId) unoccHeat.push(sample);
        else if (row.topic_id === unoccCoolId) unoccCool.push(sample);
      }

      const occupancies = occupancyResult.rows
        .map((r) => ({
          t: r.ts instanceof Date ? r.ts.getTime() : new Date(r.ts).getTime(),
          v: HistorianService.toNumber(r.occ_value),
        }))
        .filter((o): o is { t: number; v: number } => o.v != null);

      const startMs = startTime.getTime();
      const endMs = endTime.getTime();
      const series = HistorianService.computeBucketErrorSeries({
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

      const data: HistorianDataPoint[] = series.map((pt) => ({
        timestamp: new Date(pt.bucketMs),
        value: pt.value,
        system,
        metric: tempMetric,
      }));

      if (data.every((d) => d.value == null)) {
        errors.push(
          `No setpoint error data found for ${system} in time range ${startTime.toISOString()} to ${endTime.toISOString()}`,
        );
      }

      return {
        system,
        metric: tempMetric,
        data,
        metadata: {
          topics,
          errors,
          binning: HistorianService.buildBinningInfo({
            mode: "binned",
            sql: bucketInterval.sql,
            ms: bucketInterval.ms,
          }),
          aggregation: MetricAggregation.Mean,
        },
      };
    } catch (error) {
      this.logger.error("Error calculating setpoint error", error);
      errors.push(`Query error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Keep the replication methods as they are system-agnostic
  private async isProxyCertificateSelfSigned(): Promise<boolean> {
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
        const cert = (res.socket as tls.TLSSocket).getPeerCertificate();

        if (!cert || Object.keys(cert).length === 0) {
          this.logger.debug("No certificate found, defaulting to sslmode=prefer");
          resolve(true);
          return;
        }

        const isSelfSigned =
          cert.issuer && cert.subject && JSON.stringify(cert.issuer) === JSON.stringify(cert.subject);

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

  private async ensureTablesInPublication(): Promise<void> {
    try {
      const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('data', 'topics')
      `;
      const tableResult = await this.pool.query<{ table_name: string }>(tableCheckQuery);
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
      const pubTablesResult = await this.pool.query<{ tablename: string }>(pubTablesQuery);
      const publishedTables = pubTablesResult.rows.map((row) => row.tablename);

      const missingTables = existingTables.filter((table) => !publishedTables.includes(table));

      if (missingTables.length > 0) {
        for (const table of missingTables) {
          const addTableQuery = `ALTER PUBLICATION historian_pub ADD TABLE ${table}`;
          await this.pool.query(addTableQuery);
        }
      }
    } catch (error) {
      this.logger.error("Error ensuring tables in publication", error);
    }
  }

  async getSystemPublishingStatus(): Promise<SystemPublishingStatus[]> {
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

      const result = await this.pool.query<{ topic_name: string; last_published: string }>(query);
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

          let status: "active" | "stale" | "inactive";
          if (minutesAgo < 5) {
            status = "active";
          } else if (minutesAgo < 60) {
            status = "stale";
          } else {
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
    } catch (error) {
      this.logger.error("Error fetching system publishing status", error);
      throw error;
    }
  }

  async getReplicationInfo(): Promise<HistorianReplicationInfo> {
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
      const pubResult = await this.pool.query<{ pubname: string; tables: string[] }>(pubQuery);

      const publicationName = pubResult.rows[0]?.pubname || "historian_pub";
      const publishedTables = pubResult.rows[0]?.tables || [];

      const connQuery = `
        SELECT COUNT(*) as count
        FROM pg_stat_replication
        WHERE application_name LIKE '%historian%'
      `;
      const connResult = await this.pool.query<{ count: number | string | null }>(connQuery);
      const activeConnections =
        typeof connResult.rows[0]?.count === "string"
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
      const slotsResult = await this.pool.query<{
        slot_name: string;
        plugin: string;
        slot_type: string;
        active: boolean;
        restart_lsn: string;
        confirmed_flush_lsn: string;
      }>(slotsQuery);

      const replicationSlots: ReplicationSlot[] = slotsResult.rows.map((row) => ({
        slotName: row.slot_name,
        plugin: row.plugin,
        slotType: row.slot_type,
        active: row.active,
        restartLsn: row.restart_lsn,
        confirmedFlushLsn: row.confirmed_flush_lsn,
      }));

      // Use pg_dump to get the complete, accurate schema
      const { historian } = this.configService;
      const host = historian.host || "localhost";
      const port = historian.port || 5432;
      const database = historian.name || "historian";
      const username = historian.username || "postgres";
      const password = historian.password || "";

      // Query for sequences referenced by the tables first
      // Sequences are independent objects that need to be explicitly included in pg_dump
      const sequenceQuery = `
        SELECT DISTINCT
          substring(c.column_default from 'nextval\\(''([^'']+)''') as sequence_name
        FROM information_schema.columns c
        WHERE c.table_name IN ('data', 'topics')
          AND c.column_default LIKE '%nextval%'
        ORDER BY 1
      `;
      let sequenceNames: string[] = [];
      try {
        const sequenceResult = await this.pool.query<{ sequence_name: string | null }>(sequenceQuery);
        sequenceNames = sequenceResult.rows
          .map((row) => row.sequence_name)
          .filter((name): name is string => name !== null);
      } catch (seqError: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.warn(`Failed to query sequences: ${seqError?.message || seqError}`);
      }

      // Build pg_dump command for schema only, targeting tables and their sequences
      const tableArgs = ["-t data", "-t topics", ...sequenceNames.map((seq) => `-t ${seq}`)].join(" ");
      const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --schema-only ${tableArgs}`;

      let pgDumpOutput = "";
      try {
        const { stdout } = await execAsync(pgDumpCommand, {
          env: { ...process.env, PGPASSWORD: password },
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });
        pgDumpOutput = stdout;
      } catch (dumpError: any) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.warn(`pg_dump failed, falling back to manual schema generation: ${dumpError?.message}`);
        // Fallback to manual schema generation if pg_dump is not available
        pgDumpOutput = "";
      }

      let createTablesSql = "";
      let createConstraintsSql = "";
      let createIndexesSql = "";

      if (pgDumpOutput) {
        // Parse pg_dump output into sections
        const lines = pgDumpOutput.split("\n");
        const sequenceLines: string[] = [];
        const tableLines: string[] = [];
        const constraintLines: string[] = [];
        const indexLines: string[] = [];
        let currentSection: "sequence" | "table" | "constraint" | "index" | "skip" = "skip";
        let currentStatement = "";

        for (const line of lines) {
          // Skip comments and SET commands
          if (line.startsWith("--") || line.match(/^SET /i) || line.match(/^SELECT pg_catalog/i)) {
            continue;
          }

          // Detect section starts
          if (line.match(/^CREATE SEQUENCE/i)) {
            currentSection = "sequence";
            // Make sequence creation idempotent
            currentStatement = line.replace(/^CREATE SEQUENCE/i, "CREATE SEQUENCE IF NOT EXISTS");
          } else if (line.match(/^CREATE TABLE/i)) {
            currentSection = "table";
            // Make it idempotent
            currentStatement = line.replace(/^CREATE TABLE/i, "CREATE TABLE IF NOT EXISTS");
          } else if (line.match(/^ALTER TABLE .* ADD CONSTRAINT/i) && line.match(/PRIMARY KEY/i)) {
            currentSection = "constraint";
            currentStatement = line;
          } else if (line.match(/^CREATE .*INDEX/i)) {
            currentSection = "index";
            currentStatement = line;
          } else if (line.trim() === "") {
            // Empty line - end of statement
            if (currentStatement && currentSection !== "skip") {
              if (currentSection === "sequence") {
                sequenceLines.push(currentStatement);
              } else if (currentSection === "table") {
                tableLines.push(currentStatement);
              } else if (currentSection === "constraint") {
                constraintLines.push(currentStatement);
              } else if (currentSection === "index") {
                indexLines.push(currentStatement);
              }
            }
            currentStatement = "";
            currentSection = "skip";
          } else {
            // Continue current statement
            if (currentSection !== "skip") {
              currentStatement += "\n" + line;
            }
          }
        }

        // Capture any remaining statement
        if (currentStatement && currentSection !== "skip") {
          if (currentSection === "sequence") {
            sequenceLines.push(currentStatement);
          } else if (currentSection === "table") {
            tableLines.push(currentStatement);
          } else if (currentSection === "constraint") {
            constraintLines.push(currentStatement);
          } else if (currentSection === "index") {
            indexLines.push(currentStatement);
          }
        }

        // CRITICAL: Sequences must come before tables
        createTablesSql = [...sequenceLines, ...tableLines].join("\n\n");
        createConstraintsSql = constraintLines.join("\n");
        createIndexesSql = indexLines.join("\n");
      }

      // Fallback to manual queries if pg_dump output is empty or parsing failed
      if (!createTablesSql) {
        // Query for sequences - find any sequences referenced in column defaults
        const sequenceQuery = `
          SELECT DISTINCT
            substring(c.column_default from 'nextval\\(''([^'']+)''') as sequence_name
          FROM information_schema.columns c
          WHERE c.table_name IN ('data', 'topics')
            AND c.column_default LIKE '%nextval%'
          ORDER BY 1
        `;
        const sequenceResult = await this.pool.query<{ sequence_name: string | null }>(sequenceQuery);

        const createSequencesSql = sequenceResult.rows
          .filter((row) => row.sequence_name !== null)
          .map((row) => `CREATE SEQUENCE IF NOT EXISTS ${row.sequence_name};`)
          .join("\n");

        // Query for table schema
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
        const schemaResult = await this.pool.query<{ table_name: string; columns: string }>(tableSchemaQuery);

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
        const pkResult = await this.pool.query<{ table_name: string; pk_columns: string }>(pkQuery);

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
        const idxResult = await this.pool.query<{ idx: string }>(idxQuery);

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
    } catch (error) {
      this.logger.error("Error fetching replication info", error);
      throw error;
    }
  }
}
