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
export interface SubscriberSetupSql {
  createTablesSql: string;
  createConstraintsSql: string;
  createIndexesSql: string;
  createSubscriptionTemplate: string;
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
