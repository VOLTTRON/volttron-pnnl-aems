jest.mock("@nestjs/passport", () => ({
  PassportStrategy: (Strategy: new (...args: unknown[]) => unknown) => Strategy,
  AuthGuard: () => class {},
}));
jest.mock("passport-local", () => ({ Strategy: class {} }));
jest.mock("passport-http-bearer", () => ({ Strategy: class {} }));
jest.mock("passport-oauth2", () => ({ Strategy: class {} }));
jest.mock("@auth/express/providers/credentials", () => ({ default: jest.fn(() => ({ id: "credentials" })) }));
jest.mock("@auth/express/providers/keycloak", () => ({ default: jest.fn(() => ({ id: "keycloak" })) }));

import { FactoryProvider } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { AuthService } from "./auth.service";
import { BearerModule } from "./bearer/bearer.module";
import { KeycloakModule } from "./keycloak/keycloak.module";
import { LocalModule } from "./local/local.module";
import { SuperModule } from "./super/super.module";

const modules = [LocalModule, BearerModule, KeycloakModule, SuperModule];
const names = modules.map((m) => m.provider);

/** Runs every provider module's own factory against the environment, as Nest would, and returns
 *  the names AuthService will hand out. */
async function enabled(framework: string, providers: string): Promise<string[]> {
  process.env.AUTH_FRAMEWORK = framework;
  process.env.AUTH_PROVIDERS = providers;
  const config = new AppConfigService();
  config.keycloak.wellKnownUrl = "";
  const authService = new AuthService(config);
  for (const module of modules) {
    const factory = (Reflect.getMetadata("providers", module) as FactoryProvider[]).find(
      (p) => p.provide === module.provider,
    );
    // AuthService, AppConfigService, PrismaService, then whatever the module adds
    await factory?.useFactory(authService, config, {}, {}, {});
  }
  return names.filter((name) => authService.getProvider(name) !== undefined);
}

// scenario: providers-selected-by-env
describe("AUTH_PROVIDERS", () => {
  const saved = { framework: process.env.AUTH_FRAMEWORK, providers: process.env.AUTH_PROVIDERS };
  afterEach(() => {
    for (const [key, value] of [
      ["AUTH_FRAMEWORK", saved.framework],
      ["AUTH_PROVIDERS", saved.providers],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("names the four providers local, bearer, keycloak and super", () => {
    expect([...names].sort()).toEqual(["bearer", "keycloak", "local", "super"]);
  });

  for (const framework of ["authjs", "passport"]) {
    describe(`under ${framework}`, () => {
      it("enables none when empty", async () => {
        expect(await enabled(framework, "")).toEqual([]);
      });

      it("enables nothing it does not name", async () => {
        expect(await enabled(framework, "oauth,google")).toEqual([]);
      });

      for (const name of ["local", "keycloak", "super"]) {
        it(`enables ${name} alone when it alone is named`, async () => {
          expect(await enabled(framework, name)).toEqual([name]);
        });
      }

      it("enables exactly the ones a comma list names", async () => {
        expect((await enabled(framework, "local,super")).sort()).toEqual(["local", "super"]);
      });
    });
  }

  it("enables bearer alone under passport when it alone is named", async () => {
    expect(await enabled("passport", "bearer")).toEqual(["bearer"]);
  });

  it("enables all four under passport when all four are named", async () => {
    expect((await enabled("passport", "local,bearer,keycloak,super")).sort()).toEqual(names.slice().sort());
  });

  // scenario: provider-framework-mismatch-refused
  it("stops startup when it names bearer under authjs, naming the provider and the framework", async () => {
    for (const providers of ["bearer", "local,bearer,keycloak,super"]) {
      const refusal = await enabled("authjs", providers).then(
        () => undefined,
        (error: Error) => error.message,
      );
      expect(refusal).toMatch(/"bearer"/);
      expect(refusal).toMatch(/"authjs"/);
    }
  });
});
