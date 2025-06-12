import { AuthService } from "@/auth/auth.service";
import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
export declare class PothosAuthMiddleware implements NestMiddleware {
    private authService;
    constructor(authService: AuthService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
