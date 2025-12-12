import { registerAs } from "@nestjs/config";
import { Normalization, parseBoolean, RoleType } from "@local/common";
import { Logger } from "@nestjs/common";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

export interface ExtConfig {
  path?: `/ext/${string}`;
  role?: typeof RoleType.User;
  authorized?: string;
  unauthorized?: string;
}

const typeofChecks = (value: string): value is "pkce" | "state" | "none" | "nonce" => {
  return ["pkce", "state", "none", "nonce"].includes(value);
};

const toDurationUnit = (value: string) => {
  switch (value?.toLowerCase()) {
    case "s":
    case "sec":
    case "second":
    case "seconds":
      return "seconds" as const;
    case "m":
    case "min":
    case "minute":
    case "minutes":
      return "minutes" as const;
    case "h":
    case "hr":
    case "hour":
    case "hours":
      return "hours" as const;
    case "d":
    case "day":
    case "days":
      return "days" as const;
    case "w":
    case "wk":
    case "week":
    case "weeks":
      return "weeks" as const;
    case "mo":
    case "month":
    case "months":
      return "months" as const;
    case "y":
    case "yr":
    case "year":
    case "years":
      return "years" as const;
    default:
      return "milliseconds" as const;
  }
};

/**
 * This service requires a key when injecting it into a module.
 *
 * @example
 * ```typescript
 * import { AppConfigService } from "@/app.config";
 * ...
 * constructor(@Inject(AppConfigService.Key) private configService: AppConfigService){}
 * ```
 */
export class AppConfigService {
  static Key = AppConfigService.name;

  private logger = new Logger(AppConfigService.name);

  nodeEnv: string;
  printEnv: boolean;
  port: number;
  project: {
    name: string;
  };
  log: {
    transports: string[];
    console: {
      level: string;
    };
    database: {
      level: string;
    };
    http: {
      level: string;
    };
    prisma: {
      level: string;
    };
  };
  session: {
    maxAge: number;
    store: string;
    secret: string;
  };
  instanceType: string;
  graphql: {
    editor: boolean;
    pubsub: string;
  };
  file: {
    uploadPath: string;
  };
  redis: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    db?: number;
  };
  auth: {
    framework: string;
    providers: string[];
    debug: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: number;
  };
  keycloak: {
    authUrl: string;
    tokenUrl: string;
    callbackUrl: string;
    userinfoUrl: string;
    certsUrl: string;
    logoutUrl: string;
    scope: string;
    clientId: string;
    clientSecret: string;
    issuerUrl: string;
    wellKnownUrl: string;
    passRoles: boolean;
    defaultRole: string;
    checks?: ("pkce" | "state" | "none" | "nonce")[];
  };
  password: {
    strength: number;
    validate: boolean;
  };
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    schema: string;
    username: string;
    password: string;
  };
  ext: Record<string, ExtConfig>;
  proxy: {
    protocol: string;
    host: string;
    port: string;
  };
  service: {
    log: {
      prune: boolean;
    };
    seed: {
      dataPath: string;
      batchSize: number;
      geojsonContribution: string;
    };
    cleanup: {
      age: {
        value: number;
        unit: ReturnType<typeof toDurationUnit>;
      };
    };
    config: {
      timeout: number;
      authUrl: string;
      apiUrl: string;
      username: string;
      password: string;
      verbose: boolean;
      holidaySchedule: boolean;
    };
    control: {
      templatePaths: string[];
    };
    setup: {
      ilcPaths: string[];
      thermostatPaths: string[];
    };
  };
  volttron: {
    ca: string;
    mocked: boolean;
  };
  grafana: {
    path: string;
    url: string;
    configPath: string;
    username: string;
    password: string;
  };
  cors: {
    origin?: string;
  };

  normalize = Normalization.process(Normalization.Trim, Normalization.Compact, Normalization.Lowercase);

  readFile(file: string): string {
    try {
      return readFileSync(file).toString("utf-8");
    } catch (error) {
      this.logger.error(`Failed to read file: ${file}`, error);
      return "";
    }
  }

  constructor() {
    this.nodeEnv = process.env.NODE_ENV ?? "development";
    this.printEnv = parseBoolean(process.env.PRINT_ENV);
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
      editor: parseBoolean(process.env.GRAPHQL_EDITOR),
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
      debug: parseBoolean(process.env.AUTH_DEBUG),
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
      passRoles: parseBoolean(process.env.KEYCLOAK_PASS_ROLES),
      defaultRole: process.env.KEYCLOAK_DEFAULT_ROLE ?? "",
      checks: process.env.KEYCLOAK_CHECKS?.split(/[, ]/g).map(this.normalize).filter(typeofChecks) || undefined,
    };
    this.password = {
      strength: parseInt(process.env.PASSWORD_STRENGTH ?? "0"),
      validate: parseBoolean(process.env.PASSWORD_VALIDATE),
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
      .filter(
        ([key]) =>
          key.startsWith("EXT_") && ["_PATH", "_ROLE", "_AUTHORIZED", "_UNAUTHORIZED"].find((k) => key.endsWith(k)),
      )
      .reduce(
        (acc, [key, value]) => {
          const [, name, option] =
            /ext_([a-z0-9_-]+)_(path|role|authorized|unauthorized)/i.exec(key)?.map((v) => v?.toLowerCase()) ?? [];
          const temp = acc[name] ?? {};
          switch (option) {
            case "path":
              if (value?.startsWith("/ext/")) {
                temp.path = value as `/ext/${string}`;
              } else {
                this.logger.error(`External service configuration '${key}' path must start with "/ext/"`);
              }
              break;
            case "role": {
              if (value) {
                const role = RoleType.parse(value);
                if (role) {
                  temp.role = role;
                } else {
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
        },
        {} as Record<string, ExtConfig>,
      );
    this.proxy = {
      protocol: process.env.PROXY_PROTOCOL ?? "",
      host: process.env.PROXY_HOST ?? "",
      port: process.env.PROXY_PORT ?? "",
    };
    this.service = {
      log: {
        prune: parseBoolean(process.env.SERVICE_LOG_PRUNE),
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
        verbose: parseBoolean(process.env.SERVICE_CONFIG_VERBOSE),
        holidaySchedule: parseBoolean(process.env.SERVICE_CONFIG_HOLIDAY_SCHEDULE),
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
      ca: process.env.VOLTTRON_CA ? this.readFile(resolve(__dirname, process.env.VOLTTRON_CA ?? "")) : "",
      mocked: parseBoolean(process.env.VOLTTRON_MOCKED),
    };
    this.grafana = {
      path: process.env.GRAFANA_PATH ?? "/gdb",
      url: process.env.GRAFANA_URL ?? "",
      configPath: process.env.GRAFANA_CONFIG_PATH ?? "",
      username: process.env.GRAFANA_USERNAME ?? "",
      password: process.env.GRAFANA_PASSWORD ?? "",
    };
    this.cors = {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : undefined,
    };
  }
}

const configFactory = () => new AppConfigService();

const AppConfigToken = registerAs(AppConfigService.name, configFactory);
AppConfigService.Key = AppConfigToken.KEY;

export { AppConfigToken };
