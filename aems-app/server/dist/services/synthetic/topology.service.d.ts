import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
export interface SyntheticUnit {
    id: string;
    campus: string;
    building: string;
    system: string;
}
export interface TopologyResult {
    units: SyntheticUnit[];
    buildings: {
        campus: string;
        building: string;
    }[];
}
export declare class SyntheticTopologyService {
    private readonly prismaService;
    private readonly configService;
    private readonly logger;
    constructor(prismaService: PrismaService, configService: AppConfigService);
    private prefix;
    apply(): Promise<TopologyResult>;
}
