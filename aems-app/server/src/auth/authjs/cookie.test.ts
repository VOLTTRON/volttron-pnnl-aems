jest.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: jest.fn(() => ({})) }));

import { AppConfigService } from "@/app.config";
import { AuthService } from "@/auth/auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { buildConfig } from "./authjs.config";

const cookies = (nodeEnv: string) =>
  buildConfig(
    {
      nodeEnv,
      hostname: "aems.example",
      cors: {},
      keycloak: {},
      auth: { framework: "authjs", providers: [], debug: false },
      jwt: { secret: "s" },
      session: { maxAge: 1, store: "jwt" },
    } as unknown as AppConfigService,
    { prisma: {} } as unknown as PrismaService,
    { getProviderNames: () => [] } as unknown as AuthService,
    {} as SubscriptionService,
  ).cookies!;

// scenario: session-cookie-attributes
describe("the Auth.js session cookie", () => {
  it("is Secure and scoped to APP_HOSTNAME", () => {
    for (const nodeEnv of ["production", "development"]) {
      const options = cookies(nodeEnv).sessionToken!.options!;
      expect(options.secure).toBe(true);
      expect(options.domain).toBe("aems.example");
    }
  });

  it("leaves the __Host- csrf cookie host-only, as its prefix requires", () => {
    expect(cookies("production").csrfToken!.name).toMatch(/^__Host-/);
    expect(cookies("production").csrfToken!.options!.domain).toBeUndefined();
  });
});
