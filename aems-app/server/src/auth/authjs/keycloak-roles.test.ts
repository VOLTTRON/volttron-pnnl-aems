jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

import { buildConfig } from "./authjs.config";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";
import { SubscriptionService } from "@/subscription/subscription.service";

const config = (passRoles: boolean) =>
  ({
    nodeEnv: "test",
    cors: {},
    keycloak: { passRoles, defaultRole: "user" },
    auth: { framework: "authjs", providers: ["keycloak"], debug: false },
    jwt: { secret: "s" },
    session: { maxAge: 86400, store: "database" },
  }) as unknown as AppConfigService;

const prisma = (existing: unknown) =>
  ({
    prisma: {
      user: {
        findFirst: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue({ id: "u1" }),
        create: jest.fn().mockResolvedValue({ id: "u1" }),
      },
    },
  }) as unknown as PrismaService;

const subscription = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as SubscriptionService;

// An access token as Keycloak issues it; only the payload is read.
const accessToken = (roles: string[]) =>
  `h.${Buffer.from(JSON.stringify({ realm_access: { roles } })).toString("base64url")}.s`;

// The account exactly as Auth.js hands it to signIn: nothing but what Keycloak returned.
const account = (roles: string[]) => ({
  provider: "keycloak",
  type: "oidc",
  providerAccountId: "kc-1",
  access_token: accessToken(roles),
});

const signIn = (p: PrismaService, passRoles: boolean, roles: string[]) =>
  buildConfig(config(passRoles), p, { getProviderNames: () => [] } as unknown as AuthService, subscription).callbacks!.signIn!({
    user: { email: "a@b.com", name: "A" },
    account: account(roles),
  } as never);

// scenario: keycloak-roles-mapped
describe("Keycloak realm roles with KEYCLOAK_PASS_ROLES=true", () => {
  beforeEach(() => jest.clearAllMocks());

  it("map onto the Role enum for an existing user, dropping roles the enum does not know", async () => {
    const p = prisma({ id: "u1", email: "a@b.com", name: "A", emailVerified: null, accounts: [] });
    await signIn(p, true, ["admin", "offline_access", "uma_authorization"]);
    expect(p.prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ role: "admin" }) }));
  });

  it("map onto the Role enum for a new user", async () => {
    const p = prisma(null);
    await signIn(p, true, ["user", "admin"]);
    expect(p.prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ role: "user admin" }) }));
  });

  it("are ignored without it: a new user gets the default role and an existing one keeps theirs", async () => {
    const created = prisma(null);
    await signIn(created, false, ["admin"]);
    expect(created.prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ role: "user" }) }));

    const existing = prisma({ id: "u1", email: "a@b.com", accounts: [] });
    await signIn(existing, false, ["admin"]);
    expect(existing.prisma.user.update).not.toHaveBeenCalled();
  });
});
