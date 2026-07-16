import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
interface KeycloakRole {
    id: string;
    name: string;
}
export declare class KeycloakAdminService {
    private configService;
    private prismaService;
    private readonly logger;
    constructor(configService: AppConfigService, prismaService: PrismaService);
    private get keycloakBase();
    private get adminBase();
    private get masterTokenUrl();
    getAdminToken(): Promise<string>;
    listRealmRoles(): Promise<KeycloakRole[]>;
    getUserRoles(keycloakUserId: string): Promise<KeycloakRole[]>;
    assignRoles(keycloakUserId: string, roles: KeycloakRole[]): Promise<void>;
    revokeRoles(keycloakUserId: string, roles: KeycloakRole[]): Promise<void>;
    private getRealmManagementClientId;
    listRealmManagementRoles(): Promise<KeycloakRole[]>;
    getUserRealmManagementRoles(keycloakUserId: string): Promise<KeycloakRole[]>;
    assignRealmManagementRoles(keycloakUserId: string, roles: KeycloakRole[]): Promise<void>;
    revokeRealmManagementRoles(keycloakUserId: string, roles: KeycloakRole[]): Promise<void>;
    hasAdminAccess(appUserId: string): Promise<boolean>;
    lookupKeycloakUserId(appUserId: string): Promise<string | null>;
    syncAdminRole(appUserId: string, grant: boolean): Promise<void>;
}
export {};
