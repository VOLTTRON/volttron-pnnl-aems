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
var LocalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalService = void 0;
const auth_1 = require("..");
const auth_service_1 = require("../auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const bcrypt_1 = require("@node-rs/bcrypt");
const passport_local_1 = require("passport-local");
const passport_1 = require("@nestjs/passport");
const _1 = require(".");
let LocalService = LocalService_1 = class LocalService extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy, _1.Provider) {
    constructor(authService, prismaService) {
        super({ usernameField: "email", passwordField: "password" });
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(LocalService_1.name);
        this.name = _1.Provider;
        this.label = "Local";
        this.credentials = {
            email: { label: "Email", name: "email", type: "text", placeholder: "email" },
            password: { label: "Password", name: "current-password", type: "password" },
        };
        authService.registerProvider(this);
    }
    async validate(email, password) {
        const user = await this.prismaService.prisma.user.findUnique({ where: { email: email } });
        const authorized = await (0, bcrypt_1.compare)(password, user?.password ?? "");
        if (user && authorized) {
            return (0, auth_1.buildExpressUser)(user);
        }
        else {
            return null;
        }
    }
};
exports.LocalService = LocalService;
exports.LocalService = LocalService = LocalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        prisma_service_1.PrismaService])
], LocalService);
//# sourceMappingURL=local.service.js.map