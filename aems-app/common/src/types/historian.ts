/**
 * Historian replication types
 * Core historian types are exported from server/src/historian/historian.types.ts
 */

/**
 * Replication slot information
 */
export interface ReplicationSlot {
  slotName: string;
  plugin: string;
  slotType: string;
  active: boolean;
  restartLsn: string;
  confirmedFlushLsn: string;
}

/**
 * Publisher information
 */
export interface PublisherInfo {
  publicationName: string;
  publishedTables: string[];
  activeConnections: number;
  replicationSlots: ReplicationSlot[];
}

/**
 * SQL statements for subscriber setup
 */
/**
 * Two operator paths for subscriber provisioning surfaced by the `/historian` UI.
 *
 * Path A (SQL): each step is a SQL block the operator pastes into pgAdmin /
 * psql attached to their subscriber. No shell required.
 *
 * Path B (shell): each step is a shell one-liner in Linux/macOS `bash` form
 * AND Windows `PowerShell` form. All commands use the same env-var names so
 * the operator can `export` (bash) or `$env:` (PowerShell) once and paste
 * every step. Card-5 emits the full standalone script for a single-invocation
 * mode with per-chunk resumable backfill.
 */
export interface SubscriberSetupSql {
  // Path A (SQL)
  createTablesSql: string;
  createConstraintsSql: string;
  createIndexesSql: string;
  createSubscriptionSql: string;
  backfillProcedureSql: string;

  // Path B (bash)
  createTablesCmdSh: string;
  createConstraintsCmdSh: string;
  createIndexesCmdSh: string;
  createSubscriptionCmdSh: string;
  linuxScript: string;

  // Path B (PowerShell)
  createTablesCmdPs1: string;
  createConstraintsCmdPs1: string;
  createIndexesCmdPs1: string;
  createSubscriptionCmdPs1: string;
  windowsScript: string;
}

/**
 * SQL statements for monitoring replication
 */
export interface MonitoringSql {
  checkSchemaMatchSql: string;
  checkReplicationLagSql: string;
  checkSubscriptionStatusSql: string;
  checkSyncErrorsSql: string;
}

/**
 * System publishing status
 */
export interface SystemPublishingStatus {
  campus: string;
  building: string;
  system: string;
  metric: string;
  lastPublished: Date;
  minutesAgo: number;
  status: "active" | "stale" | "inactive";
}

/**
 * Complete replication information
 */
export interface HistorianReplicationInfo {
  publisherInfo: PublisherInfo;
  subscriberSetupSql: SubscriberSetupSql;
  monitoringSql: MonitoringSql;
  systemPublishingStatus: SystemPublishingStatus[];
}
