/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool, QueryResult as PgQueryResult } from "pg";
import { Inject } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import * as tls from "tls";
import * as https from "https";
import {
  HistorianDataPoint,
  HistorianTimeSeries,
  HistorianAggregate,
  HistorianMetricCurrent,
  AggregationType,
  CalculationType,
  HistorianReplicationInfo,
  PublisherInfo,
  SubscriberSetupSql,
  MonitoringSql,
  ReplicationSlot,
  UnitPublishingStatus,
} from "./historian.types";

// Re-export types for convenience
export {
  HistorianDataPoint,
  HistorianTimeSeries,
  HistorianAggregate,
  HistorianMetricCurrent,
  AggregationType,
  CalculationType,
  HistorianReplicationInfo,
  PublisherInfo,
  SubscriberSetupSql,
  MonitoringSql,
  ReplicationSlot,
  UnitPublishingStatus,
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
  private buildTopicPattern(topicPattern: string, campus?: string, building?: string, unit?: string): string {
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

    const patterns = topicPatterns.map((pattern) => this.buildTopicPattern(pattern, campus, building, unit));

    // Build query to get latest value for each topic pattern
    const query = `
      WITH latest_data AS (
        SELECT DISTINCT ON (topic_name)
          ts,
          value_string,
          topic_name
        FROM data
        NATURAL JOIN topics
        WHERE ${patterns.map((_, i) => `topic_name ILIKE $${i + 1}`).join(" OR ")}
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
        topic: row.topic_name as string,
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

    const patterns = topicPatterns.map((pattern) => this.buildTopicPattern(pattern, campus, building, unit));

    const query = `
      SELECT
        ts AS timestamp,
        value_string,
        topic_name
      FROM data
      NATURAL JOIN topics
      WHERE (${patterns.map((_, i) => `topic_name ILIKE $${i + 1}`).join(" OR ")})
        AND ts >= $${patterns.length + 1}
        AND ts <= $${patterns.length + 2}
      ORDER BY topic_name, ts
    `;

    try {
      const result: PgQueryResult = await this.pool.query(query, [...patterns, startTime, endTime]);

      // Group data by topic name
      const grouped: Record<string, HistorianDataPoint[]> = result.rows.reduce(
        (acc: Record<string, HistorianDataPoint[]>, row: any) => {
          const topic = row.topic_name as string;
          if (!acc[topic]) {
            acc[topic] = [];
          }
          acc[topic].push({
            timestamp: new Date(row.timestamp as string),
            value: this.parseValue(row.value_string as string | null),
            topic: row.topic_name as string,
          });
          return acc;
        },
        {} as Record<string, HistorianDataPoint[]>,
      );

      return Object.entries(grouped).map(([topic, data]) => ({
        topic,
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

    const [, , intervalUnit] = intervalMatch;
    const intervalMap: Record<string, string> = {
      s: "seconds",
      m: "minutes",
      h: "hours",
      d: "days",
    };
    // const pgInterval = `${amount} ${intervalMap[intervalUnit]}`;

    const aggFunction = aggregation.toLowerCase();
    const valueExpr =
      aggregation === AggregationType.COUNT ? "*" : "CAST(NULLIF(value_string, 'null') AS double precision)";

    // Use date_trunc for standard PostgreSQL, or time_bucket if TimescaleDB is available
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

    const patterns = units.map((unit) => this.buildTopicPattern(topicPattern, campus, building, unit));

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
      WHERE (${patterns.map((_, i) => `topic_name ILIKE $${i + 1}`).join(" OR ")})
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
            topic: unit,
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
        return this.calculateSetpointError(topicPatterns, startTime, endTime, campus, building, unit);
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
      const result: PgQueryResult = await this.pool.query(query, [tempPattern, setpointPattern, startTime, endTime]);

      return result.rows.map((row: any) => ({
        timestamp: new Date(row.timestamp as string),
        value: row.value !== null ? parseFloat(row.value as string) : null,
        topic: "setpoint_error",
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
      WHERE topic_name ILIKE $1
        AND ts >= $2
        AND ts <= $3
      ORDER BY ts
    `;

    try {
      const result: PgQueryResult = await this.pool.query(query, [pattern, startTime, endTime]);

      return result.rows.map((row: any) => ({
        timestamp: new Date(row.timestamp as string),
        value: row.value !== null ? parseFloat(row.value as string) : null,
        topic: `${pattern}_rolling_avg`,
      }));
    } catch (error) {
      this.logger.error("Error calculating rolling average", error);
      throw error;
    }
  }

  /**
   * Check if the proxy certificate is self-signed
   * Returns true if self-signed, false if signed by CA
   */
  private async isProxyCertificateSelfSigned(): Promise<boolean> {
    return new Promise((resolve) => {
      const { proxy } = this.configService;
      const host = proxy.host || "localhost";
      const port = parseInt(proxy.port || "443");

      // If not using HTTPS proxy, default to prefer (safer option)
      if (proxy.protocol !== "https") {
        this.logger.debug("Proxy is not HTTPS, defaulting to sslmode=prefer");
        resolve(true);
        return;
      }

      const options = {
        host,
        port,
        method: "GET",
        rejectUnauthorized: false, // Allow self-signed certs for inspection
      };

      const req = https.request(options, (res) => {
        const cert = (res.socket as tls.TLSSocket).getPeerCertificate();

        if (!cert || Object.keys(cert).length === 0) {
          this.logger.debug("No certificate found, defaulting to sslmode=prefer");
          resolve(true);
          return;
        }

        // Check if issuer equals subject (self-signed)
        const isSelfSigned =
          cert.issuer && cert.subject && JSON.stringify(cert.issuer) === JSON.stringify(cert.subject);

        this.logger.debug(`Certificate is ${isSelfSigned ? "self-signed" : "CA-signed"}`);
        resolve(isSelfSigned);
      });

      req.on("error", (error) => {
        this.logger.warn(`Failed to check proxy certificate: ${error.message}, defaulting to sslmode=prefer`);
        resolve(true); // Default to prefer on error (safer)
      });

      req.setTimeout(5000, () => {
        req.destroy();
        this.logger.warn("Certificate check timed out, defaulting to sslmode=prefer");
        resolve(true);
      });

      req.end();
    });
  }

  /**
   * Ensure tables are added to publication if they exist but aren't published
   * This handles the timing issue where tables are created after publication
   */
  private async ensureTablesInPublication(): Promise<void> {
    try {
      // Check if data and topics tables exist
      const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('data', 'topics')
      `;
      const tableResult: PgQueryResult = await this.pool.query(tableCheckQuery);
      const existingTables = tableResult.rows.map((row: any) => row.table_name as string);

      if (existingTables.length === 0) {
        this.logger.debug("No historian tables exist yet");
        return;
      }

      // Check which tables are already in the publication
      const pubTablesQuery = `
        SELECT tablename 
        FROM pg_publication_tables 
        WHERE pubname = 'historian_pub'
      `;
      const pubTablesResult: PgQueryResult = await this.pool.query(pubTablesQuery);
      const publishedTables = pubTablesResult.rows.map((row: any) => row.tablename as string);

      // Find tables that exist but aren't published
      const missingTables = existingTables.filter((table) => !publishedTables.includes(table));

      if (missingTables.length > 0) {
        this.logger.log(`Adding missing tables to publication: ${missingTables.join(", ")}`);

        // Add each missing table to the publication
        for (const table of missingTables) {
          const addTableQuery = `ALTER PUBLICATION historian_pub ADD TABLE ${table}`;
          await this.pool.query(addTableQuery);
          this.logger.log(`Added table '${table}' to historian_pub`);
        }
      } else {
        this.logger.debug("All existing tables are already in publication");
      }
    } catch (error) {
      this.logger.error("Error ensuring tables in publication", error);
      // Don't throw - this is a non-critical operation that shouldn't break the info retrieval
    }
  }

  /**
   * Get unit publishing status - shows which units are actively publishing data
   */
  async getUnitPublishingStatus(): Promise<UnitPublishingStatus[]> {
    try {
      // Whitelists for valid campus and building names
      const validCampuses = new Set(["PNNL", "CAMPUS2", "CAMPUS3"]); // Add more as needed
      const validBuildings = new Set(["ROB", "ETB", "PSF", "BUILDING2"]); // Add more as needed

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

      const result: PgQueryResult = await this.pool.query(query);
      const now = new Date();

      return result.rows
        .map((row: any) => {
          const topicName = row.topic_name as string;
          const parts = topicName.split("/");

          let campus = "";
          let building = "";
          let topic = topicName;
          let remainingParts = [...parts];

          // Search for valid campus in parts
          for (let i = 0; i < parts.length; i++) {
            if (validCampuses.has(parts[i])) {
              campus = parts[i];
              remainingParts = parts.slice(i + 1);
              break;
            }
          }

          // Search for valid building in remaining parts
          if (campus && remainingParts.length > 0) {
            for (let i = 0; i < remainingParts.length; i++) {
              if (validBuildings.has(remainingParts[i])) {
                building = remainingParts[i];
                remainingParts = remainingParts.slice(i + 1);
                break;
              }
            }
          }

          // Extract topic identifier (remaining parts or full topic if no matches)
          if (campus || building) {
            topic = remainingParts.length > 0 ? remainingParts.join("/") : parts[parts.length - 1];
          }

          const lastPublished = new Date(row.last_published as string);
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
            unit: topic, // Keep unit for backward compatibility
            topic,
            lastPublished,
            minutesAgo,
            status,
          };
        })
        .filter((record) => record.campus && record.building); // Only include records with valid campus AND building
    } catch (error) {
      this.logger.error("Error fetching unit publishing status", error);
      throw error;
    }
  }

  /**
   * Get historian database replication information
   * Returns publisher info, subscriber setup SQL, and monitoring queries
   */
  async getReplicationInfo(): Promise<HistorianReplicationInfo> {
    try {
      // Ensure tables are added to publication if they exist but aren't published
      await this.ensureTablesInPublication();

      // Get publication info
      const pubQuery = `
        SELECT 
          p.pubname,
          array_agg(pt.schemaname || '.' || pt.tablename) as tables
        FROM pg_publication p
        LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
        WHERE p.pubname = 'historian_pub'
        GROUP BY p.pubname
      `;
      const pubResult: PgQueryResult = await this.pool.query(pubQuery);

      const publicationName = (pubResult.rows[0]?.pubname as string) || "historian_pub";
      const publishedTables = (pubResult.rows[0]?.tables as string[]) || [];

      // Get active replication connections
      const connQuery = `
        SELECT COUNT(*) as count
        FROM pg_stat_replication
        WHERE application_name LIKE '%historian%'
      `;
      const connResult: PgQueryResult = await this.pool.query(connQuery);
      const activeConnections = parseInt((connResult.rows[0]?.count as string) || "0");

      // Get replication slots
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
      const slotsResult: PgQueryResult = await this.pool.query(slotsQuery);

      const replicationSlots: ReplicationSlot[] = slotsResult.rows.map((row: any) => ({
        slotName: row.slot_name as string,
        plugin: row.plugin as string,
        slotType: row.slot_type as string,
        active: row.active as boolean,
        restartLsn: row.restart_lsn as string,
        confirmedFlushLsn: row.confirmed_flush_lsn as string,
      }));

      // Generate CREATE TABLE SQL for all published tables
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
      const schemaResult: PgQueryResult = await this.pool.query(tableSchemaQuery);

      const createTablesSql = schemaResult.rows
        .map((row: any) => `CREATE TABLE IF NOT EXISTS ${row.table_name} (\n${row.columns}\n);`)
        .join("\n\n");

      // Generate PRIMARY KEY constraints
      const pkQuery = `
        SELECT 
          tc.table_name,
          string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as pk_columns
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' 
          AND tc.table_schema = 'public'
          AND tc.table_name IN ('data', 'topics')
        GROUP BY tc.table_name
        ORDER BY tc.table_name
      `;
      const pkResult: PgQueryResult = await this.pool.query(pkQuery);

      const createConstraintsSql = pkResult.rows
        .map((row: any) => `ALTER TABLE ${row.table_name} ADD PRIMARY KEY (${row.pk_columns});`)
        .join("\n");

      // Generate INDEX creation
      const idxQuery = `
        SELECT indexdef || ';' as idx
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('data', 'topics')
          AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
      `;
      const idxResult: PgQueryResult = await this.pool.query(idxQuery);

      const createIndexesSql = idxResult.rows
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        .map((row: any) => row.idx)
        .join("\n");

      // Check if certificate is self-signed and set SSL mode accordingly
      const isSelfSigned = await this.isProxyCertificateSelfSigned();
      const sslMode = isSelfSigned ? "prefer" : "require";

      this.logger.log(`Using sslmode=${sslMode} for historian replication`);

      // Generate subscription template with dynamic SSL mode and replication port
      // Hostname placeholder will be replaced by client-side code with window.location.hostname
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

      // Monitoring SQL queries
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

      // Get unit publishing status
      const unitPublishingStatus = await this.getUnitPublishingStatus();

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
        unitPublishingStatus,
      };
    } catch (error) {
      this.logger.error("Error fetching replication info", error);
      throw error;
    }
  }
}
