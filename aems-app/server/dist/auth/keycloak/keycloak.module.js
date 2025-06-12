"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakModule = void 0;
const common_1 = require("@nestjs/common");
const keycloak_service_1 = require("./keycloak.service");
const keycloak_controller_1 = require("./keycloak.controller");
const _1 = require(".");
const auth_module_1 = require("../auth.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const config_1 = require("@nestjs/config");
const keycloak_config_1 = require("./keycloak.config");
const app_config_1 = require("../../app.config");
const auth_service_1 = require("../auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let KeycloakModule = class KeycloakModule {
};
exports.KeycloakModule = KeycloakModule;
KeycloakModule.provider = _1.Provider;
exports.KeycloakModule = KeycloakModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot({ load: [keycloak_config_1.config] }), auth_module_1.AuthModule, prisma_module_1.PrismaModule],
        providers: [
            {
                provide: _1.Provider,
                inject: [app_config_1.AppConfigService.Key, auth_service_1.AuthService, prisma_service_1.PrismaService],
                useFactory: (configService, authService, prismaService) => configService.auth.providers.includes(_1.Provider)
                    ? new keycloak_service_1.KeycloakService(authService, prismaService, configService)
                    : null,
            },
        ],
        controllers: [keycloak_controller_1.KeycloakController],
    })
], KeycloakModule);
//# sourceMappingURL=keycloak.module.js.map