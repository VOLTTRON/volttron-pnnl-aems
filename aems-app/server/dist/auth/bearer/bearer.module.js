"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BearerModule = void 0;
const common_1 = require("@nestjs/common");
const bearer_service_1 = require("./bearer.service");
const bearer_controller_1 = require("./bearer.controller");
const _1 = require(".");
const auth_module_1 = require("../auth.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const jwt_1 = require("@nestjs/jwt");
const app_config_1 = require("../../app.config");
const auth_service_1 = require("../auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let BearerModule = class BearerModule {
};
exports.BearerModule = BearerModule;
BearerModule.provider = _1.Provider;
exports.BearerModule = BearerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.registerAsync({
                inject: [app_config_1.AppConfigService.Key],
                useFactory: (configService) => ({
                    secret: configService.jwt.secret,
                    signOptions: { expiresIn: configService.jwt.expiresIn },
                }),
            }),
        ],
        providers: [
            {
                provide: _1.Provider,
                inject: [auth_service_1.AuthService, app_config_1.AppConfigService.Key, prisma_service_1.PrismaService, jwt_1.JwtService],
                useFactory: (authService, configService, prismaService, jwtService) => configService.auth.providers.includes(_1.Provider)
                    ? configService.auth.framework === "passport"
                        ? new bearer_service_1.BearerPassportService(authService, configService, prismaService, jwtService)
                        : null
                    : null,
            },
        ],
        controllers: new app_config_1.AppConfigService().auth.framework === "passport" ? [bearer_controller_1.BearerController] : [],
    })
], BearerModule);
//# sourceMappingURL=bearer.module.js.map