import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { KeycloakAdminService } from "./keycloak-admin.service";

const ISSUER = "https://host.example/auth/sso/realms/default";
const INTERNAL = "http://keycloak:8080/auth/sso";

let calls: { url: string; init?: RequestInit }[];
beforeEach(() => {
  calls = [];
  global.fetch = jest.fn((url: string | URL, init?: RequestInit) => {
    calls.push({ url: url.toString(), init });
    const body = url.toString().endsWith("/token") ? { access_token: "token" } : [];
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body), text: () => Promise.resolve("") } as Response);
  }) as typeof fetch;
});

/** The admin client as the environment configures it. */
function client(env: Record<string, string | undefined>) {
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  try {
    return new KeycloakAdminService(new AppConfigService(), { prisma: {} } as PrismaService);
  } finally {
    for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
}

// scenario: admin-password-grant
describe("the Keycloak admin client's credentials", () => {
  it("are a password grant to the master realm with KEYCLOAK_ADMIN and KEYCLOAK_ADMIN_PASSWORD", async () => {
    const admin = client({
      KEYCLOAK_ISSUER_URL: ISSUER,
      KEYCLOAK_ADMIN_INTERNAL_URL: undefined,
      KEYCLOAK_ADMIN: "the-admin",
      KEYCLOAK_ADMIN_PASSWORD: "p$ss word",
    });
    await expect(admin.getAdminToken()).resolves.toBe("token");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://host.example/auth/sso/realms/master/protocol/openid-connect/token");
    expect(calls[0].init?.method).toBe("POST");
    const form = new URLSearchParams(String(calls[0].init?.body));
    expect(Object.fromEntries(form)).toEqual({
      grant_type: "password",
      client_id: "admin-cli",
      username: "the-admin",
      password: "p$ss word",
    });
  });
});

// scenario: admin-internal-url
describe("KEYCLOAK_ADMIN_INTERNAL_URL", () => {
  it("when set, takes every admin call, the token included, straight to Keycloak", async () => {
    const admin = client({ KEYCLOAK_ISSUER_URL: ISSUER, KEYCLOAK_ADMIN_INTERNAL_URL: `${INTERNAL}/` });
    await admin.listRealmRoles();
    expect(calls.map((c) => c.url)).toEqual([
      `${INTERNAL}/realms/master/protocol/openid-connect/token`,
      `${INTERNAL}/admin/realms/default/roles`,
    ]);
  });

  it("when unset, leaves the calls on the issuer's host", async () => {
    const admin = client({ KEYCLOAK_ISSUER_URL: ISSUER, KEYCLOAK_ADMIN_INTERNAL_URL: undefined });
    await admin.listRealmRoles();
    expect(calls.map((c) => new URL(c.url).origin)).toEqual(["https://host.example", "https://host.example"]);
  });
});
