export interface ReplicationSlot {
    slotName: string;
    plugin: string;
    slotType: string;
    active: boolean;
    restartLsn: string;
    confirmedFlushLsn: string;
}
export interface PublisherInfo {
    publicationName: string;
    publishedTables: string[];
    activeConnections: number;
    replicationSlots: ReplicationSlot[];
}
export interface SubscriberSetupSql {
    createTablesSql: string;
    createConstraintsSql: string;
    createIndexesSql: string;
    createSubscriptionTemplate: string;
}
export interface MonitoringSql {
    checkSchemaMatchSql: string;
    checkReplicationLagSql: string;
    checkSubscriptionStatusSql: string;
    checkSyncErrorsSql: string;
}
export interface SystemPublishingStatus {
    campus: string;
    building: string;
    system: string;
    metric: string;
    lastPublished: Date;
    minutesAgo: number;
    status: 'active' | 'stale' | 'inactive';
}
export interface HistorianReplicationInfo {
    publisherInfo: PublisherInfo;
    subscriberSetupSql: SubscriberSetupSql;
    monitoringSql: MonitoringSql;
    systemPublishingStatus: SystemPublishingStatus[];
}
export interface HistorianDataRange {
    startTime: Date;
    endTime: Date;
    value: number | null;
    system: string;
    metric: string;
}
export interface HistorianMultiSystemRanges {
    system: string;
    ranges: HistorianDataRange[];
}
