import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { BaseService } from "@/services";
interface SyncResult {
    email: string;
    added: string[];
    removed: string[];
    total: number;
    skipped?: boolean;
    reason?: string;
}
export declare class KeycloakSyncService extends BaseService {
    private configService;
    private prismaService;
    private subscriptionService;
    private logger;
    private dashboardRoles;
    private subscriptionId?;
    private adminTokenCache?;
    private clientUuidCache?;
    constructor(configService: AppConfigService, prismaService: PrismaService, subscriptionService: SubscriptionService);
    execute(): Promise<void>;
    task(): Promise<void>;
    dailySync(): Promise<void>;
    private subscribeToUserEvents;
    private handleUserEvent;
    private handleUserCreated;
    private handleUserUpdated;
    private handleUserDeleted;
    private syncAllUsers;
    private loadDashboardRoles;
    private parseDashboardConfigs;
    private getAllGrafanaRoles;
    syncUserRoles(email: string): Promise<SyncResult>;
    private normalizeRoleName;
    private determineRequiredRoles;
    private getKeycloakBaseUrl;
    private getAdminToken;
    private getKeycloakUser;
    private getGrafanaClientUuid;
    private getUserClientRoles;
    createClientRole(clientUuid: string, roleName: string, description: string): Promise<boolean>;
    private assignClientRole;
    private removeClientRole;
}
export {};
