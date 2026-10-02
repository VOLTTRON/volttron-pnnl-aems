import { Request } from "express";
import { IncomingMessage } from "node:http";
import { LoggerService } from "@nestjs/common";
import { WebSocketAuthService } from "@/auth/websocket.service";
import { Context } from ".";

/**
 * How a GraphQL operation learns its caller: an HTTP request carries the user the auth middleware
 * set; a WebSocket is authenticated once, at connect, and every operation on it reads that user.
 */
export const graphqlConnection = (wsAuthService: WebSocketAuthService, wsLogger: LoggerService) => ({
  context: ({
    req,
    extra,
  }: {
    req?: Request;
    res?: Response;
    extra?: { socket?: WebSocket; request?: IncomingMessage };
  }): Context => {
    let user: Express.User | undefined;
    if (req?.user) {
      // HTTP request - use existing middleware user
      user = req.user;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    } else if ((extra?.socket as any)?.user) {
      // WebSocket request - user authenticated during connection_init
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      user = (extra?.socket as any)?.user as Express.User | undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    } else if ((extra?.request as any)?.user) {
      // Fallback for WebSocket request - user from upgrade handler
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      user = (extra?.request as any)?.user as Express.User | undefined;
    }

    return {
      user,
    };
  },
  onConnect: async (context: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { extra } = context;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const request = extra?.request as IncomingMessage | undefined;

    if (!request) {
      wsLogger.warn("Rejecting WS connect: no upgrade request on extra");
      return false;
    }

    try {
      const user = await wsAuthService.authenticateWebSocket(request as Request);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (extra?.socket) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        extra.socket.user = user;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request as any).user = user;
      // Anonymous connects are allowed here; per-subscription scope-auth
      // enforces authentication at operation time.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      wsLogger.log(user ? `WS connect: user=${(user as any).id ?? "?"}` : "WS connect: anonymous");
      return true;
    } catch (error) {
      wsLogger.warn(`WS authenticateWebSocket threw: ${(error as Error)?.message ?? error}`);
      return false;
    }
  },
});
