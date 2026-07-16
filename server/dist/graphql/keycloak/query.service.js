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
exports.KeycloakQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const keycloak_admin_service_1 = require("./keycloak-admin.service");
const object_service_1 = require("./object.service");
let KeycloakQuery = class KeycloakQuery {
    constructor(builder, keycloakAdminService, keycloakObject) {
        const { KeycloakRole } = keycloakObject;
        builder.queryField("readAvailableKeycloakRoles", (t) => t.field({
            description: "List all available Keycloak realm roles.",
            authScopes: { keycloak: true },
            type: [KeycloakRole],
            resolve: async () => {
                return keycloakAdminService.listRealmRoles();
            },
        }));
        builder.queryField("readKeycloakRoles", (t) => t.field({
            description: "List the Keycloak realm roles assigned to the given app user.",
            authScopes: { keycloak: true },
            type: [KeycloakRole],
            args: {
                userId: t.arg.string({ required: true }),
            },
            resolve: async (_root, args) => {
                const keycloakUserId = await keycloakAdminService.lookupKeycloakUserId(args.userId);
                if (!keycloakUserId)
                    return [];
                return keycloakAdminService.getUserRoles(keycloakUserId);
            },
        }));
        builder.queryField("readKeycloakAdminAccess", (t) => t.field({
            description: "Returns true if the given app user has Keycloak admin console access (realm-management client role).",
            authScopes: { keycloak: true },
            type: "Boolean",
            args: {
                userId: t.arg.string({ required: true }),
            },
            resolve: async (_root, args) => {
                return keycloakAdminService.hasAdminAccess(args.userId);
            },
        }));
    }
};
exports.KeycloakQuery = KeycloakQuery;
exports.KeycloakQuery = KeycloakQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        keycloak_admin_service_1.KeycloakAdminService,
        object_service_1.KeycloakObject])
], KeycloakQuery);
//# sourceMappingURL=query.service.js.map