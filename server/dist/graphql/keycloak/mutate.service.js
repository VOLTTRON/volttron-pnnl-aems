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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakMutation = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const keycloak_admin_service_1 = require("./keycloak-admin.service");
let KeycloakMutation = class KeycloakMutation {
    constructor(builder, keycloakAdminService) {
        builder.mutationField("assignKeycloakRoles", (t) => t.field({
            description: "Assign Keycloak realm roles (by name) to the given app user.",
            authScopes: { keycloak: true },
            type: "Boolean",
            args: {
                userId: t.arg.string({ required: true }),
                roles: t.arg.stringList({ required: true }),
            },
            resolve: async (_root, args) => {
                const keycloakUserId = await keycloakAdminService.lookupKeycloakUserId(args.userId);
                if (!keycloakUserId)
                    throw new Error("User has no linked Keycloak account.");
                const allRoles = await keycloakAdminService.listRealmRoles();
                const toAssign = allRoles.filter((r) => args.roles.includes(r.name));
                await keycloakAdminService.assignRoles(keycloakUserId, toAssign);
                return true;
            },
        }));
        builder.mutationField("revokeKeycloakRoles", (t) => t.field({
            description: "Revoke Keycloak realm roles (by name) from the given app user.",
            authScopes: { keycloak: true },
            type: "Boolean",
            args: {
                userId: t.arg.string({ required: true }),
                roles: t.arg.stringList({ required: true }),
            },
            resolve: async (_root, args) => {
                const keycloakUserId = await keycloakAdminService.lookupKeycloakUserId(args.userId);
                if (!keycloakUserId)
                    throw new Error("User has no linked Keycloak account.");
                const currentRoles = await keycloakAdminService.getUserRoles(keycloakUserId);
                const toRevoke = currentRoles.filter((r) => args.roles.includes(r.name));
                await keycloakAdminService.revokeRoles(keycloakUserId, toRevoke);
                return true;
            },
        }));
        builder.mutationField("grantKeycloakAdminAccess", (t) => t.field({
            description: "Grant Keycloak admin console access to the given app user (assigns the configured realm-management client role).",
            authScopes: { keycloak: true },
            type: "Boolean",
            args: {
                userId: t.arg.string({ required: true }),
            },
            resolve: async (_root, args) => {
                await keycloakAdminService.syncAdminRole(args.userId, true);
                return true;
            },
        }));
        builder.mutationField("revokeKeycloakAdminAccess", (t) => t.field({
            description: "Revoke Keycloak admin console access from the given app user.",
            authScopes: { keycloak: true },
            type: "Boolean",
            args: {
                userId: t.arg.string({ required: true }),
            },
            resolve: async (_root, args) => {
                await keycloakAdminService.syncAdminRole(args.userId, false);
                return true;
            },
        }));
    }
};
exports.KeycloakMutation = KeycloakMutation;
exports.KeycloakMutation = KeycloakMutation = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosMutation)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        keycloak_admin_service_1.KeycloakAdminService])
], KeycloakMutation);
//# sourceMappingURL=mutate.service.js.map