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
const app_config_1 = require("../../app.config");
const auth_service_1 = require("../auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const subscription_service_1 = require("../../subscription/subscription.service");
const subscription_module_1 = require("../../subscription/subscription.module");
const jwt_1 = require("@nestjs/jwt");
const common_2 = require("@local/common");
class WellKnownStruct {
    constructor(data) {
        Object.assign(this, data ?? {});
    }
}
let KeycloakModule = class KeycloakModule {
};
exports.KeycloakModule = KeycloakModule;
KeycloakModule.provider = _1.Provider;
exports.KeycloakModule = KeycloakModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            subscription_module_1.SubscriptionModule,
            jwt_1.JwtModule.registerAsync({
                useFactory: async (configService) => {
                    if (!configService.keycloak.certsUrl || !configService.auth.providers.includes(_1.Provider)) {
                        return {};
                    }
                    const logger = new common_1.Logger(KeycloakModule.name);
                    const certs = await fetch(`${configService.keycloak.certsUrl}`)
                        .then((res) => res.json())
                        .catch((err) => logger.error("Failed to fetch Keycloak public key.", err));
                    let algorithm = "RS256";
                    let publicKey = certs?.keys?.find((key) => key.alg === algorithm)?.x5c?.[0];
                    if (!publicKey) {
                        const cert = certs?.keys?.pop();
                        publicKey = cert?.x5c?.[0];
                        algorithm = cert?.alg;
                    }
                    return {
                        publicKey: publicKey,
                    };
                },
                inject: [app_config_1.AppConfigService.Key],
            }),
        ],
        providers: [
            {
                provide: _1.Provider,
                inject: [auth_service_1.AuthService, app_config_1.AppConfigService.Key, prisma_service_1.PrismaService, subscription_service_1.SubscriptionService, jwt_1.JwtService],
                useFactory: async (authService, configService, prismaService, subscriptionService, jwtService) => {
                    if (configService.auth.providers.includes(_1.Provider)) {
                        if (configService.keycloak.wellKnownUrl) {
                            const logger = new common_1.Logger(KeycloakModule.name);
                            const response = await fetch(configService.keycloak.wellKnownUrl)
                                .then((res) => {
                                try {
                                    return res.json();
                                }
                                catch (error) {
                                    throw new Error("Failed to parse Keycloak well-known configuration: " + error?.message);
                                }
                            })
                                .catch((error) => {
                                throw new Error("Failed to fetch Keycloak well-known configuration: " + error?.message);
                            });
                            if ((0, common_2.typeofObject)(response, (v) => typeof v === "object" && Object.keys(new WellKnownStruct()).every((k) => k in v))) {
                                logger.log("Updating the configuration with Keycloak well-known data.");
                                configService.keycloak.authUrl = response.authorization_endpoint;
                                configService.keycloak.tokenUrl = response.token_endpoint;
                                configService.keycloak.userinfoUrl = response.userinfo_endpoint;
                                configService.keycloak.certsUrl = response.jwks_uri;
                                configService.keycloak.logoutUrl = response.end_session_endpoint;
                                if (!configService.keycloak.scope.split(" ").every((s) => response.scopes_supported.includes(s))) {
                                    logger.warn(`Requested Keycloak scopes "${configService.keycloak.scope}" are not fully supported by the Keycloak server. Supported scopes: ${response.scopes_supported.join(", ")}`);
                                }
                            }
                        }
                        return configService.auth.framework === "passport"
                            ? new keycloak_service_1.KeycloakPassportService(authService, configService, prismaService, subscriptionService, jwtService)
                            : new keycloak_service_1.KeycloakAuthjsService(authService, configService);
                    }
                    return null;
                },
            },
        ],
        controllers: new app_config_1.AppConfigService().auth.framework === "passport" ? [keycloak_controller_1.KeycloakController] : [],
    })
], KeycloakModule);
//# sourceMappingURL=keycloak.module.js.map