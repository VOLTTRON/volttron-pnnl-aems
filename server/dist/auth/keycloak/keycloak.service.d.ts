import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { KeycloakUser } from ".";
import { AppConfigService } from "@/app.config";
import { Credentials, ProviderInfo } from "@local/common";
declare const KeycloakService_base: new (...args: [options: import("passport-oauth2").StrategyOptionsWithRequest] | [options: import("passport-oauth2").StrategyOptions]) => import("passport-oauth2") & {
    validate(...args: any[]): unknown;
};
export declare class KeycloakService extends KeycloakService_base implements ProviderInfo<Credentials> {
    private prismaService;
    readonly name = "keycloak";
    readonly label = "Keycloak";
    readonly credentials: {};
    constructor(authService: AuthService, prismaService: PrismaService, configService: AppConfigService);
    validate(_accessToken: string, _refreshToken: string, profile: KeycloakUser & Record<string, string>): Promise<Express.User | null>;
}
export {};
