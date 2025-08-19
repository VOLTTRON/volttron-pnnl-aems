"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const core_1 = require("@nestjs/core");
const roles_guard_1 = require("./roles.guard");
const jwt_1 = require("@nestjs/jwt");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("../prisma/prisma.module");
const subscription_module_1 = require("../subscription/subscription.module");
const auth_controller_1 = require("./auth.controller");
const app_config_1 = require("../app.config");
let AuthModule = AuthModule_1 = class AuthModule {
    static forRoot() {
        return {
            module: AuthModule_1,
        };
    }
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = AuthModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            subscription_module_1.SubscriptionModule,
            schedule_1.ScheduleModule.forRoot(),
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
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            auth_service_1.AuthService,
        ],
        controllers: [auth_controller_1.AuthController],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map