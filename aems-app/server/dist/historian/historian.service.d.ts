import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { HistorianDataPoint, HistorianTimeSeries, HistorianAggregate, HistorianAggregateResult, HistorianMetricCurrent, HistorianQueryMetadata, HistorianMultiSystemData, AggregationType, CalculationType, HistorianReplicationInfo, PublisherInfo, SubscriberSetupSql, MonitoringSql, ReplicationSlot, SystemPublishingStatus, HistorianMultiSystemRanges, UnitMetric, WeatherMetric, MeterMetric } from "@local/common";
export { HistorianDataPoint, HistorianTimeSeries, HistorianAggregate, HistorianAggregateResult, HistorianMetricCurrent, HistorianQueryMetadata, HistorianMultiSystemData, AggregationType, CalculationType, HistorianReplicationInfo, PublisherInfo, SubscriberSetupSql, MonitoringSql, ReplicationSlot, SystemPublishingStatus, UnitMetric, WeatherMetric, MeterMetric, };
export interface SystemAccess {
    campus: string;
    building: string;
    system: string;
}
export interface HistorianAccessControl {
    allowedSystems: SystemAccess[];
}
export declare class HistorianService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly prismaService;
    private logger;
    private pool;
    constructor(configService: AppConfigService, prismaService: PrismaService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    filterHistorianAccess(user: Express.User, campus?: string, building?: string, system?: string | string[]): Promise<HistorianAccessControl>;
    private parseValue;
    getUnitCurrentValue(campus: string, building: string, system: string, metric: UnitMetric): Promise<HistorianMetricCurrent | null>;
    getWeatherCurrentValue(campus: string, building: string, metric: WeatherMetric): Promise<HistorianMetricCurrent | null>;
    getUnitTimeSeries(campus: string, building: string, system: string, metric: UnitMetric, startTime: Date, endTime: Date): Promise<HistorianTimeSeries>;
    getWeatherTimeSeries(campus: string, building: string, metric: WeatherMetric, startTime: Date, endTime: Date): Promise<HistorianTimeSeries>;
    getUnitAggregated(campus: string, building: string, system: string, metric: UnitMetric, startTime: Date, endTime: Date, interval: string, aggregation: AggregationType): Promise<HistorianAggregateResult>;
    getWeatherAggregated(campus: string, building: string, metric: WeatherMetric, startTime: Date, endTime: Date, interval: string, aggregation: AggregationType): Promise<HistorianAggregateResult>;
    getMeterCurrentValue(campus: string, building: string, metric: MeterMetric): Promise<HistorianMetricCurrent | null>;
    getMeterTimeSeries(campus: string, building: string, metric: MeterMetric, startTime: Date, endTime: Date): Promise<HistorianTimeSeries>;
    getMeterAggregated(campus: string, building: string, metric: MeterMetric, startTime: Date, endTime: Date, interval: string, aggregation: AggregationType): Promise<HistorianAggregateResult>;
    getMultiSystemUnit(campus: string, building: string, systems: string[], deniedSystems: string[], metric: UnitMetric, startTime: Date, endTime: Date, interval?: string): Promise<HistorianMultiSystemData[]>;
    getMultiSystemUnitRanges(campus: string, building: string, systems: string[], deniedSystems: string[], metric: UnitMetric, startTime: Date, endTime: Date): Promise<HistorianMultiSystemRanges[]>;
    getMultiSystemSetpointErrorRanges(campus: string, building: string, systems: string[], deniedSystems: string[], startTime: Date, endTime: Date): Promise<HistorianMultiSystemRanges[]>;
    calculateSetpointError(campus: string, building: string, system: string, startTime: Date, endTime: Date): Promise<HistorianTimeSeries>;
    private isProxyCertificateSelfSigned;
    private ensureTablesInPublication;
    getSystemPublishingStatus(): Promise<SystemPublishingStatus[]>;
    getReplicationInfo(): Promise<HistorianReplicationInfo>;
}
