import { AuthService, ExpressProvider } from "@/auth/auth.service";
import { Strategy } from "passport-http-bearer";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
declare const BearerPassportService_base: new (...args: [] | [options: import("passport-http-bearer").IStrategyOptions]) => Strategy<import("passport-http-bearer").VerifyFunctions> & {
    validate(...args: any[]): unknown;
};
export declare class BearerPassportService extends BearerPassportService_base implements ExpressProvider {
    private prismaService;
    private jwtService;
    readonly name = "bearer";
    readonly label = "Bearer";
    readonly credentials: {};
    readonly endpoint: string;
    constructor(authService: AuthService, configService: AppConfigService, prismaService: PrismaService, jwtService: JwtService);
    validate(token: string | null | undefined): Promise<Express.User | null>;
}
export {};
