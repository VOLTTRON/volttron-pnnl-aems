"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperModule = void 0;
const common_1 = require("@nestjs/common");
const super_controller_1 = require("./super.controller");
const _1 = require(".");
const auth_module_1 = require("../auth.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const super_service_1 = require("./super.service");
const app_config_1 = require("../../app.config");
const auth_service_1 = require("../auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let SuperModule = class SuperModule {
};
exports.SuperModule = SuperModule;
SuperModule.provider = _1.Provider;
exports.SuperModule = SuperModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule],
        providers: [
            {
                provide: _1.Provider,
                inject: [app_config_1.AppConfigService.Key, auth_service_1.AuthService, prisma_service_1.PrismaService],
                useFactory: (configService, authService, prismaService) => configService.auth.providers.includes(_1.Provider) ? new super_service_1.SuperService(authService, prismaService) : null,
            },
        ],
        controllers: [super_controller_1.SuperController],
    })
], SuperModule);
//# sourceMappingURL=super.module.js.map