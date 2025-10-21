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
var KeycloakPassportService_1, KeycloakAuthjsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakAuthjsService = exports.KeycloakPassportService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth.service");
const auth_1 = require("..");
const passport_1 = require("@nestjs/passport");
const passport_oauth2_1 = require("passport-oauth2");
const prisma_service_1 = require("../../prisma/prisma.service");
const _1 = require(".");
const app_config_1 = require("../../app.config");
const common_2 = require("@local/common");
const subscription_service_1 = require("../../subscription/subscription.service");
const node_crypto_1 = require("node:crypto");
const lodash_1 = require("lodash");
const jwt_1 = require("@nestjs/jwt");
const constants_1 = require("@local/common/dist/constants");
const keycloak_1 = require("@auth/express/providers/keycloak");
let KeycloakPassportService = KeycloakPassportService_1 = class KeycloakPassportService extends (0, passport_1.PassportStrategy)(passport_oauth2_1.Strategy, _1.Provider) {
    constructor(authService, configService, prismaService, subscriptionService, jwtService) {
        super({
            authorizationURL: configService.keycloak.authUrl,
            tokenURL: configService.keycloak.tokenUrl,
            callbackURL: configService.keycloak.callbackUrl,
            clientID: configService.keycloak.clientId,
            clientSecret: configService.keycloak.clientSecret,
            scope: configService.keycloak.scope,
        });
        this.configService = configService;
        this.prismaService = prismaService;
        this.subscriptionService = subscriptionService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(KeycloakPassportService_1.name);
        this.name = _1.Provider;
        this.label = "Keycloak";
        this.credentials = {};
        this.endpoint = `/auth/${_1.Provider}/login`;
        authService.registerProvider(this);
    }
    async validate(accessToken, refreshToken, profile) {
        this.logger.debug(`Keycloak initial profile: `, profile);
        const token = this.jwtService.decode(accessToken);
        this.logger.debug(`Keycloak decoded token: `, token);
        const rolesFromToken = token?.realm_access?.roles || [];
        const roles = rolesFromToken.map((v) => common_2.RoleType.parse(v)?.enum).filter((0, common_2.typeofEnum)(constants_1.RoleEnum));
        if (!profile.email || !profile.name) {
            (0, lodash_1.merge)(profile, token);
        }
        if (!profile.email || !profile.name) {
            (0, lodash_1.merge)(profile, await fetch(`${this.configService.keycloak.userinfoUrl}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
                .then((res) => res.json())
                .catch((err) => this.logger.warn("Failed to fetch user info from Keycloak.", err)));
        }
        this.logger.debug(`Keycloak profile populated with token and user info: `, profile);
        const id = profile.id || profile.sub;
        let user = await this.prismaService.prisma.user
            .findFirst({
            where: {
                OR: [{ email: profile.email }, { accounts: { some: { provider: "keycloak", providerAccountId: id } } }],
            },
            include: { accounts: { where: { provider: "keycloak" } } },
        })
            .then((user) => (user ? (0, lodash_1.omit)(user, ["password"]) : null));
        if (user) {
            if (profile.name !== user.name ||
                profile.email !== user.email ||
                profile.email_verified !== !!user.emailVerified) {
                user = await this.prismaService.prisma.user
                    .update({
                    where: { id: user.id },
                    data: {
                        name: profile.name,
                        email: profile.email,
                        emailVerified: profile.email_verified ? new Date() : null,
                        ...(this.configService.keycloak.passRoles ? { role: roles.join(" ") ?? "" } : {}),
                    },
                    include: { accounts: { where: { provider: "keycloak" } } },
                })
                    .then(async (user) => {
                    await this.subscriptionService.publish("User", { topic: "User", id: user.id, mutation: common_2.Mutation.Updated });
                    await this.subscriptionService.publish(`User/${user.id}`, {
                        topic: "User",
                        id: user.id,
                        mutation: common_2.Mutation.Updated,
                    });
                    return user;
                });
            }
        }
        else {
            user = await this.prismaService.prisma.user
                .create({
                data: {
                    name: profile.name,
                    email: profile.email,
                    emailVerified: profile.email_verified ? new Date() : null,
                    password: (0, node_crypto_1.randomUUID)(),
                    ...(this.configService.keycloak.passRoles
                        ? { role: roles.join(" ") ?? "" }
                        : { role: common_2.RoleType.parse(this.configService.keycloak.defaultRole ?? "")?.enum ?? "" }),
                },
                include: { accounts: { where: { provider: "keycloak" } } },
            })
                .then(async (user) => {
                await this.subscriptionService.publish("User", { topic: "User", id: user.id, mutation: common_2.Mutation.Created });
                return user;
            });
        }
        this.logger.debug(`Keycloak user found or created: `, user);
        if (!user) {
            throw new Error("Failed to update or create user");
        }
        if (user.accounts.length === 0) {
            const value = await this.prismaService.prisma.account
                .create({
                data: {
                    type: "oauth",
                    provider: "keycloak",
                    providerAccountId: id,
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    session_state: null,
                    user: { connect: { id: user.id } },
                },
                include: { user: { include: { accounts: { where: { provider: "keycloak" } } } } },
            })
                .then(async (account) => {
                await this.subscriptionService.publish("Account", {
                    topic: "Account",
                    id: account.id,
                    mutation: common_2.Mutation.Created,
                });
                return account;
            });
            user = value.user;
        }
        else {
            const value = await this.prismaService.prisma.account
                .update({
                where: { id: user.accounts[0].id },
                data: {
                    providerAccountId: id,
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    session_state: null,
                },
                include: { user: { include: { accounts: { where: { provider: "keycloak" } } } } },
            })
                .then(async (account) => {
                await this.subscriptionService.publish("Account", {
                    topic: "Account",
                    id: account.id,
                    mutation: common_2.Mutation.Updated,
                });
                return account;
            });
            user = value.user;
        }
        return (0, auth_1.buildExpressUser)(user);
    }
};
exports.KeycloakPassportService = KeycloakPassportService;
exports.KeycloakPassportService = KeycloakPassportService = KeycloakPassportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        app_config_1.AppConfigService,
        prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService,
        jwt_1.JwtService])
], KeycloakPassportService);
let KeycloakAuthjsService = KeycloakAuthjsService_1 = class KeycloakAuthjsService {
    constructor(authService, configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(KeycloakAuthjsService_1.name);
        this.name = _1.Provider;
        this.label = "Keycloak";
        this.credentials = {};
        this.endpoint = `/authjs/signin/${_1.Provider}`;
        authService.registerProvider(this);
    }
    create() {
        return (0, keycloak_1.default)({
            allowDangerousEmailAccountLinking: true,
            id: _1.Provider,
            checks: this.configService.keycloak.checks,
            clientId: this.configService.keycloak.clientId,
            clientSecret: this.configService.keycloak.clientSecret,
            issuer: this.configService.keycloak.issuerUrl || undefined,
            redirectProxyUrl: this.configService.keycloak.callbackUrl || undefined,
            wellKnown: this.configService.keycloak.wellKnownUrl || undefined,
            authorization: this.configService.keycloak.authUrl || undefined,
            token: this.configService.keycloak.tokenUrl || undefined,
            userinfo: this.configService.keycloak.userinfoUrl || undefined,
        });
    }
};
exports.KeycloakAuthjsService = KeycloakAuthjsService;
exports.KeycloakAuthjsService = KeycloakAuthjsService = KeycloakAuthjsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        app_config_1.AppConfigService])
], KeycloakAuthjsService);
//# sourceMappingURL=keycloak.service.js.map