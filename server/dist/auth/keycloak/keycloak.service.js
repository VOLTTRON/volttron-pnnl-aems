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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth.service");
const auth_1 = require("..");
const passport_1 = require("@nestjs/passport");
const passport_oauth2_1 = require("passport-oauth2");
const prisma_service_1 = require("../../prisma/prisma.service");
const _1 = require(".");
const app_config_1 = require("../../app.config");
let KeycloakService = class KeycloakService extends (0, passport_1.PassportStrategy)(passport_oauth2_1.Strategy, _1.Provider) {
    constructor(authService, prismaService, configService) {
        super({
            authorizationURL: configService.keycloak.authUrl,
            tokenURL: configService.keycloak.tokenUrl,
            clientID: configService.keycloak.clientId,
            clientSecret: configService.keycloak.clientSecret,
        });
        this.prismaService = prismaService;
        this.name = _1.Provider;
        this.label = "Keycloak";
        this.credentials = {};
        authService.registerProvider(this);
    }
    async validate(_accessToken, _refreshToken, profile) {
        const user = await this.prismaService.prisma.user.findUnique({ where: { email: profile.email } });
        if (user) {
            return (0, auth_1.buildExpressUser)(user);
        }
        else {
            return null;
        }
    }
};
exports.KeycloakService = KeycloakService;
exports.KeycloakService = KeycloakService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        prisma_service_1.PrismaService,
        app_config_1.AppConfigService])
], KeycloakService);
//# sourceMappingURL=keycloak.service.js.map