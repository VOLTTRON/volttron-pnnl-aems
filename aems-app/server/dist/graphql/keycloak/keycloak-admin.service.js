"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KeycloakAdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakAdminService = void 0;
const common_1 = require("@nestjs/common");
const app_config_1 = require("../../app.config");
const prisma_service_1 = require("../../prisma/prisma.service");
let KeycloakAdminService = KeycloakAdminService_1 = class KeycloakAdminService {
    constructor(configService, prismaService) {
        this.configService = configService;
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(KeycloakAdminService_1.name);
    }
    get keycloakBase() {
        const internal = this.configService.keycloak.adminInternalUrl;
        if (internal)
            return internal.replace(/\/$/, "");
        const issuer = this.configService.keycloak.issuerUrl;
        return issuer.replace(/\/realms\/[^/]+/, "");
    }
    get adminBase() {
        const realm = /\/realms\/([^/]+)/.exec(this.configService.keycloak.issuerUrl)?.[1] ?? "default";
        return `${this.keycloakBase}/admin/realms/${realm}`;
    }
    get masterTokenUrl() {
        return `${this.keycloakBase}/realms/master/protocol/openid-connect/token`;
    }
    async getAdminToken() {
        const body = new URLSearchParams({
            grant_type: "password",
            client_id: "admin-cli",
            username: this.configService.keycloak.admin,
            password: this.configService.keycloak.adminPassword,
        });
        const res = await fetch(this.masterTokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to obtain Keycloak admin token: ${res.status} ${text}`);
        }
        const data = (await res.json());
        return data.access_token;
    }
    async listRealmRoles() {
        const token = await this.getAdminToken();
        const res = await fetch(`${this.adminBase}/roles`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to list Keycloak realm roles: ${res.status} ${text}`);
        }
        return (await res.json());
    }
    async getUserRoles(keycloakUserId) {
        const token = await this.getAdminToken();
        const res = await fetch(`${this.adminBase}/users/${keycloakUserId}/role-mappings/realm`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to list user Keycloak realm roles: ${res.status} ${text}`);
        }
        return (await res.json());
    }
    async assignRoles(keycloakUserId, roles) {
        const token = await this.getAdminToken();
        const res = await fetch(`${this.adminBase}/users/${keycloakUserId}/role-mappings/realm`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(roles),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to assign Keycloak realm roles: ${res.status} ${text}`);
        }
    }
    async revokeRoles(keycloakUserId, roles) {
        const token = await this.getAdminToken();
        const res = await fetch(`${this.adminBase}/users/${keycloakUserId}/role-mappings/realm`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(roles),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to revoke Keycloak realm roles: ${res.status} ${text}`);
        }
    }
    async getRealmManagementClientId(token) {
        const res = await fetch(`${this.adminBase}/clients?clientId=realm-management`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to find realm-management client: ${res.status} ${text}`);
        }
        const clients = (await res.json());
        const client = clients.find((c) => c.clientId === "realm-management");
        if (!client)
            throw new Error("realm-management client not found in Keycloak");
        return client.id;
    }
    async listRealmManagementRoles() {
        const token = await this.getAdminToken();
        const clientId = await this.getRealmManagementClientId(token);
        const res = await fetch(`${this.adminBase}/clients/${clientId}/roles`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to list realm-management client roles: ${res.status} ${text}`);
        }
        return (await res.json());
    }
    async getUserRealmManagementRoles(keycloakUserId) {
        const token = await this.getAdminToken();
        const clientId = await this.getRealmManagementClientId(token);
        const res = await fetch(`${this.adminBase}/users/${keycloakUserId}/role-mappings/clients/${clientId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to list user realm-management roles: ${res.status} ${text}`);
        }
        return (await res.json());
    }
    async assignRealmManagementRoles(keycloakUserId, roles) {
        const token = await this.getAdminToken();
        const clientId = await this.getRealmManagementClientId(token);
        const res = await fetch(`${this.adminBase}/users/${keycloakUserId}/role-mappings/clients/${clientId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(roles),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to assign realm-management roles: ${res.status} ${text}`);
        }
    }
    async revokeRealmManagementRoles(keycloakUserId, roles) {
        const token = await this.getAdminToken();
        const clientId = await this.getRealmManagementClientId(token);
        const res = await fetch(`${this.adminBase}/users/${keycloakUserId}/role-mappings/clients/${clientId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(roles),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to revoke realm-management roles: ${res.status} ${text}`);
        }
    }
    async hasAdminAccess(appUserId) {
        const keycloakUserId = await this.lookupKeycloakUserId(appUserId);
        if (!keycloakUserId)
            return false;
        const assigned = await this.getUserRealmManagementRoles(keycloakUserId);
        const target = this.configService.keycloak.adminRole;
        return assigned.some((r) => r.name === target);
    }
    async lookupKeycloakUserId(appUserId) {
        const account = await this.prismaService.prisma.account.findFirst({
            where: { userId: appUserId, provider: "keycloak" },
        });
        return account?.providerAccountId ?? null;
    }
    async syncAdminRole(appUserId, grant) {
        const keycloakUserId = await this.lookupKeycloakUserId(appUserId);
        if (!keycloakUserId)
            return;
        const targetRoleName = this.configService.keycloak.adminRole;
        const allRoles = await this.listRealmManagementRoles();
        const role = allRoles.find((r) => r.name === targetRoleName);
        if (!role) {
            this.logger.warn(`realm-management client role '${targetRoleName}' not found — skipping sync for user ${appUserId}`);
            return;
        }
        if (grant) {
            await this.assignRealmManagementRoles(keycloakUserId, [role]);
        }
        else {
            await this.revokeRealmManagementRoles(keycloakUserId, [role]);
        }
    }
};
exports.KeycloakAdminService = KeycloakAdminService;
exports.KeycloakAdminService = KeycloakAdminService = KeycloakAdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService])
], KeycloakAdminService);
//# sourceMappingURL=keycloak-admin.service.js.map