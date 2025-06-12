"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigToken = exports.AppConfigService = void 0;
const config_1 = require("@nestjs/config");
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
class AppConfigService {
    constructor() {
        this.logger = new common_2.Logger(AppConfigService.name);
        this.nodeEnv = process.env.NODE_ENV ?? "development";
        this.port = parseInt(process.env.PORT ?? "3000");
        this.project = {
            name: process.env.PROJECT_NAME ?? "",
        };
        this.log = {
            transports: process.env.LOG_TRANSPORTS?.split(",") ?? [],
            console: {
                level: process.env.LOG_CONSOLE_LEVEL ?? "",
            },
            database: {
                level: process.env.LOG_DATABASE_LEVEL ?? "",
            },
            http: {
                level: process.env.LOG_HTTP_REQUEST_LEVEL ?? "",
            },
            prisma: {
                level: process.env.LOG_PRISMA_QUERY_LEVEL ?? "",
            },
        };
        this.session = {
            maxAge: parseInt(process.env.SESSION_MAX_AGE ?? "86400000"),
            store: process.env.SESSION_STORE ?? "",
            secret: process.env.SESSION_SECRET ?? "",
        };
        this.instanceType = process.env.INSTANCE_TYPE ?? "";
        this.graphql = {
            editor: (0, common_1.parseBoolean)(process.env.GRAPHQL_EDITOR),
            pubsub: process.env.GRAPHQL_PUBSUB ?? "",
        };
        this.file = {
            uploadPath: process.env.FILE_UPLOAD_PATH ?? "",
        };
        this.redis = {
            host: process.env.REDIS_HOST ?? "",
            port: parseInt(process.env.REDIS_PORT ?? "6379"),
        };
        this.auth = {
            providers: process.env.AUTH_PROVIDERS?.split(",") ?? [],
        };
        this.jwt = {
            secret: process.env.JWT_SECRET ?? "",
            expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? "86400"),
        };
        this.keycloak = {
            authUrl: process.env.KEYCLOAK_AUTH_URL ?? "",
            tokenUrl: process.env.KEYCLOAK_TOKEN_URL ?? "",
            userinfoUrl: process.env.KEYCLOAK_USERINFO_URL ?? "",
            logoutUrl: process.env.KEYCLOAK_LOGOUT_URL ?? "",
            clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
            redirectUrl: process.env.KEYCLOAK_REDIRECT_URL ?? "",
            passRoles: (0, common_1.parseBoolean)(process.env.KEYCLOAK_PASS_ROLES),
            defaultRole: process.env.KEYCLOAK_DEFAULT_ROLE ?? "",
        };
        this.password = {
            strength: parseInt(process.env.PASSWORD_STRENGTH ?? "0"),
            validate: (0, common_1.parseBoolean)(process.env.PASSWORD_VALIDATE),
        };
        this.database = {
            url: process.env.DATABASE_URL ?? "",
            host: process.env.DATABASE_HOST ?? "",
            port: parseInt(process.env.DATABASE_PORT ?? "5432"),
            name: process.env.DATABASE_NAME ?? "",
            schema: process.env.DATABASE_SCHEMA ?? "",
            username: process.env.DATABASE_USERNAME ?? "",
            password: process.env.DATABASE_PASSWORD ?? "",
        };
        this.ext = Object.entries(process.env)
            .filter(([key]) => key.startsWith("EXT_") && ["_PATH", "_ROLE", "_AUTHORIZED", "_UNAUTHORIZED"].find((k) => key.endsWith(k)))
            .reduce((acc, [key, value]) => {
            const [, name, option] = /ext_([a-z0-9_-]+)_(path|role|authorized|unauthorized)/i.exec(key)?.map((v) => v?.toLowerCase()) ?? [];
            const temp = acc[name] ?? {};
            switch (option) {
                case "path":
                    if (value?.startsWith("/ext/")) {
                        temp.path = value;
                    }
                    else {
                        this.logger.error(`External service configuration '${key}' path must start with "/ext/"`);
                    }
                    break;
                case "role": {
                    if (value) {
                        const role = common_1.RoleType.parse(value);
                        if (role) {
                            temp.role = role;
                        }
                        else {
                            this.logger.error(`External service configuration '${key}' role is invalid`);
                        }
                    }
                    break;
                }
                case "authorized":
                    temp.authorized = value ?? "";
                    break;
                case "unauthorized":
                    temp.unauthorized = value ?? "";
                    break;
                default:
                    return acc;
            }
            acc[name] = temp;
            return acc;
        }, {});
        this.proxy = {
            protocol: process.env.PROXY_PROTOCOL ?? "",
            host: process.env.PROXY_HOST ?? "",
            port: process.env.PROXY_PORT ?? "",
        };
        this.service = {
            log: {
                prune: (0, common_1.parseBoolean)(process.env.SERVICE_LOG_PRUNE),
            },
            seed: {
                dataPath: process.env.SERVICE_SEED_DATA_PATH ?? "",
                geojsonContribution: process.env.SERVICE_SEED_GEOJSON_CONTRIBUTION ?? "",
            },
        };
    }
}
exports.AppConfigService = AppConfigService;
AppConfigService.Key = AppConfigService.name;
const configFactory = () => new AppConfigService();
const AppConfigToken = (0, config_1.registerAs)(AppConfigService.name, configFactory);
exports.AppConfigToken = AppConfigToken;
AppConfigService.Key = AppConfigToken.KEY;
//# sourceMappingURL=app.config.js.map