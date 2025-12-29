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
var KeycloakSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakSyncService = void 0;
const app_config_1 = require("../app.config");
const prisma_service_1 = require("../prisma/prisma.service");
const subscription_service_1 = require("../subscription/subscription.service");
const services_1 = require("../services");
const file_1 = require("../utils/file");
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
let KeycloakSyncService = KeycloakSyncService_1 = class KeycloakSyncService extends services_1.BaseService {
    constructor(configService, prismaService, subscriptionService) {
        super("grafana", configService);
        this.configService = configService;
        this.prismaService = prismaService;
        this.subscriptionService = subscriptionService;
        this.logger = new common_2.Logger(KeycloakSyncService_1.name);
        this.dashboardRoles = new Map();
    }
    execute() {
        return super.execute();
    }
    async task() {
        this.logger.log("Initializing KeycloakSyncService...");
        await this.loadDashboardRoles();
        await this.subscribeToUserEvents();
        this.logger.log("Performing startup sync of all users...");
        await this.syncAllUsers();
        this.logger.log("Startup sync completed");
    }
    async dailySync() {
        if (!this.schedule()) {
            return;
        }
        try {
            this.logger.log("Running daily scheduled sync of all users...");
            await this.syncAllUsers();
            this.logger.log("Daily sync completed successfully");
        }
        catch (error) {
            this.logger.error("Daily sync failed:", error instanceof Error ? error.message : String(error));
        }
    }
    async subscribeToUserEvents() {
        try {
            this.subscriptionId = await this.subscriptionService.subscribe("User", this.handleUserEvent.bind(this), {});
            this.logger.log("Successfully subscribed to User events for Keycloak role sync");
        }
        catch (error) {
            this.logger.error("Failed to subscribe to User events:", error);
        }
    }
    async handleUserEvent(event) {
        try {
            if (event.mutation === common_1.Mutation.Created) {
                await this.handleUserCreated(event.id);
            }
            else if (event.mutation === common_1.Mutation.Updated) {
                await this.handleUserUpdated(event.id);
            }
            else if (event.mutation === common_1.Mutation.Deleted) {
                this.handleUserDeleted(event.id);
            }
        }
        catch (error) {
            this.logger.error(`Failed to handle ${event.mutation} event for user ${event.id}:`, error instanceof Error ? error.message : String(error));
        }
    }
    async handleUserCreated(userId) {
        const user = await this.prismaService.prisma.user.findUnique({
            where: { id: userId },
            include: { units: true },
        });
        if (!user) {
            this.logger.warn(`User ${userId} not found after creation event`);
            return;
        }
        this.logger.log(`User created: ${user.email}, syncing Keycloak roles...`);
        const hasRole = user.role && user.role.trim().length > 0;
        const hasUnits = user.units && user.units.length > 0;
        if (!hasRole && !hasUnits) {
            this.logger.debug(`User ${user.email} has no role or units, skipping initial sync`);
            return;
        }
        await this.syncUserRoles(user.email);
        this.logger.log(`Successfully synced Keycloak roles for new user ${user.email}`);
    }
    async handleUserUpdated(userId) {
        const user = await this.prismaService.prisma.user.findUnique({
            where: { id: userId },
            include: { units: true },
        });
        if (!user) {
            this.logger.warn(`User ${userId} not found for Keycloak sync`);
            return;
        }
        this.logger.log(`User updated: ${user.email}, syncing Keycloak roles...`);
        await this.syncUserRoles(user.email);
        this.logger.log(`Successfully synced Keycloak roles for ${user.email}`);
    }
    handleUserDeleted(userId) {
        this.logger.log(`User ${userId} deleted - Keycloak roles will be cleaned up on next startup sync`);
    }
    async syncAllUsers() {
        try {
            const users = await this.prismaService.prisma.user.findMany({
                select: { email: true },
            });
            this.logger.log(`Found ${users.length} users to sync`);
            let succeeded = 0;
            let failed = 0;
            for (const user of users) {
                try {
                    await this.syncUserRoles(user.email);
                    succeeded++;
                }
                catch (error) {
                    failed++;
                    this.logger.warn(`Failed to sync ${user.email} on startup:`, error instanceof Error ? error.message : String(error));
                }
            }
            this.logger.log(`Startup sync results: ${succeeded} succeeded, ${failed} failed`);
        }
        catch (error) {
            this.logger.error("Failed to perform startup sync:", error);
        }
    }
    async loadDashboardRoles() {
        try {
            const configPath = this.configService.grafana.configPath;
            if (!configPath) {
                this.logger.warn("Grafana config path not set, dashboard roles will be empty");
                this.dashboardRoles = new Map();
                return;
            }
            this.dashboardRoles = await this.parseDashboardConfigs(configPath);
            const totalRoles = Array.from(this.dashboardRoles.values()).reduce((sum, roles) => sum + roles.size, 0);
            this.logger.log(`Loaded ${totalRoles} Grafana roles from ${this.dashboardRoles.size} campus/building configs`);
        }
        catch (error) {
            this.logger.error("Failed to load dashboard roles:", error);
            this.dashboardRoles = new Map();
        }
    }
    async parseDashboardConfigs(configPath) {
        const roleMap = new Map();
        const ConfigFilenameRegex = /(?<campus>.+)_(?<building>.+)_dashboard_urls\.json/i;
        try {
            const files = await (0, file_1.getConfigFiles)([configPath], ".json", this.logger);
            if (files.length === 0) {
                this.logger.debug(`No dashboard config files found in ${configPath}`);
                return roleMap;
            }
            for (const file of files) {
                try {
                    const filename = (0, node_path_1.basename)(file);
                    const match = ConfigFilenameRegex.exec(filename);
                    if (!match?.groups) {
                        this.logger.warn(`Skipping invalid dashboard config filename: ${filename}`);
                        continue;
                    }
                    const { campus, building } = match.groups;
                    const key = `${campus}_${building}`.toLowerCase();
                    const text = await (0, promises_1.readFile)((0, node_path_1.resolve)(file), "utf-8");
                    const config = JSON.parse(text);
                    const roles = new Set();
                    for (const [_dashboardName, dashboardInfo] of Object.entries(config)) {
                        if (typeof dashboardInfo === "object" && dashboardInfo.keycloak_role) {
                            roles.add(dashboardInfo.keycloak_role);
                        }
                    }
                    if (roles.size > 0) {
                        roleMap.set(key, roles);
                        this.logger.debug(`Loaded ${roles.size} roles for ${key}`);
                    }
                }
                catch (error) {
                    this.logger.error(`Error parsing dashboard config file ${file}:`, error);
                }
            }
        }
        catch (error) {
            this.logger.error(`Error reading dashboard config files from ${configPath}:`, error);
        }
        return roleMap;
    }
    getAllGrafanaRoles() {
        const allRoles = [];
        for (const roles of this.dashboardRoles.values()) {
            allRoles.push(...roles);
        }
        return allRoles;
    }
    async syncUserRoles(email) {
        const user = await this.prismaService.prisma.user.findUnique({
            where: { email },
            include: { units: true },
        });
        if (!user) {
            throw new Error(`User not found: ${email}`);
        }
        const requiredRoles = this.determineRequiredRoles(user);
        this.logger.debug(`Required roles for ${email}: ${requiredRoles.join(", ")}`);
        const keycloakUser = await this.getKeycloakUser(email);
        if (!keycloakUser) {
            this.logger.warn(`User ${email} not found in Keycloak, skipping sync`);
            return {
                email,
                added: [],
                removed: [],
                total: 0,
                skipped: true,
                reason: "User not in Keycloak",
            };
        }
        const clientUuid = await this.getGrafanaClientUuid();
        const currentRoles = await this.getUserClientRoles(keycloakUser.id, clientUuid);
        this.logger.debug(`Current roles for ${email}: ${currentRoles.join(", ")}`);
        const rolesToAdd = requiredRoles.filter((r) => !currentRoles.includes(r));
        const rolesToRemove = currentRoles.filter((r) => !requiredRoles.includes(r));
        this.logger.log(`Syncing roles for ${email}: +${rolesToAdd.length} -${rolesToRemove.length}`);
        for (const roleName of rolesToAdd) {
            try {
                await this.assignClientRole(keycloakUser.id, clientUuid, roleName);
                this.logger.debug(`Assigned role ${roleName} to ${email}`);
            }
            catch (error) {
                this.logger.error(`Failed to assign role ${roleName} to ${email}:`, error);
            }
        }
        for (const roleName of rolesToRemove) {
            try {
                await this.removeClientRole(keycloakUser.id, clientUuid, roleName);
                this.logger.debug(`Removed role ${roleName} from ${email}`);
            }
            catch (error) {
                this.logger.error(`Failed to remove role ${roleName} from ${email}:`, error);
            }
        }
        return {
            email,
            added: rolesToAdd,
            removed: rolesToRemove,
            total: requiredRoles.length,
        };
    }
    normalizeRoleName(name) {
        const normalize = common_1.Normalization.process("Lowercase", "Trim", "Compact", "Letters", "Numbers");
        const normalized = normalize(name);
        return normalized.replace(/\s+/g, '_');
    }
    determineRequiredRoles(user) {
        const roles = new Set();
        const userRoles = (user.role || "").toLowerCase().split(/\s+/).filter(Boolean);
        const hasUserRole = userRoles.includes("user");
        const hasAdminRole = userRoles.includes("admin");
        if (!hasUserRole && !hasAdminRole) {
            this.logger.debug(`User ${user.email} has no user or admin role, no Grafana access`);
            return [];
        }
        if (hasAdminRole) {
            const allRoles = this.getAllGrafanaRoles();
            this.logger.debug(`User ${user.email} is admin, granting ${allRoles.length} viewer roles`);
            return allRoles;
        }
        for (const unit of user.units) {
            const campus = this.normalizeRoleName(unit.campus);
            const building = this.normalizeRoleName(unit.building);
            const unitName = this.normalizeRoleName(unit.name);
            const unitRole = `grafana-view-unit-${campus}_${building}_${unitName}`;
            roles.add(unitRole);
            const siteRole = `grafana-view-site-${campus}_${building}`;
            roles.add(siteRole);
        }
        return Array.from(roles);
    }
    getKeycloakBaseUrl() {
        const internalUrl = process.env.KEYCLOAK_INTERNAL_URL;
        if (internalUrl) {
            return internalUrl;
        }
        const issuerUrl = this.configService.keycloak.issuerUrl;
        const match = issuerUrl.match(/^(https?:\/\/[^/]+(?:\/[^/]+)*?)\/realms\//);
        return match ? match[1] : issuerUrl.replace(/\/realms\/.*$/, "");
    }
    async getAdminToken() {
        if (this.adminTokenCache && this.adminTokenCache.expiresAt > Date.now()) {
            return this.adminTokenCache.token;
        }
        const baseUrl = this.getKeycloakBaseUrl();
        const tokenUrl = `${baseUrl}/realms/master/protocol/openid-connect/token`;
        const params = new URLSearchParams({
            grant_type: "password",
            client_id: "admin-cli",
            username: process.env.KEYCLOAK_ADMIN || "",
            password: process.env.KEYCLOAK_ADMIN_PASSWORD || "",
        });
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params,
        });
        if (!response.ok) {
            throw new Error(`Failed to get Keycloak admin token: ${response.statusText}`);
        }
        const data = await response.json();
        this.adminTokenCache = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in - 30) * 1000,
        };
        return data.access_token;
    }
    async getKeycloakUser(email) {
        const token = await this.getAdminToken();
        const realm = process.env.KEYCLOAK_REALM || "default";
        const baseUrl = this.getKeycloakBaseUrl();
        const url = `${baseUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            throw new Error(`Failed to get Keycloak user: ${response.statusText}`);
        }
        const users = await response.json();
        return users.length > 0 ? users[0] : null;
    }
    async getGrafanaClientUuid() {
        if (this.clientUuidCache) {
            return this.clientUuidCache;
        }
        const token = await this.getAdminToken();
        const realm = process.env.KEYCLOAK_REALM || "default";
        const clientId = process.env.KEYCLOAK_CLIENT_ID || "grafana-oauth";
        const baseUrl = this.getKeycloakBaseUrl();
        const url = `${baseUrl}/admin/realms/${realm}/clients?clientId=${encodeURIComponent(clientId)}`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            throw new Error(`Failed to get Grafana client: ${response.statusText}`);
        }
        const clients = await response.json();
        if (clients.length === 0) {
            throw new Error(`Grafana OAuth client '${clientId}' not found in Keycloak`);
        }
        this.clientUuidCache = clients[0].id;
        return this.clientUuidCache;
    }
    async getUserClientRoles(userId, clientUuid) {
        const token = await this.getAdminToken();
        const realm = process.env.KEYCLOAK_REALM || "default";
        const baseUrl = this.getKeycloakBaseUrl();
        const url = `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientUuid}`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error(`Failed to get user client roles: ${response.statusText}`);
        }
        const roles = await response.json();
        return roles.map((r) => r.name);
    }
    async createClientRole(clientUuid, roleName, description) {
        try {
            const token = await this.getAdminToken();
            const realm = process.env.KEYCLOAK_REALM || "default";
            const baseUrl = this.getKeycloakBaseUrl();
            const url = `${baseUrl}/admin/realms/${realm}/clients/${clientUuid}/roles`;
            const roleData = {
                name: roleName,
                description: description,
                composite: false,
                clientRole: true,
            };
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(roleData),
            });
            if (response.status === 201 || response.status === 409) {
                return true;
            }
            this.logger.error(`Failed to create role '${roleName}': ${response.statusText}`);
            return false;
        }
        catch (error) {
            this.logger.error(`Exception creating role '${roleName}':`, error);
            return false;
        }
    }
    async assignClientRole(userId, clientUuid, roleName) {
        const token = await this.getAdminToken();
        const realm = process.env.KEYCLOAK_REALM || "default";
        const baseUrl = this.getKeycloakBaseUrl();
        const roleUrl = `${baseUrl}/admin/realms/${realm}/clients/${clientUuid}/roles/${encodeURIComponent(roleName)}`;
        let roleResponse = await fetch(roleUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (roleResponse.status === 404) {
            this.logger.log(`Role '${roleName}' not found in Keycloak, creating it automatically...`);
            const description = `Auto-created viewer role for ${roleName}`;
            const created = await this.createClientRole(clientUuid, roleName, description);
            if (!created) {
                throw new Error(`Failed to auto-create role '${roleName}' in Keycloak`);
            }
            this.logger.log(`Successfully auto-created role '${roleName}'`);
            roleResponse = await fetch(roleUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
        }
        if (!roleResponse.ok) {
            throw new Error(`Role '${roleName}' not found in Keycloak after creation attempt`);
        }
        const role = await roleResponse.json();
        const assignUrl = `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientUuid}`;
        const assignResponse = await fetch(assignUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify([role]),
        });
        if (!assignResponse.ok) {
            throw new Error(`Failed to assign role '${roleName}': ${assignResponse.statusText}`);
        }
    }
    async removeClientRole(userId, clientUuid, roleName) {
        const token = await this.getAdminToken();
        const realm = process.env.KEYCLOAK_REALM || "default";
        const baseUrl = this.getKeycloakBaseUrl();
        const roleUrl = `${baseUrl}/admin/realms/${realm}/clients/${clientUuid}/roles/${encodeURIComponent(roleName)}`;
        const roleResponse = await fetch(roleUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!roleResponse.ok) {
            return;
        }
        const role = await roleResponse.json();
        const removeUrl = `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientUuid}`;
        const removeResponse = await fetch(removeUrl, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify([role]),
        });
        if (!removeResponse.ok) {
            throw new Error(`Failed to remove role '${roleName}': ${removeResponse.statusText}`);
        }
    }
};
exports.KeycloakSyncService = KeycloakSyncService;
__decorate([
    (0, schedule_1.Timeout)(1000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeycloakSyncService.prototype, "execute", null);
__decorate([
    (0, schedule_1.Cron)("0 0 * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeycloakSyncService.prototype, "dailySync", null);
exports.KeycloakSyncService = KeycloakSyncService = KeycloakSyncService_1 = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, common_2.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService])
], KeycloakSyncService);
//# sourceMappingURL=keycloak-sync.service.js.map