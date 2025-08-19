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
var LocalPassportService_1, LocalAuthjsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAuthjsService = exports.LocalPassportService = void 0;
const auth_1 = require("..");
const auth_service_1 = require("../auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const bcrypt_1 = require("@node-rs/bcrypt");
const passport_local_1 = require("passport-local");
const passport_1 = require("@nestjs/passport");
const _1 = require(".");
const credentials_1 = require("@auth/express/providers/credentials");
const app_config_1 = require("../../app.config");
let LocalPassportService = LocalPassportService_1 = class LocalPassportService extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy, _1.Provider) {
    constructor(authService, configService, prismaService) {
        super({ usernameField: "email", passwordField: "password" });
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(LocalPassportService_1.name);
        this.name = _1.Provider;
        this.label = "Local";
        this.credentials = {
            email: { label: "Email", name: "email", type: "text", placeholder: "email" },
            password: { label: "Password", name: "password", type: "password" },
        };
        this.endpoint = `/auth/${_1.Provider}/login`;
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
exports.LocalPassportService = LocalPassportService;
exports.LocalPassportService = LocalPassportService = LocalPassportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        app_config_1.AppConfigService,
        prisma_service_1.PrismaService])
], LocalPassportService);
let LocalAuthjsService = LocalAuthjsService_1 = class LocalAuthjsService {
    constructor(authService, configService, prismaService) {
        this.prismaService = prismaService;
        this.logger = new common_1.Logger(LocalAuthjsService_1.name);
        this.name = _1.Provider;
        this.label = "Local";
        this.credentials = {
            email: { label: "Email", name: "email", type: "text", placeholder: "email" },
            password: { label: "Password", name: "password", type: "password" },
        };
        this.endpoint = `/authjs/signin/${_1.Provider}`;
        authService.registerProvider(this);
    }
    create() {
        const prisma = this.prismaService.prisma;
        return (0, credentials_1.default)({
            id: _1.Provider,
            type: "credentials",
            credentials: this.credentials,
            async authorize({ email, password }, _request) {
                if (typeof email !== "string" || typeof password !== "string") {
                    return null;
                }
                const user = await prisma.user.findUnique({ where: { email: email } });
                const authorized = await (0, bcrypt_1.compare)(password, user?.password ?? "");
                if (user && authorized) {
                    return (0, auth_1.buildExpressUser)(user);
                }
                else {
                    return null;
                }
            },
        });
    }
};
exports.LocalAuthjsService = LocalAuthjsService;
exports.LocalAuthjsService = LocalAuthjsService = LocalAuthjsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        app_config_1.AppConfigService,
        prisma_service_1.PrismaService])
], LocalAuthjsService);
//# sourceMappingURL=local.service.js.map