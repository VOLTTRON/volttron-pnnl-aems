import { readSecret } from "./readSecret";

jest.mock("fs");

import { readFileSync } from "fs";
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

describe("readSecret", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Docker secret file (priority 1)", () => {
    it("returns value from /run/secrets/<name> when file exists", () => {
      mockReadFileSync.mockImplementationOnce(() => "docker-secret-value\n");
      expect(readSecret("SESSION_SECRET")).toBe("docker-secret-value");
    });

    it("trims whitespace from the file value", () => {
      mockReadFileSync.mockImplementationOnce(() => "  trimmed  \n");
      expect(readSecret("SESSION_SECRET")).toBe("trimmed");
    });
  });

  describe("_FILE env var (priority 2)", () => {
    it("reads file path from <NAME>_FILE env var when docker secret fails", () => {
      mockReadFileSync
        .mockImplementationOnce(() => { throw new Error("ENOENT"); })
        .mockImplementationOnce(() => "file-env-secret");
      process.env["SESSION_SECRET_FILE"] = "/custom/path/secret";
      expect(readSecret("SESSION_SECRET")).toBe("file-env-secret");
    });

    it("falls through when file from _FILE env var is empty", () => {
      mockReadFileSync
        .mockImplementationOnce(() => { throw new Error("ENOENT"); })
        .mockImplementationOnce(() => "   ");
      process.env["SESSION_SECRET_FILE"] = "/custom/path/secret";
      process.env["SESSION_SECRET"] = "env-fallback";
      expect(readSecret("SESSION_SECRET")).toBe("env-fallback");
    });

    it("falls through when reading _FILE path throws", () => {
      mockReadFileSync
        .mockImplementationOnce(() => { throw new Error("ENOENT"); })
        .mockImplementationOnce(() => { throw new Error("EPERM"); });
      process.env["SESSION_SECRET_FILE"] = "/custom/path/secret";
      process.env["SESSION_SECRET"] = "env-fallback";
      expect(readSecret("SESSION_SECRET")).toBe("env-fallback");
    });
  });

  describe("env var (priority 3)", () => {
    it("returns env var value when docker secret and _FILE both fail", () => {
      mockReadFileSync.mockImplementationOnce(() => { throw new Error("ENOENT"); });
      process.env["SESSION_SECRET"] = "from-env";
      expect(readSecret("SESSION_SECRET")).toBe("from-env");
    });
  });

  describe("default value (priority 4)", () => {
    it("returns defaultValue when all sources fail", () => {
      mockReadFileSync.mockImplementationOnce(() => { throw new Error("ENOENT"); });
      delete process.env["SESSION_SECRET"];
      expect(readSecret("SESSION_SECRET", "my-default")).toBe("my-default");
    });
  });

  describe("empty string fallback", () => {
    it("returns empty string when nothing is configured and no default", () => {
      mockReadFileSync.mockImplementationOnce(() => { throw new Error("ENOENT"); });
      delete process.env["SESSION_SECRET"];
      delete process.env["SESSION_SECRET_FILE"];
      expect(readSecret("SESSION_SECRET")).toBe("");
    });
  });
});
