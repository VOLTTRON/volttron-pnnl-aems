import { Request, Response } from "express";
export declare class KeycloakController {
    private logger;
    login(req: Request, user: Express.User): Promise<void>;
    callback(req: Request, res: Response, user: Express.User): Promise<void>;
}
