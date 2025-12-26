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
var KeycloakInternalController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakInternalController = void 0;
const common_1 = require("@nestjs/common");
const keycloak_sync_service_1 = require("./keycloak-sync.service");
const internal_network_guard_1 = require("./internal-network.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let KeycloakInternalController = KeycloakInternalController_1 = class KeycloakInternalController {
    constructor(keycloakSyncService, prismaService) {
        this.keycloakSyncService = keycloakSyncService;
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(KeycloakInternalController_1.name);
    }
    async syncUserRoles(body) {
        const { email } = body;
        if (!email) {
            throw new common_1.InternalServerErrorException("Email is required");
        }
        this.logger.log(`Manual sync requested for ${email}`);
        try {
            const result = await this.keycloakSyncService.syncUserRoles(email);
            return {
                success: true,
                message: `Synced roles for ${email}`,
                result,
            };
        }
        catch (error) {
            this.logger.error(`Failed to sync roles for ${email}:`, error);
            throw new common_1.InternalServerErrorException(`Failed to sync Keycloak roles: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async syncAllUsers() {
        this.logger.log("Bulk sync requested for all users");
        try {
            const users = await this.prismaService.prisma.user.findMany({
                select: { email: true },
            });
            this.logger.log(`Found ${users.length} users to sync`);
            const results = await Promise.allSettled(users.map((user) => this.keycloakSyncService.syncUserRoles(user.email)));
            const succeeded = results.filter((r) => r.status === "fulfilled").length;
            const failed = results.filter((r) => r.status === "rejected").length;
            const details = results.map((result, index) => {
                if (result.status === "fulfilled") {
                    return {
                        email: users[index].email,
                        status: "success",
                    };
                }
                else {
                    return {
                        email: users[index].email,
                        status: "failed",
                        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
                    };
                }
            });
            this.logger.log(`Bulk sync completed: ${succeeded} succeeded, ${failed} failed`);
            return {
                success: true,
                message: `Synced ${succeeded} users, ${failed} failures`,
                total: users.length,
                succeeded,
                failed,
                details,
            };
        }
        catch (error) {
            this.logger.error("Failed to sync all users:", error);
            throw new common_1.InternalServerErrorException(`Failed to sync all users: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
exports.KeycloakInternalController = KeycloakInternalController;
__decorate([
    (0, common_1.UseGuards)(internal_network_guard_1.InternalNetworkGuard),
    (0, common_1.Post)("sync-roles"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KeycloakInternalController.prototype, "syncUserRoles", null);
__decorate([
    (0, common_1.UseGuards)(internal_network_guard_1.InternalNetworkGuard),
    (0, common_1.Post)("sync-all"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeycloakInternalController.prototype, "syncAllUsers", null);
exports.KeycloakInternalController = KeycloakInternalController = KeycloakInternalController_1 = __decorate([
    (0, common_1.Controller)("internal/keycloak"),
    __metadata("design:paramtypes", [keycloak_sync_service_1.KeycloakSyncService,
        prisma_service_1.PrismaService])
], KeycloakInternalController);
//# sourceMappingURL=keycloak-internal.controller.js.map