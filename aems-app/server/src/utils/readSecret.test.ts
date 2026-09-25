import { readSecret } from "./readSecret";

describe("readSecret", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns env var value when set", () => {
    process.env["SESSION_SECRET"] = "from-env";
    expect(readSecret("SESSION_SECRET")).toBe("from-env");
  });

  it("returns defaultValue when env var is unset", () => {
    delete process.env["SESSION_SECRET"];
    expect(readSecret("SESSION_SECRET", "my-default")).toBe("my-default");
  });

  it("returns empty string when unset and no default", () => {
    delete process.env["SESSION_SECRET"];
    expect(readSecret("SESSION_SECRET")).toBe("");
  });

  it("returns defaultValue when env var is empty string", () => {
    process.env["SESSION_SECRET"] = "";
    expect(readSecret("SESSION_SECRET", "fallback")).toBe("fallback");
  });
});
