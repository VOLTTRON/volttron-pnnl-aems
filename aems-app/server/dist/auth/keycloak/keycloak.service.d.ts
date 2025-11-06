import { AuthjsProvider, AuthService, ExpressProvider } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { KeycloakUser } from ".";
import { AppConfigService } from "@/app.config";
import { SubscriptionService } from "@/subscription/subscription.service";
import { JwtService } from "@nestjs/jwt";
declare const KeycloakPassportService_base: new (...args: [options: import("passport-oauth2").StrategyOptionsWithRequest] | [options: import("passport-oauth2").StrategyOptions]) => import("passport-oauth2") & {
    validate(...args: any[]): unknown;
};
export declare class KeycloakPassportService extends KeycloakPassportService_base implements ExpressProvider {
    private configService;
    private prismaService;
    private subscriptionService;
    private jwtService;
    private logger;
    readonly name = "keycloak";
    readonly label = "Keycloak";
    readonly credentials: {};
    readonly endpoint = "/auth/keycloak/login";
    constructor(authService: AuthService, configService: AppConfigService, prismaService: PrismaService, subscriptionService: SubscriptionService, jwtService: JwtService);
    validate(accessToken: string, refreshToken: string, profile: KeycloakUser & Record<string, string>): Promise<Express.User | null>;
}
export declare class KeycloakAuthjsService implements AuthjsProvider {
    private configService;
    private logger;
    readonly name = "keycloak";
    readonly label = "Keycloak";
    readonly credentials: {};
    readonly endpoint = "/authjs/signin/keycloak";
    constructor(authService: AuthService, configService: AppConfigService);
    create(): import("@auth/core/providers").OIDCConfig<import("@auth/core/providers/keycloak").KeycloakProfile>;
}
export {};
