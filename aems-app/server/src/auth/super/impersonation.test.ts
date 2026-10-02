jest.mock("@auth/express/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn((opts: unknown) => opts),
}));

import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { buildExpressUser } from "@/auth";
import { AuthService } from "@/auth/auth.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { RolesGuard } from "@/auth/roles.guard";
import { SuperController } from "./super.controller";
import { SuperAuthjsService } from "./super.service";

const target = {
  id: "target",
  email: "target@example.com",
  name: "Target",
  role: "user",
  emailVerified: null,
  password: "hash",
  preferences: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
};

const requester = (role: string) => buildExpressUser({ ...target, id: `as-${role}`, role });

// scenario: impersonation-super-only
describe("signing in as another user", () => {
  const roles = ["user", "admin", "keycloak", "super"];

  describe("through Auth.js", () => {
    const service = new SuperAuthjsService(
      { registerProvider: jest.fn() } as unknown as AuthService,
      { auth: { providers: ["super"], framework: "authjs" } } as unknown as AppConfigService,
      { prisma: { user: { findUnique: jest.fn().mockResolvedValue(target) } } } as unknown as PrismaService,
    );
    const provider = service.create() as unknown as {
      authorize: (credentials: { email: string }, request: unknown) => Promise<Express.User | null>;
    };

    for (const role of roles) {
      it(`${role === "super" ? "admits" : "refuses"} a ${role}`, async () => {
        const result = await provider.authorize({ email: target.email }, { user: requester(role) });
        if (role === "super") expect(result?.id).toBe(target.id);
        else expect(result).toBeNull();
      });
    }
  });

  describe("through passport", () => {
    const guard = new RolesGuard(new Reflector());
    const context = (user: Express.User) =>
      ({
        getHandler: () => SuperController.prototype.login,
        getClass: () => SuperController,
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
      }) as unknown as ExecutionContext;

    for (const role of roles) {
      it(`${role === "super" ? "admits" : "refuses"} a ${role}`, () => {
        expect(guard.canActivate(context(requester(role)))).toBe(role === "super");
      });
    }
  });
});
