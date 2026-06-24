// @auth/express (and its transitive deps) are ESM-only — mock the entire
// authjs middleware module so the test runner never has to parse them.
jest.mock("./authjs/authjs.middleware", () => ({
  AuthjsMiddleware: class {
    use = jest.fn().mockResolvedValue(undefined);
  },
}));

jest.mock("ioredis", () => {
  const MockRedis = jest.fn().mockImplementation(() => ({ on: jest.fn() }));
  return { __esModule: true, default: MockRedis };
});

jest.mock("connect-redis", () => ({ RedisStore: jest.fn().mockImplementation(() => ({})) }));

jest.mock("./auth.service", () => ({
  AuthService: class {
    providers = new Map();
    subscribe = jest.fn();
    unsubscribe = jest.fn();
  },
}));

jest.mock("./passport/passport.middleware", () => ({
  PassportMiddleware: class {
    use = jest.fn().mockResolvedValue(undefined);
    serializeUser = jest.fn();
    deserializeUser = jest.fn();
    onModuleDestroy = jest.fn();
  },
}));

import { WebSocketAuthService } from "./websocket.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { Request } from "express";

function makeConfig(framework: "authjs" | "passport" | "none" = "authjs"): AppConfigService {
  return { auth: { framework, providers: [] } } as unknown as AppConfigService;
}

function makeAuthjs() {
  return { use: jest.fn() };
}

function makePassport() {
  return { use: jest.fn() };
}

describe("WebSocketAuthService", () => {
  const prismaService = {} as PrismaService;

  it("calls AuthjsMiddleware.use when framework is 'authjs'", async () => {
    const authjs = makeAuthjs();
    authjs.use.mockImplementation((_req: Request, _res: unknown, next: () => void) => {
      (_req as { user?: object }).user = { id: "u1" };
      next();
    });
    const passport = makePassport();
    const service = new WebSocketAuthService(makeConfig("authjs"), authjs as any, passport as any, prismaService);
    const req = {} as Request;
    const user = await service.authenticateWebSocket(req);
    expect(authjs.use).toHaveBeenCalled();
    expect(user).toEqual({ id: "u1" });
  });

  it("calls PassportMiddleware.use when framework is 'passport'", async () => {
    const authjs = makeAuthjs();
    const passport = makePassport();
    passport.use.mockImplementation((_req: Request, _res: unknown, next: () => void) => {
      (_req as { user?: object }).user = { id: "u2" };
      next();
    });
    const service = new WebSocketAuthService(makeConfig("passport"), authjs as any, passport as any, prismaService);
    const req = {} as Request;
    const user = await service.authenticateWebSocket(req);
    expect(passport.use).toHaveBeenCalled();
    expect(user).toEqual({ id: "u2" });
  });

  it("returns undefined when no auth framework is configured", async () => {
    const authjs = makeAuthjs();
    const passport = makePassport();
    const service = new WebSocketAuthService(makeConfig("none"), authjs as any, passport as any, prismaService);
    const req = {} as Request;
    const user = await service.authenticateWebSocket(req);
    expect(user).toBeUndefined();
    expect(authjs.use).not.toHaveBeenCalled();
    expect(passport.use).not.toHaveBeenCalled();
  });

  it("returns undefined when the middleware throws", async () => {
    const authjs = makeAuthjs();
    authjs.use.mockRejectedValue(new Error("auth failure"));
    const passport = makePassport();
    const service = new WebSocketAuthService(makeConfig("authjs"), authjs as any, passport as any, prismaService);
    const req = {} as Request;
    const user = await service.authenticateWebSocket(req);
    expect(user).toBeUndefined();
  });
});
