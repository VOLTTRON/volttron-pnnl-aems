import { PrismaClient } from "@prisma/client";
import { AppConfigService } from "@/app.config";
import { Marked } from "./push-marking";
export declare class PrismaService {
    private logger;
    readonly prisma: PrismaClient;
    private readonly markListeners;
    private readonly marked;
    onPushMarked(listener: (marked: Marked) => Promise<void> | void): void;
    constructor(configService: AppConfigService, prisma?: PrismaClient);
}
