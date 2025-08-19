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
var PassportMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassportMiddleware = exports.sessionStoreFactory = exports.Session = void 0;
const common_1 = require("@nestjs/common");
const __1 = require("..");
const prisma_service_1 = require("../../prisma/prisma.service");
const passport = require("passport");
const session = require("express-session");
const session_service_1 = require("./session.service");
const connect_redis_1 = require("connect-redis");
const ioredis_1 = require("ioredis");
const app_config_1 = require("../../app.config");
const auth_service_1 = require("../auth.service");
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
                    username: configService.redis.username,
                    password: configService.redis.password,
                    db: configService.redis.db,
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
exports.sessionStoreFactory = sessionStoreFactory;
let PassportMiddleware = PassportMiddleware_1 = class PassportMiddleware {
    constructor(configService, prismaService, authService) {
        this.configService = configService;
        this.prismaService = prismaService;
        this.authService = authService;
        this.logger = new common_1.Logger(PassportMiddleware_1.name);
        this.passport = passport;
        this.serializeUser = (user, done) => done(null, user?.id);
        this.deserializeUser = (id, done) => {
            this.prismaService.prisma.user
                .findUniqueOrThrow({ where: { id }, omit: { password: true } })
                .then((user) => done(null, (0, __1.buildExpressUser)(user)))
                .catch((err) => done(err));
        };
        authService.subscribe(this.update.bind(this));
        if (this.configService.auth.framework === "passport") {
            this.logger.log("Initializing Passport auth service");
            this.passport.serializeUser(this.serializeUser);
            this.passport.deserializeUser(this.deserializeUser);
            this.use = session({
                cookie: {
                    maxAge: configService.session.maxAge,
                    secure: false,
                    httpOnly: true,
                    sameSite: "lax",
                },
                resave: false,
                saveUninitialized: false,
                secret: configService.session.secret,
                store: (0, exports.sessionStoreFactory)(prismaService, configService, this.logger),
            });
        }
        else {
            this.use = (_req, _res, next) => next();
        }
    }
    update(provider) {
        if ("validate" in provider) {
            this.logger.warn(`Authjs provider registered after middleware initialization: ${provider.name}`);
        }
    }
    onModuleDestroy() {
        this.authService.unsubscribe(this.update.bind(this));
        this.logger.debug("Passport middleware shutdown");
    }
};
exports.PassportMiddleware = PassportMiddleware;
exports.PassportMiddleware = PassportMiddleware = PassportMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(app_config_1.AppConfigService.Key)),
    __metadata("design:paramtypes", [app_config_1.AppConfigService,
        prisma_service_1.PrismaService,
        auth_service_1.AuthService])
], PassportMiddleware);
//# sourceMappingURL=passport.middleware.js.map