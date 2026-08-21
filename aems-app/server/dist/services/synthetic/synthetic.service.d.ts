import { BaseService } from "..";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SyntheticTopologyService, SyntheticUnit } from "./topology.service";
import { SyntheticHistorianWriter } from "./historian.writer";
export interface TopicRegistry {
    units: SyntheticUnit[];
    buildings: {
        campus: string;
        building: string;
    }[];
    topicIds: Map<string, number>;
}
export declare class SyntheticService extends BaseService {
    private readonly configService;
    private readonly prismaService;
    private readonly topologyService;
    private readonly writer;
    private readonly logger;
    constructor(configService: AppConfigService, prismaService: PrismaService, topologyService: SyntheticTopologyService, writer: SyntheticHistorianWriter);
    execute(): Promise<void>;
    task(): Promise<void>;
    buildTopicNames(units: SyntheticUnit[], buildings: {
        campus: string;
        building: string;
    }[]): string[];
    private backfill;
    private iterateWeather;
    private iterateMeter;
    private iterateUnit;
    collectTickValues(registry: TopicRegistry, ts: Date): Promise<[number, number][]>;
    loadRegistry(): Promise<TopicRegistry | null>;
}
