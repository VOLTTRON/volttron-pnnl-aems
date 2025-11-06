"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FrameworkModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameworkModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_module_1 = require("./auth.module");
const authjs_module_1 = require("./authjs/authjs.module");
const passport_module_1 = require("./passport/passport.module");
const prisma_module_1 = require("../prisma/prisma.module");
const websocket_service_1 = require("./websocket.service");
let FrameworkModule = FrameworkModule_1 = class FrameworkModule {
    static register(options) {
        return {
            module: FrameworkModule_1,
            imports: [
                auth_module_1.AuthModule,
                ...(options?.path
                    ? [
                        authjs_module_1.AuthjsModule,
                        core_1.RouterModule.register([{ path: options.path, module: authjs_module_1.AuthjsModule }]),
                        passport_module_1.PassportModule,
                        core_1.RouterModule.register([{ path: options.path, module: passport_module_1.PassportModule }]),
                    ]
                    : [authjs_module_1.AuthjsModule, passport_module_1.PassportModule]),
            ],
            providers: [websocket_service_1.WebSocketAuthService],
            exports: [websocket_service_1.WebSocketAuthService],
        };
    }
};
exports.FrameworkModule = FrameworkModule;
exports.FrameworkModule = FrameworkModule = FrameworkModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule],
    })
], FrameworkModule);
//# sourceMappingURL=framework.module.js.map