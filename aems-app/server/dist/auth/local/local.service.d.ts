import { AuthjsProvider, AuthService, ExpressProvider } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Strategy } from "passport-local";
import { AppConfigService } from "@/app.config";
declare const LocalPassportService_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalPassportService extends LocalPassportService_base implements ExpressProvider {
    private prismaService;
    private logger;
    readonly name = "local";
    readonly label = "Local";
    readonly credentials: {
        email: {
            label: string;
            name: string;
            type: "text";
            placeholder: string;
        };
        password: {
            label: string;
            name: string;
            type: "password";
        };
    };
    readonly endpoint = "/auth/local/login";
    constructor(authService: AuthService, configService: AppConfigService, prismaService: PrismaService);
    validate(email: string, password: string): Promise<Express.User | null>;
}
export declare class LocalAuthjsService implements AuthjsProvider {
    private prismaService;
    private logger;
    readonly name = "local";
    readonly label = "Local";
    readonly credentials: {
        email: {
            label: string;
            name: string;
            type: "text";
            placeholder: string;
        };
        password: {
            label: string;
            name: string;
            type: "password";
        };
    };
    readonly endpoint = "/authjs/signin/local";
    constructor(authService: AuthService, configService: AppConfigService, prismaService: PrismaService);
    create(): import("@auth/core/providers/credentials").CredentialsConfig<Record<string, import("@auth/core/providers/credentials").CredentialInput>>;
}
export {};
