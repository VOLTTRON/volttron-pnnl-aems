import { PrismaService } from "@/prisma/prisma.service";
import { Response } from "express";
import { AppConfigService } from "@/app.config";
import "multer";
export declare class FileController {
    private prismaService;
    private configType;
    private logger;
    constructor(prismaService: PrismaService, configType: AppConfigService);
    upload(user: Express.User, res: Response, files: Express.Multer.File[]): Promise<Response<any, Record<string, any>>>;
    download(res: Response, id: string, name: string): Promise<void | Response<any, Record<string, any>>>;
}
