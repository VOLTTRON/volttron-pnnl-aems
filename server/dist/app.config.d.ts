import { RoleType } from "@local/common";
export interface ExtConfig {
    path?: `/ext/${string}`;
    role?: typeof RoleType.User;
    authorized?: string;
    unauthorized?: string;
}
export declare class AppConfigService {
    static Key: string;
    private logger;
    nodeEnv: string;
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
    };
    auth: {
        providers: string[];
    };
    jwt: {
        secret: string;
        expiresIn: number;
    };
    keycloak: {
        authUrl: string;
        tokenUrl: string;
        userinfoUrl: string;
        logoutUrl: string;
        clientId: string;
        clientSecret: string;
        redirectUrl: string;
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
            geojsonContribution: string;
        };
    };
    constructor();
}
declare const AppConfigToken: (() => AppConfigService) & import("@nestjs/config").ConfigFactoryKeyHost<AppConfigService>;
export { AppConfigToken };
