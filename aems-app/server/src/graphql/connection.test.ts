import { LoggerService } from "@nestjs/common";
import { WebSocketAuthService } from "@/auth/websocket.service";
import { graphqlConnection } from "./connection";

const logger: LoggerService = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const setup = (authenticate: () => Promise<unknown>) => {
  const authenticateWebSocket = jest.fn(authenticate);
  const connection = graphqlConnection({ authenticateWebSocket } as unknown as WebSocketAuthService, logger);
  const socket = {} as WebSocket;
  const request = { headers: { cookie: "session=1" } };
  return { ...connection, authenticateWebSocket, extra: { socket, request } };
};

// scenario: websocket-auth-at-connect
describe("a GraphQL WebSocket", () => {
  it("is authenticated once, at connect, and every operation on it reads that user", async () => {
    const user = { id: "u1" };
    const { onConnect, context, authenticateWebSocket, extra } = setup(() => Promise.resolve(user));

    await expect(onConnect({ extra })).resolves.toBe(true);
    expect(authenticateWebSocket).toHaveBeenCalledTimes(1);
    expect(authenticateWebSocket).toHaveBeenCalledWith(extra.request);

    for (let i = 0; i < 3; i++) expect(context({ extra: extra as never }).user).toBe(user);
    expect(authenticateWebSocket).toHaveBeenCalledTimes(1);
  });

  it("connects anonymously when the framework finds no session, leaving operations to scope-auth", async () => {
    const { onConnect, context, extra } = setup(() => Promise.resolve(undefined));
    await expect(onConnect({ extra })).resolves.toBe(true);
    expect(context({ extra: extra as never }).user).toBeUndefined();
  });

  it("is refused when authentication throws or there is no upgrade request", async () => {
    const failing = setup(() => Promise.reject(new Error("bad cookie")));
    await expect(failing.onConnect({ extra: failing.extra })).resolves.toBe(false);
    const bare = setup(() => Promise.resolve({ id: "u1" }));
    await expect(bare.onConnect({ extra: {} })).resolves.toBe(false);
  });

  it("over HTTP, reads the user the auth middleware set", () => {
    const { context } = setup(() => Promise.resolve(undefined));
    const user = { id: "u2" };
    expect(context({ req: { user } as never }).user).toBe(user);
  });
});
