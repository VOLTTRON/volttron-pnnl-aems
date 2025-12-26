import { KeycloakSyncService } from "./keycloak-sync.service";
import { PrismaService } from "@/prisma/prisma.service";
interface SyncRolesRequest {
    email: string;
}
interface SyncRolesResponse {
    success: boolean;
    message: string;
    result?: {
        email: string;
        added: string[];
        removed: string[];
        total: number;
        skipped?: boolean;
        reason?: string;
    };
}
interface SyncAllResponse {
    success: boolean;
    message: string;
    total: number;
    succeeded: number;
    failed: number;
    details?: Array<{
        email: string;
        status: "success" | "failed";
        error?: string;
    }>;
}
export declare class KeycloakInternalController {
    private keycloakSyncService;
    private prismaService;
    private logger;
    constructor(keycloakSyncService: KeycloakSyncService, prismaService: PrismaService);
    syncUserRoles(body: SyncRolesRequest): Promise<SyncRolesResponse>;
    syncAllUsers(): Promise<SyncAllResponse>;
}
export {};
