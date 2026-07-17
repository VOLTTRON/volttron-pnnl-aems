jest.mock("./authjs.config", () => ({
  buildConfig: jest.fn().mockReturnValue({ providers: [] }),
}));

const mockExpressAuthHandler = jest.fn();
jest.mock("@auth/express", () => ({
  ExpressAuth: jest.fn().mockReturnValue(mockExpressAuthHandler),
}));

import { AuthjsController } from "./authjs.controller";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ExpressAuth } from "@auth/express";

const mockExpressAuth = ExpressAuth as jest.MockedFunction<typeof ExpressAuth>;

function makeConfig(framework: string): AppConfigService {
  return {
    auth: { framework, providers: [] },
  } as unknown as AppConfigService;
}

function makePrisma(): PrismaService {
  return {} as unknown as PrismaService;
}

function makeAuthService(): AuthService {
  return {} as unknown as AuthService;
}

function makeSubscriptionService(): SubscriptionService {
  return {} as unknown as SubscriptionService;
}

describe("AuthjsController", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls ExpressAuth and assigns its handler to use when framework is authjs", () => {
    const config = makeConfig("authjs");
    const controller = new AuthjsController(config, makePrisma(), makeAuthService(), makeSubscriptionService());

    expect(mockExpressAuth).toHaveBeenCalledTimes(1);
    expect(controller.use).toBe(mockExpressAuthHandler);
  });

  it("assigns a passthrough next() handler to use when framework is not authjs", () => {
    const config = makeConfig("passport");
    const controller = new AuthjsController(config, makePrisma(), makeAuthService(), makeSubscriptionService());

    expect(mockExpressAuth).not.toHaveBeenCalled();

    const next = jest.fn();
    controller.use({} as any, {} as any, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
