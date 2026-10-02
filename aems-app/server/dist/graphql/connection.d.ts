import { Request } from "express";
import { IncomingMessage } from "node:http";
import { LoggerService } from "@nestjs/common";
import { WebSocketAuthService } from "@/auth/websocket.service";
import { Context } from ".";
export declare const graphqlConnection: (wsAuthService: WebSocketAuthService, wsLogger: LoggerService) => {
    context: ({ req, extra, }: {
        req?: Request;
        res?: Response;
        extra?: {
            socket?: WebSocket;
            request?: IncomingMessage;
        };
    }) => Context;
    onConnect: (context: any) => Promise<boolean>;
};
