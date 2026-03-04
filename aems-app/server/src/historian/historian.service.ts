/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool, QueryResult as PgQueryResult } from "pg";
import { Inject } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import {
  HistorianDataPoint,
  HistorianTimeSeries,
  HistorianAggregate,
  HistorianMetricCurrent,
  AggregationType,
  CalculationType,
} from "./historian.types";

// Re-export types for convenience
export {
  HistorianDataPoint,
  HistorianTimeSeries,
  HistorianAggregate,
  HistorianMetricCurrent,
  AggregationType,
  CalculationType,
};

export interface UnitAccess {
  campus: string;
  building: string;
  unit: string;
}

export interface HistorianAccessControl {
  allowedUnits: UnitAccess[];
  isEmpty: boolean;
}

@Injectable()
export class HistorianService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(HistorianService.name);
  private pool: Pool;

  constructor(
    @Inject(AppConfigService.Key) configService: AppConfigService,
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
        max: 20, // Maximum number of clients in the pool
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
      // Test the connection
      const client = await this.pool.connect();
      this.logger.log("Successfully connected to historian database");
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
   * Filter historian query parameters based on user's unit assignments
   * Returns filtered parameters or null if user is admin (no filtering needed)
   */
  async filterHistorianAccess(
    userId: string | undefined,
    isAdmin: boolean,
    requestedCampus?: string,
    requestedBuilding?: string,
    requestedUnit?: string | string[],
  ): Promise<HistorianAccessControl | null> {
    // Admin bypass - full access
    if (isAdmin) {
      return null; // null means no filtering needed
    }

    // No user = no access
    if (!userId) {
      return { allowedUnits: [], isEmpty: true };
    }

    // Fetch user's assigned units with optional campus/building filtering
    const whereClause: {
      users: { some: { id: string } };
      campus?: string;
      building?: string;
    } = {
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

    // If specific unit(s) requested, filter to only authorized ones
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

    // No specific unit requested - return all authorized units for the campus/building
    return {
      allowedUnits: userUnits.map((u) => ({
        campus: u.campus,
        building: u.building,
        unit: u.name,
      })),
      isEmpty: false,
    };
  }

  /**
   * Build topic name pattern for SQL LIKE clause
   */
  private buildTopicPattern(
    topicPattern: string,
    campus?: string,
    building?: string,
    unit?: string,
  ): string {
    let pattern = topicPattern;
    
    // Replace placeholders with actual values or wildcards
    if (campus) {
      pattern = pattern.replace("%CAMPUS%", campus);
    } else {
      pattern = pattern.replace("%CAMPUS%", "%");
    }
    
    if (building) {
      pattern = pattern.replace("%BUILDING%", building);
    } else {
      pattern = pattern.replace("%BUILDING%", "%");
    }
    
    if (unit) {
      pattern = pattern.replace("%UNIT%", unit);
    } else {
      pattern = pattern.replace("%UNIT%", "%");
    }
    
    return pattern;
  }

  /**
   * Parse value_string to float, handling 'null' strings
   */
  private parseValue(valueString: string | null): number | null {
    if (valueString === null || valueString === "null") {
      return null;
    }
    const parsed = parseFloat(valueString);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Get current (latest) values for multiple topic patterns
   */
  async getCurrentValues(
    topicPatterns: string[],
    campus?: string,
    building?: string,
    unit?: string,
  ): Promise<HistorianMetricCurrent[]> {
    if (topicPatterns.length === 0) {
      return [];
    }

    const patterns = topicPatterns.map((pattern) =>
      this.buildTopicPattern(pattern, campus, building, unit),
    );

    // Build query to get latest value for each topic pattern
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
      const result: PgQueryResult = await this.pool.query(query, patterns);
      
      return result.rows.map((row: any) => ({
        topicName: row.topic_name as string,
        value: this.parseValue(row.value_string as string | null),
        timestamp: new Date(row.timestamp as string),
      }));
    } catch (error) {
      this.logger.error("Error fetching current values", error);
      throw error;
    }
  }

  /**
   * Get time series data for multiple topic patterns
   */
  async getTimeSeries(
    topicPatterns: string[],
    startTime: Date,
    endTime: Date,
    campus?: string,
    building?: string,
    unit?: string,
  ): Promise<HistorianTimeSeries[]> {
    if (topicPatterns.length === 0) {
      return [];
    }

    const patterns = topicPatterns.map((pattern) =>
      this.buildTopicPattern(pattern, campus, building, unit),
    );

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
      const result: PgQueryResult = await this.pool.query(query, [...patterns, startTime, endTime]);
      
      // Group data by topic name
      const grouped: Record<string, HistorianDataPoint[]> = result.rows.reduce(
        (acc: Record<string, HistorianDataPoint[]>, row: any) => {
          const topicName = row.topic_name as string;
          if (!acc[topicName]) {
            acc[topicName] = [];
          }
          acc[topicName].push({
            timestamp: new Date(row.timestamp as string),
            value: this.parseValue(row.value_string as string | null),
            topicName: row.topic_name as string,
          });
          return acc;
        },
        {} as Record<string, HistorianDataPoint[]>,
      );

      return Object.entries(grouped).map(([topicName, data]) => ({
        topicName,
        data,
      }));
    } catch (error) {
      this.logger.error("Error fetching time series data", error);
      throw error;
    }
  }

  /**
   * Get aggregated data with time grouping
   * Note: Requires TimescaleDB extension for time_bucket function
   */
  async getAggregated(
    topicPattern: string,
    startTime: Date,
    endTime: Date,
    interval: string,
    aggregation: AggregationType,
    campus?: string,
    building?: string,
    unit?: string,
  ): Promise<HistorianAggregate[]> {
    const pattern = this.buildTopicPattern(topicPattern, campus, building, unit);

    // Validate and sanitize interval (e.g., '1m', '5m', '1h')
    const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
    if (!intervalMatch) {
      throw new Error("Invalid interval format. Use format like '1m', '5m', '1h', etc.");
    }

    const [,, intervalUnit] = intervalMatch;
    const intervalMap: Record<string, string> = {
      s: "seconds",
      m: "minutes",
      h: "hours",
      d: "days",
    };
    // const pgInterval = `${amount} ${intervalMap[intervalUnit]}`;

    const aggFunction = aggregation.toLowerCase();
    const valueExpr =
      aggregation === AggregationType.COUNT
        ? "*"
        : "CAST(NULLIF(value_string, 'null') AS double precision)";

    // Use date_trunc for standard PostgreSQL, or time_bucket if TimescaleDB is available
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
      const result: PgQueryResult = await this.pool.query(query, [pattern, startTime, endTime]);
      
      return result.rows.map((row: any) => ({
        timestamp: new Date(row.timestamp as string),
        value: row.value !== null ? parseFloat(row.value as string) : null,
        topicPattern: pattern,
      }));
    } catch (error) {
      this.logger.error("Error fetching aggregated data", error);
      throw error;
    }
  }

  /**
   * Get multi-unit data for state timelines
   */
  async getMultiUnit(
    topicPattern: string,
    units: string[],
    startTime: Date,
    endTime: Date,
    interval?: string,
    campus?: string,
    building?: string,
  ): Promise<Record<string, HistorianDataPoint[]>> {
    if (units.length === 0) {
      return {};
    }

    // Build CASE statements for each unit
    const caseStatements = units.map((unit, i) => {
      return `MAX(CASE WHEN topic_name LIKE $${i + 1} THEN CAST(NULLIF(value_string, 'null') AS double precision) END) AS "${unit}"`;
    });

    const patterns = units.map((unit) =>
      this.buildTopicPattern(topicPattern, campus, building, unit),
    );

    let timeGroup = "ts";
    const params: (string | Date)[] = [...patterns, startTime, endTime];

    if (interval) {
      const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
      if (!intervalMatch) {
        throw new Error("Invalid interval format. Use format like '1m', '5m', '1h', etc.");
      }
      const [, , intervalUnit] = intervalMatch;
      const intervalMap: Record<string, string> = {
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
      const result: PgQueryResult = await this.pool.query(query, params);
      
      // Transform to expected format
      const grouped: Record<string, HistorianDataPoint[]> = {};
      units.forEach((unit) => {
        grouped[unit] = [];
      });

      result.rows.forEach((row: any) => {
        const timestamp = new Date(row.timestamp as string);
        units.forEach((unit) => {
          grouped[unit].push({
            timestamp,
            value: row[unit] !== null ? parseFloat(row[unit] as string) : null,
            topicName: unit,
          });
        });
      });

      return grouped;
    } catch (error) {
      this.logger.error("Error fetching multi-unit data", error);
      throw error;
    }
  }

  /**
   * Get calculated metrics (e.g., setpoint errors, rolling averages)
   */
  async getCalculated(
    calculation: CalculationType,
    topicPatterns: string[],
    startTime: Date,
    endTime: Date,
    campus?: string,
    building?: string,
    unit?: string,
    options?: Record<string, string>,
  ): Promise<HistorianDataPoint[]> {
    switch (calculation) {
      case CalculationType.SETPOINT_ERROR:
        return this.calculateSetpointError(
          topicPatterns,
          startTime,
          endTime,
          campus,
          building,
          unit,
        );
      case CalculationType.ROLLING_AVERAGE:
        return this.calculateRollingAverage(
          topicPatterns[0],
          startTime,
          endTime,
          options?.window || "30 minutes",
          campus,
          building,
          unit,
        );
      default:
        throw new Error(`Unsupported calculation type: ${calculation as any}`);
    }
  }

  /**
   * Calculate setpoint error (zone temp - setpoint)
   */
  private async calculateSetpointError(
    topicPatterns: string[],
    startTime: Date,
    endTime: Date,
    campus?: string,
    building?: string,
    unit?: string,
  ): Promise<HistorianDataPoint[]> {
    if (topicPatterns.length !== 2) {
      throw new Error("Setpoint error calculation requires exactly 2 topic patterns");
    }

    const [tempPattern, setpointPattern] = topicPatterns.map((pattern) =>
      this.buildTopicPattern(pattern, campus, building, unit),
    );

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
      const result: PgQueryResult = await this.pool.query(query, [tempPattern, setpointPattern, startTime, endTime]);
      
      return result.rows.map((row: any) => ({
        timestamp: new Date(row.timestamp as string),
        value: row.value !== null ? parseFloat(row.value as string) : null,
        topicName: "setpoint_error",
      }));
    } catch (error) {
      this.logger.error("Error calculating setpoint error", error);
      throw error;
    }
  }

  /**
   * Calculate rolling average
   */
  private async calculateRollingAverage(
    topicPattern: string,
    startTime: Date,
    endTime: Date,
    window: string,
    campus?: string,
    building?: string,
    unit?: string,
  ): Promise<HistorianDataPoint[]> {
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
      const result: PgQueryResult = await this.pool.query(query, [pattern, startTime, endTime]);
      
      return result.rows.map((row: any) => ({
        timestamp: new Date(row.timestamp as string),
        value: row.value !== null ? parseFloat(row.value as string) : null,
        topicName: `${pattern}_rolling_avg`,
      }));
    } catch (error) {
      this.logger.error("Error calculating rolling average", error);
      throw error;
    }
  }
}
