jest.mock("@auth/express", () => ({
  getSession: jest.fn(),
  ExpressAuth: jest.fn(),
}));

jest.mock("@auth/core/errors", () => ({
  AuthError: class AuthError extends Error {},
}));

jest.mock("./authjs.config", () => ({
  buildConfig: jest.fn(() => ({})),
}));

import { getSession } from "@auth/express";
import { AuthjsMiddleware } from "./authjs.middleware";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { Request, Response } from "express";

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

function makeConfig(framework = "authjs"): AppConfigService {
  return {
    auth: { framework, providers: [] },
  } as unknown as AppConfigService;
}

function makePrisma(user: unknown = null): PrismaService {
  return {
    prisma: {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(user),
      },
    },
  } as unknown as PrismaService;
}

function makeAuthService(): AuthService {
  return {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    registerProvider: jest.fn(),
  } as unknown as AuthService;
}

function makeSubscriptionService(): SubscriptionService {
  return {
    publish: jest.fn(),
  } as unknown as SubscriptionService;
}

function makeReq(overrides: Record<string, unknown> = {}): Request {
  return { headers: {}, ...overrides } as unknown as Request;
}

function makeRes(): Response {
  return {} as unknown as Response;
}

function makeNext(): jest.Mock {
  return jest.fn();
}

const baseUser = {
  id: "u1",
  email: "user@example.com",
  name: "User",
  role: "",
  emailVerified: null,
  password: "hash",
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
};

describe("AuthjsMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("when framework=authjs", () => {
    it("populates req.user when Auth.js session has a valid email", async () => {
      mockGetSession.mockResolvedValue({ user: { email: "user@example.com" } } as any);
      const prisma = makePrisma(baseUser);

      const middleware = new AuthjsMiddleware(makeConfig("authjs"), prisma, makeAuthService(), makeSubscriptionService());
      const req = makeReq();
      const next = makeNext();

      await middleware.use(req, makeRes(), next);

      expect(next).toHaveBeenCalled();
      expect((req as any).user).toBeDefined();
    });

    it("calls next without setting req.user when session has no email", async () => {
      mockGetSession.mockResolvedValue({ user: {} } as any);

      const middleware = new AuthjsMiddleware(
        makeConfig("authjs"),
        makePrisma(null),
        makeAuthService(),
        makeSubscriptionService(),
      );
      const req = makeReq();
      const next = makeNext();

      await middleware.use(req, makeRes(), next);

      expect(next).toHaveBeenCalled();
      expect((req as any).user).toBeUndefined();
    });

    it("calls next and does not throw when getSession rejects", async () => {
      mockGetSession.mockRejectedValue(new Error("session error"));

      const middleware = new AuthjsMiddleware(
        makeConfig("authjs"),
        makePrisma(null),
        makeAuthService(),
        makeSubscriptionService(),
      );
      const req = makeReq();
      const next = makeNext();

      await middleware.use(req, makeRes(), next);

      expect(next).toHaveBeenCalled();
    });

    it("preserves existing req.user when Auth.js returns no session", async () => {
      mockGetSession.mockResolvedValue(null);
      const existingUser = { id: "existing" } as Express.User;

      const middleware = new AuthjsMiddleware(
        makeConfig("authjs"),
        makePrisma(null),
        makeAuthService(),
        makeSubscriptionService(),
      );
      const req = makeReq({ user: existingUser });
      const next = makeNext();

      await middleware.use(req, makeRes(), next);

      expect((req as any).user).toBe(existingUser);
    });
  });

  describe("when framework is not authjs", () => {
    it("passes through immediately without touching session", () => {
      const middleware = new AuthjsMiddleware(
        makeConfig("passport"),
        makePrisma(null),
        makeAuthService(),
        makeSubscriptionService(),
      );
      const req = makeReq();
      const next = makeNext();

      void middleware.use(req, makeRes(), next);

      expect(next).toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
    });
  });

  it("subscribes to AuthService on construction", () => {
    const authService = makeAuthService();
    new AuthjsMiddleware(makeConfig(), makePrisma(null), authService, makeSubscriptionService());
    expect(authService.subscribe).toHaveBeenCalled();
  });
});
