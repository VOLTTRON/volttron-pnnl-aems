"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigToken = exports.AppConfigService = void 0;
const config_1 = require("@nestjs/config");
const common_1 = require("@local/common");
const common_2 = require("@nestjs/common");
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const toDurationUnit = (value) => {
    switch (value?.toLowerCase()) {
        case "s":
        case "sec":
        case "second":
        case "seconds":
            return "seconds";
        case "m":
        case "min":
        case "minute":
        case "minutes":
            return "minutes";
        case "h":
        case "hr":
        case "hour":
        case "hours":
            return "hours";
        case "d":
        case "day":
        case "days":
            return "days";
        case "w":
        case "wk":
        case "week":
        case "weeks":
            return "weeks";
        case "mo":
        case "month":
        case "months":
            return "months";
        case "y":
        case "yr":
        case "year":
        case "years":
            return "years";
        default:
            return "milliseconds";
    }
};
class AppConfigService {
    constructor() {
        this.logger = new common_2.Logger(AppConfigService.name);
        this.nodeEnv = process.env.NODE_ENV ?? "development";
        this.printEnv = (0, common_1.parseBoolean)(process.env.PRINT_ENV);
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
                level: process.env.LOG_HTTP_LEVEL ?? "",
            },
            prisma: {
                level: process.env.LOG_PRISMA_LEVEL ?? "",
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
            host: process.env.REDIS_HOST ?? "localhost",
            port: parseInt(process.env.REDIS_PORT ?? "6379"),
            username: process.env.REDIS_USERNAME || undefined,
            password: process.env.REDIS_PASSWORD || undefined,
            db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
        };
        this.auth = {
            framework: process.env.AUTH_FRAMEWORK ?? "passport",
            providers: process.env.AUTH_PROVIDERS?.split(",") ?? [],
        };
        this.jwt = {
            secret: process.env.JWT_SECRET ?? "",
            expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? "86400"),
        };
        this.keycloak = {
            authUrl: process.env.KEYCLOAK_AUTH_URL ?? "",
            tokenUrl: process.env.KEYCLOAK_TOKEN_URL ?? "",
            callbackUrl: process.env.KEYCLOAK_CALLBACK_URL ?? "",
            userinfoUrl: process.env.KEYCLOAK_USERINFO_URL ?? "",
            certsUrl: process.env.KEYCLOAK_CERTS_URL ?? "",
            logoutUrl: process.env.KEYCLOAK_LOGOUT_URL ?? "",
            scope: process.env.KEYCLOAK_SCOPE ?? "",
            clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
            issuerUrl: process.env.KEYCLOAK_ISSUER_URL ?? "",
            wellKnownUrl: process.env.KEYCLOAK_WELL_KNOWN_URL ?? "",
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
                batchSize: parseInt(process.env.SERVICE_SEED_BATCH_SIZE ?? "100"),
                geojsonContribution: process.env.SERVICE_SEED_GEOJSON_CONTRIBUTION ?? "",
            },
            cleanup: {
                age: {
                    value: parseInt(/(\d+)\s*(\w*)/i.exec(process.env.SERVICE_CLEANUP_AGE ?? "")?.[1] ?? "0"),
                    unit: toDurationUnit(/(\d+)\s*(\w*)/i.exec(process.env.SERVICE_CLEANUP_AGE ?? "")?.[0] ?? "milliseconds"),
                },
            },
            config: {
                timeout: parseInt(process.env.SERVICE_CONFIG_TIMEOUT ?? "5000"),
                authUrl: process.env.SERVICE_CONFIG_AUTH_URL ?? "",
                apiUrl: process.env.SERVICE_CONFIG_API_URL ?? "",
                username: process.env.SERVICE_CONFIG_USERNAME ?? "",
                password: process.env.SERVICE_CONFIG_PASSWORD ?? "",
                verbose: (0, common_1.parseBoolean)(process.env.SERVICE_CONFIG_VERBOSE),
                holidaySchedule: (0, common_1.parseBoolean)(process.env.SERVICE_CONFIG_HOLIDAY_SCHEDULE),
            },
            control: {
                templatePaths: (process.env.SERVICE_SETUP_TEMPLATE_PATHS ?? "")
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean),
            },
            setup: {
                ilcPaths: (process.env.SERVICE_SETUP_ILC_PATHS ?? "")
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean),
                thermostatPaths: (process.env.SERVICE_SETUP_THERMOSTAT_PATHS ?? "")
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean),
            },
        };
        this.volttron = {
            ca: process.env.VOLTTRON_CA
                ? (0, node_fs_1.readFileSync)((0, node_path_1.resolve)(__dirname, process.env.VOLTTRON_CA ?? "")).toString("utf-8")
                : "",
        };
        this.cors = {
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : undefined,
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