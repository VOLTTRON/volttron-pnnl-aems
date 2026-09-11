import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { SyntheticHistorianWriter } from "./historian.writer";
import { SyntheticService } from "./synthetic.service";
export declare class SyntheticTickerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly writer;
    private readonly synthetic;
    private readonly logger;
    private timer;
    private registry;
    private busy;
    private stopped;
    constructor(configService: AppConfigService, writer: SyntheticHistorianWriter, synthetic: SyntheticService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private scheduleNext;
    private runTick;
}
