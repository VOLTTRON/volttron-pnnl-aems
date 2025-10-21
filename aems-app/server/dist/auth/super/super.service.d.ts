import { AuthjsProvider, AuthService, ExpressProvider } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Strategy } from "passport-local";
import { AppConfigService } from "@/app.config";
declare const SuperPassportService_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class SuperPassportService extends SuperPassportService_base implements ExpressProvider {
    private prismaService;
    private logger;
    readonly name = "super";
    readonly label = "Super";
    readonly credentials: {
        email: {
            label: string;
            name: string;
            type: "text";
            placeholder: string;
        };
    };
    readonly endpoint = "/auth/super/login";
    constructor(authService: AuthService, configService: AppConfigService, prismaService: PrismaService);
    validate(id: string, _password: string): Promise<Express.User | null>;
}
export declare class SuperAuthjsService implements AuthjsProvider {
    private prismaService;
    private logger;
    readonly name = "super";
    readonly label = "Super";
    readonly credentials: {
        email: {
            label: string;
            name: string;
            type: "text";
            placeholder: string;
        };
    };
    readonly endpoint = "/authjs/signin/super";
    constructor(authService: AuthService, configService: AppConfigService, prismaService: PrismaService);
    create(): import("@auth/core/providers/credentials").CredentialsConfig<Record<string, import("@auth/core/providers/credentials").CredentialInput>>;
}
export {};
