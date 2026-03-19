import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";
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
  SystemPublishingStatus,
} from "@local/common";
import { UnitMetric, WeatherMetric, buildUnitTopicPath, buildWeatherTopicPath } from "./metrics";

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
  SystemPublishingStatus,
  UnitMetric,
  WeatherMetric,
};

export interface SystemAccess {
  campus: string;
  building: string;
  system: string;
}

export interface HistorianAccessControl {
  allowedSystems: SystemAccess[];
  isEmpty: boolean;
}

interface HistorianDataRow {
  ts: string;
  topic_id: number;
  value_string: string;
}

interface HistorianTopicRow {
  topic_id: number;
  topic_name: string;
  metadata: string | null;
}

interface HistorianJoinedRow extends HistorianDataRow, HistorianTopicRow {}

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
   * Filter historian query parameters based on user's system assignments
   */
  async filterHistorianAccess(
    userId: string | undefined,
    isAdmin: boolean,
    requestedCampus?: string,
    requestedBuilding?: string,
    requestedSystem?: string | string[],
  ): Promise<HistorianAccessControl | null> {
    if (isAdmin) {
      return null;
    }

    if (!userId) {
      return { allowedSystems: [], isEmpty: true };
    }

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

    const userSystems = await this.prismaService.prisma.unit.findMany({
      where: whereClause,
      select: { campus: true, building: true, system: true },
    });

    if (userSystems.length === 0) {
      return { allowedSystems: [], isEmpty: true };
    }

    if (requestedSystem) {
      const requestedSystems = Array.isArray(requestedSystem) ? requestedSystem : [requestedSystem];
      const allowedSystems = userSystems
        .filter((s) => requestedSystems.includes(s.system))
        .map((s) => ({ campus: s.campus, building: s.building, system: s.system }));

      return {
        allowedSystems,
        isEmpty: allowedSystems.length === 0,
      };
    }

    return {
      allowedSystems: userSystems.map((s) => ({
        campus: s.campus,
        building: s.building,
        system: s.system,
      })),
      isEmpty: false,
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
   * Get current value for a unit metric
   */
  async getUnitCurrentValue(
    campus: string,
    building: string,
    system: string,
    metric: UnitMetric,
  ): Promise<HistorianMetricCurrent | null> {
    const topicPath = buildUnitTopicPath(campus, building, system, metric);

    const query = `
      SELECT
        ts,
        value_string,
        topic_name
      FROM data
      NATURAL JOIN topics
      WHERE topic_name = $1
      ORDER BY ts DESC
      LIMIT 1
    `;

    try {
      const result = await this.pool.query<Pick<HistorianJoinedRow, "ts" | "value_string" | "topic_name">>(query, [
        topicPath,
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        system,
        metric,
        value: this.parseValue(row.value_string),
        timestamp: new Date(row.ts),
      };
    } catch (error) {
      this.logger.error("Error fetching unit current value", error);
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
    const topicPath = buildWeatherTopicPath(campus, building, metric);

    const query = `
      SELECT
        ts,
        value_string,
        topic_name
      FROM data
      NATURAL JOIN topics
      WHERE topic_name = $1
      ORDER BY ts DESC
      LIMIT 1
    `;

    try {
      const result = await this.pool.query<Pick<HistorianJoinedRow, "ts" | "value_string" | "topic_name">>(query, [
        topicPath,
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        system: "weather",
        metric,
        value: this.parseValue(row.value_string),
        timestamp: new Date(row.ts),
      };
    } catch (error) {
      this.logger.error("Error fetching weather current value", error);
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
    const topicPath = buildUnitTopicPath(campus, building, system, metric);

    const query = `
      SELECT
        ts,
        value_string
      FROM data
      NATURAL JOIN topics
      WHERE topic_name = $1
        AND ts >= $2
        AND ts <= $3
      ORDER BY ts
    `;

    try {
      const result = await this.pool.query<Pick<HistorianJoinedRow, "ts" | "value_string">>(query, [
        topicPath,
        startTime,
        endTime,
      ]);

      const data: HistorianDataPoint[] = result.rows.map((row) => ({
        timestamp: new Date(row.ts),
        value: this.parseValue(row.value_string),
        system,
        metric,
      }));

      return {
        system,
        metric,
        data,
      };
    } catch (error) {
      this.logger.error("Error fetching unit time series", error);
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
    const topicPath = buildWeatherTopicPath(campus, building, metric);

    const query = `
      SELECT
        ts,
        value_string
      FROM data
      NATURAL JOIN topics
      WHERE topic_name = $1
        AND ts >= $2
        AND ts <= $3
      ORDER BY ts
    `;

    try {
      const result = await this.pool.query<Pick<HistorianJoinedRow, "ts" | "value_string">>(query, [
        topicPath,
        startTime,
        endTime,
      ]);

      const data: HistorianDataPoint[] = result.rows.map((row) => ({
        timestamp: new Date(row.ts),
        value: this.parseValue(row.value_string),
        system: "weather",
        metric,
      }));

      return {
        system: "weather",
        metric,
        data,
      };
    } catch (error) {
      this.logger.error("Error fetching weather time series", error);
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
  ): Promise<HistorianAggregate[]> {
    const topicPath = buildUnitTopicPath(campus, building, system, metric);

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

    const query = `
      SELECT
        date_trunc('${intervalMap[intervalUnit]}', ts) AS timestamp,
        ${aggFunction}(${valueExpr}) AS value
      FROM data
      NATURAL JOIN topics
      WHERE topic_name = $1
        AND ts >= $2
        AND ts <= $3
      GROUP BY 1
      ORDER BY 1
    `;

    try {
      const result = await this.pool.query<{ timestamp: string; value: number | string | null }>(query, [
        topicPath,
        startTime,
        endTime,
      ]);

      return result.rows.map((row) => ({
        timestamp: new Date(row.timestamp),
        value: typeof row.value === "string" ? parseFloat(row.value) : null,
        metric,
      }));
    } catch (error) {
      this.logger.error("Error fetching aggregated data", error);
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
  ): Promise<HistorianAggregate[]> {
    const topicPath = buildWeatherTopicPath(campus, building, metric);

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

    const query = `
      SELECT
        date_trunc('${intervalMap[intervalUnit]}', ts) AS timestamp,
        ${aggFunction}(${valueExpr}) AS value
      FROM data
      NATURAL JOIN topics
      WHERE topic_name = $1
        AND ts >= $2
        AND ts <= $3
      GROUP BY 1
      ORDER BY 1
    `;

    try {
      const result = await this.pool.query<{ timestamp: string; value: number | string | null }>(query, [
        topicPath,
        startTime,
        endTime,
      ]);

      return result.rows.map((row) => ({
        timestamp: new Date(row.timestamp),
        value: typeof row.value === "string" ? parseFloat(row.value) : null,
        metric,
      }));
    } catch (error) {
      this.logger.error("Error fetching aggregated data", error);
      throw error;
    }
  }

  /**
   * Get multi-system data for a unit metric
   */
  async getMultiSystemUnit(
    campus: string,
    building: string,
    systems: string[],
    metric: UnitMetric,
    startTime: Date,
    endTime: Date,
    interval?: string,
  ): Promise<Record<string, HistorianDataPoint[]>> {
    if (systems.length === 0) {
      return {};
    }

    const topicPaths = systems.map((sys) => buildUnitTopicPath(campus, building, sys, metric));

    const caseStatements = systems.map((sys, i) => {
      return `MAX(CASE WHEN topic_name = $${i + 1} THEN CAST(NULLIF(value_string, 'null') AS double precision) END) AS "${sys}"`;
    });

    let timeGroup = "ts";
    const params: (string | Date)[] = [...topicPaths, startTime, endTime];

    if (interval) {
      const intervalMatch = interval.match(/^(\d+)(s|m|h|d)$/);
      if (!intervalMatch) {
        throw new Error("Invalid interval format");
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
      WHERE topic_name = ANY($${topicPaths.length + 3}::text[])
        AND ts >= $${topicPaths.length + 1}
        AND ts <= $${topicPaths.length + 2}
      GROUP BY 1
      ORDER BY 1
    `;

    try {
      params.push(...topicPaths);
      const result = await this.pool.query<{ timestamp: string; [key: string]: number | string | null }>(query, params);

      const grouped: Record<string, HistorianDataPoint[]> = {};
      systems.forEach((sys) => {
        grouped[sys] = [];
      });

      result.rows.forEach((row) => {
        const timestamp = new Date(row.timestamp);
        systems.forEach((sys) => {
          grouped[sys].push({
            timestamp,
            value: typeof row[sys] === "string" ? parseFloat(row[sys]) : null,
            system: sys,
            metric,
          });
        });
      });

      return grouped;
    } catch (error) {
      this.logger.error("Error fetching multi-system data", error);
      throw error;
    }
  }

  /**
   * Calculate setpoint error for a system
   */
  async calculateSetpointError(
    campus: string,
    building: string,
    system: string,
    startTime: Date,
    endTime: Date,
  ): Promise<HistorianDataPoint[]> {
    const tempPath = buildUnitTopicPath(campus, building, system, UnitMetric.ZoneTemperature);
    const setpointPath = buildUnitTopicPath(campus, building, system, UnitMetric.EffectiveZoneTemperatureSetPoint);

    const query = `
      WITH zone_temps AS (
        SELECT
          ts,
          CAST(NULLIF(value_string, 'null') AS double precision) AS temp_value
        FROM data
        NATURAL JOIN topics
        WHERE topic_name = $1
          AND ts >= $3
          AND ts <= $4
      ),
      zone_setpoints AS (
        SELECT
          ts,
          CAST(NULLIF(value_string, 'null') AS double precision) AS sp_value
        FROM data
        NATURAL JOIN topics
        WHERE topic_name = $2
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
      const result = await this.pool.query<{ timestamp: string; value: number | string | null }>(query, [
        tempPath,
        setpointPath,
        startTime,
        endTime,
      ]);

      return result.rows.map((row) => ({
        timestamp: new Date(row.timestamp),
        value: typeof row.value === "string" ? parseFloat(row.value) : null,
        system,
        metric: UnitMetric.ZoneTemperature, // Use a valid enum value as placeholder for calculated metric
      }));
    } catch (error) {
      this.logger.error("Error calculating setpoint error", error);
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
        this.logger.log(`Adding missing tables to publication: ${missingTables.join(", ")}`);

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

      const createTablesSql = schemaResult.rows
        .map((row) => `CREATE TABLE IF NOT EXISTS ${row.table_name} (\n${row.columns}\n);`)
        .join("\n\n");

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
      const pkResult = await this.pool.query<{ table_name: string; pk_columns: string }>(pkQuery);

      const createConstraintsSql = pkResult.rows
        .map((row) => `ALTER TABLE ${row.table_name} ADD PRIMARY KEY (${row.pk_columns});`)
        .join("\n");

      const idxQuery = `
        SELECT indexdef || ';' as idx
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('data', 'topics')
          AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
      `;
      const idxResult = await this.pool.query<{ idx: string }>(idxQuery);

      const createIndexesSql = idxResult.rows.map((row) => row.idx).join("\n");

      const isSelfSigned = await this.isProxyCertificateSelfSigned();
      const sslMode = isSelfSigned ? "prefer" : "require";

      this.logger.log(`Using sslmode=${sslMode} for historian replication`);

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
