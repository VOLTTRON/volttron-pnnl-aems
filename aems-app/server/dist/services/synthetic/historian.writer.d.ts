import { OnModuleDestroy } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
export declare class SyntheticHistorianWriter implements OnModuleDestroy {
    private readonly logger;
    private readonly pool;
    constructor(configService: AppConfigService);
    onModuleDestroy(): Promise<void>;
    ensureTopics(topicNames: string[]): Promise<Map<string, number>>;
    copyTopic(topicId: number, samples: Iterable<[Date, number]>): Promise<number>;
    private encodeSamples;
    tickInsert(ts: Date, values: [number, number][]): Promise<void>;
}
