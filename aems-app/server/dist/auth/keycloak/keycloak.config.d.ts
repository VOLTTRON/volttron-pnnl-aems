export declare const config: (() => {
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
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
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
}>;
