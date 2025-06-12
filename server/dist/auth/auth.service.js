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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.Session = void 0;
const common_1 = require("@nestjs/common");
const _1 = require(".");
const prisma_service_1 = require("../prisma/prisma.service");
const passport = require("passport");
const session = require("express-session");
const session_service_1 = require("./session.service");
const connect_redis_1 = require("connect-redis");
const ioredis_1 = require("ioredis");
const app_config_1 = require("../app.config");
exports.Session = "session";
const sessionStoreFactory = (prismaService, configService, logger) => {
    switch (configService.session.store) {
        case "prisma":
        case "database":
        case "postgres":
        case "postgresql":
            logger.log("Creating Prisma database session store");
            return new session_service_1.PrismaSessionStore(prismaService);
        case "redis":
        case "ioredis":
            logger.log("Creating Redis session store");
            return new connect_redis_1.RedisStore({
                client: new ioredis_1.default({
                    host: configService.redis.host,
                    port: configService.redis.port,
                }),
            });
        case "memory":
        case "":
        case undefined:
            return undefined;
        default:
            logger.warn(`Unknown session store specified: ${configService.session.store}`);
            return undefined;
    }
};
let AuthService = AuthService_1 = class AuthService {
    constructor(prismaService, configService) {
        this.prismaService = prismaService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.passport = passport;
        this.providers = new Map();
        this.serializeUser = (user, done) => done(null, user?.id);
        this.deserializeUser = (id, done) => {
            this.prismaService.prisma.user
                .findUniqueOrThrow({ where: { id }, omit: { password: true } })
                .then((user) => done(null, (0, _1.buildExpressUser)(user)))
                .catch((err) => done(err));
        };
        this.registerProvider = (provider) => {
            this.providers.set(provider.name, provider);
            this.logger.log(`Registered provider: ${provider.name}`);
        };
        this.getProviderNames = () => Array.from(this.providers.keys());
        this.getProvider = (name) => {
            const provider = this.providers.get(name);
            return provider && this.configService.auth.providers.includes(name) ? provider : undefined;
        };
        this.getAuthUser = async (req) => {
            await this.session(req, new Response(), () => { });
            const sessionStore = req.sessionStore;
            const sessionID = req.sessionID;
            return new Promise((resolve, _reject) => {
                sessionStore.get(sessionID, (err, session) => {
                    if (err || !session?.passport?.user) {
                        return resolve(undefined);
                    }
                    this.deserializeUser(session.passport.user, (_err, user) => resolve(user));
                });
            });
        };
        this.logger.log("Initializing auth service");
        this.passport.serializeUser(this.serializeUser);
        this.passport.deserializeUser(this.deserializeUser);
        this.session = session({
            cookie: {
                maxAge: configService.session.maxAge,
                secure: false,
                httpOnly: true,
                sameSite: "lax",
            },
            resave: false,
            saveUninitialized: false,
            secret: configService.session.secret,
            store: sessionStoreFactory(prismaService, configService, this.logger),
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_1.AppConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map