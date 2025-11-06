"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassportModule = void 0;
const common_1 = require("@nestjs/common");
const passport_middleware_1 = require("./passport.middleware");
const prisma_module_1 = require("../../prisma/prisma.module");
const auth_module_1 = require("../auth.module");
const passport_1 = require("@nestjs/passport");
let PassportModule = class PassportModule {
    configure(consumer) {
        consumer.apply(passport_middleware_1.PassportMiddleware).forRoutes("*");
    }
};
exports.PassportModule = PassportModule;
exports.PassportModule = PassportModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, passport_1.PassportModule.register({ session: true })],
        providers: [passport_middleware_1.PassportMiddleware],
        exports: [passport_middleware_1.PassportMiddleware],
    })
], PassportModule);
//# sourceMappingURL=passport.module.js.map