import { RoleType } from "@local/common";
export interface ExtConfig {
    path?: `/ext/${string}`;
    role?: typeof RoleType.User;
    authorized?: string;
    unauthorized?: string;
}
declare const toDurationUnit: (value: string) => "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years" | "milliseconds";
export declare class AppConfigService {
    static Key: string;
    private logger;
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
    cors: {
        origin?: string;
    };
    constructor();
}
declare const AppConfigToken: (() => AppConfigService) & import("@nestjs/config").ConfigFactoryKeyHost<AppConfigService>;
export { AppConfigToken };
