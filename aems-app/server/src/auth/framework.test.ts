jest.mock("@auth/express", () => ({ ExpressAuth: jest.fn(), getSession: jest.fn() }));
jest.mock("@auth/core/errors", () => ({ AuthError: class AuthError extends Error {} }));
jest.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: jest.fn(() => ({})) }));

import { AppConfigService } from "@/app.config";
import { AuthjsModule } from "./authjs/authjs.module";
import { FrameworkModule } from "./framework.module";
import { PassportModule } from "./passport/passport.module";

// scenario: framework-selected-by-env
describe("the auth framework", () => {
  let saved: string | undefined;
  beforeEach(() => (saved = process.env.AUTH_FRAMEWORK));
  afterEach(() => (saved === undefined ? delete process.env.AUTH_FRAMEWORK : (process.env.AUTH_FRAMEWORK = saved)));

  it("is authjs when AUTH_FRAMEWORK is unset or empty", () => {
    delete process.env.AUTH_FRAMEWORK;
    expect(new AppConfigService().auth.framework).toBe("authjs");
    process.env.AUTH_FRAMEWORK = "";
    expect(new AppConfigService().auth.framework).toBe("authjs");
  });

  it("follows AUTH_FRAMEWORK when set", () => {
    for (const framework of ["authjs", "passport"]) {
      process.env.AUTH_FRAMEWORK = framework;
      expect(new AppConfigService().auth.framework).toBe(framework);
    }
  });

  it("loads both framework modules whichever is selected", () => {
    for (const options of [undefined, { path: "api" }]) {
      const imports = FrameworkModule.register(options).imports ?? [];
      expect(imports).toEqual(expect.arrayContaining([AuthjsModule, PassportModule]));
    }
  });
});
