import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { HistorianDataPoint, HistorianTimeSeries, HistorianAggregate, HistorianMetricCurrent, AggregationType, CalculationType, HistorianReplicationInfo, PublisherInfo, SubscriberSetupSql, MonitoringSql, ReplicationSlot, UnitPublishingStatus } from "./historian.types";
export { HistorianDataPoint, HistorianTimeSeries, HistorianAggregate, HistorianMetricCurrent, AggregationType, CalculationType, HistorianReplicationInfo, PublisherInfo, SubscriberSetupSql, MonitoringSql, ReplicationSlot, UnitPublishingStatus, };
export interface UnitAccess {
    campus: string;
    building: string;
    unit: string;
}
export interface HistorianAccessControl {
    allowedUnits: UnitAccess[];
    isEmpty: boolean;
}
export declare class HistorianService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly prismaService;
    private logger;
    private pool;
    constructor(configService: AppConfigService, prismaService: PrismaService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    filterHistorianAccess(userId: string | undefined, isAdmin: boolean, requestedCampus?: string, requestedBuilding?: string, requestedUnit?: string | string[]): Promise<HistorianAccessControl | null>;
    private buildTopicPattern;
    private parseValue;
    getCurrentValues(topicPatterns: string[], campus?: string, building?: string, unit?: string): Promise<HistorianMetricCurrent[]>;
    getTimeSeries(topicPatterns: string[], startTime: Date, endTime: Date, campus?: string, building?: string, unit?: string): Promise<HistorianTimeSeries[]>;
    getAggregated(topicPattern: string, startTime: Date, endTime: Date, interval: string, aggregation: AggregationType, campus?: string, building?: string, unit?: string): Promise<HistorianAggregate[]>;
    getMultiUnit(topicPattern: string, units: string[], startTime: Date, endTime: Date, interval?: string, campus?: string, building?: string): Promise<Record<string, HistorianDataPoint[]>>;
    getCalculated(calculation: CalculationType, topicPatterns: string[], startTime: Date, endTime: Date, campus?: string, building?: string, unit?: string, options?: Record<string, string>): Promise<HistorianDataPoint[]>;
    private calculateSetpointError;
    private calculateRollingAverage;
    private isProxyCertificateSelfSigned;
    private ensureTablesInPublication;
    getUnitPublishingStatus(): Promise<UnitPublishingStatus[]>;
    getReplicationInfo(): Promise<HistorianReplicationInfo>;
}
