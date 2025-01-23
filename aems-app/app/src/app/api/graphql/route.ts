import authUser from "@/auth/authUser";
import { apollo } from "@/graphql";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "node:http";
import { logger } from "@/logging";
import { useServer } from "graphql-ws/lib/use/ws";
import { schema } from "@/graphql/schema";
import { initContextCache } from "@pothos/core";
import { pubsub } from "@/graphql/pubsub";
import { Disposable } from "graphql-ws";

let generator = 0;
const clients = new WeakMap<WebSocket, number>();
const servers = new WeakMap<WebSocketServer, number>();
const cleanup = new FinalizationRegistry(async (v: Disposable) => {
  await v.dispose();
});

const handleRequest = startServerAndCreateNextHandler(apollo, {
  context: async () => ({
    // Adding this will prevent any issues if you server implementation
    // copies or extends the context object before passing it to your resolvers
    ...initContextCache(),
    authUser: await authUser(),
    pubsub: pubsub,
  }),
});

async function handleSocket(client: WebSocket, req: IncomingMessage, server: WebSocketServer) {
  if (!servers.has(server)) {
    logger.info(`Associating WebSocket server with GraphQL server`);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const disposable = useServer(
      {
        schema: schema,
        context: async (ctx, _message, _args) => {
          return {
            // Adding this will prevent any issues if you server implementation
            // copies or extends the context object before passing it to your resolvers
            ...initContextCache(),
            authUser: await authUser(ctx.extra.request),
            pubsub: pubsub,
          };
        },
      },
      server
    );
    cleanup.register(server, disposable);
    servers.set(server, generator++);
  }
  if (!clients.has(client)) {
    logger.debug("WebSocket connection established");
    client
      .on("open", () => {
        logger.debug("WebSocket connection opened");
      })
      .on("message", (message) => {
        logger.debug(`Received WebSocket message: ${message}`);
      })
      .on("error", (error) => {
        logger.debug(error, `WebSocket error: ${error.message}`);
      })
      .on("close", (code, reason) => {
        logger.debug(`WebSocket connection closed: (${code}) ${reason}`);
        clients.delete(client);
      });
    server.emit("connection", client, req);
    clients.set(client, generator++);
  }
}

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS, handleSocket as SOCKET };
