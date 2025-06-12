import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { Request } from "express";
export declare class AuthController {
    private prismaService;
    private authService;
    private logger;
    constructor(prismaService: PrismaService, authService: AuthService);
    root(): string[];
    current(user: Express.User): import(".prisma/client").Prisma.Prisma__UserClient<{
        name: string | null;
        role: string | null;
        id: string;
        email: string;
        image: string | null;
        emailVerified: Date | null;
        preferences: PrismaJson.UserPreferences | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions> | null;
    provider(provider: string): Pick<import("@local/prisma").ProviderInfo<import("@local/prisma").Credentials>, "name" | "label" | "credentials">;
    logout(req: Request): Promise<void>;
}
