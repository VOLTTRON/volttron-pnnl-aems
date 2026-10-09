import { hashSync } from "@node-rs/bcrypt";
import { PrismaClient } from "@prisma/client";
import { AppConfigService } from "@/app.config";
import { checkPassword } from "@/auth";
import { PrismaService } from "@/prisma/prisma.service";
import { SchemaBuilderService } from "../builder.service";
import { UserObject } from "./object.service";

jest.mock("@node-rs/bcrypt");
jest.mock("@/auth");
jest.mock("@/logging");

const mockHashSync = hashSync as jest.MockedFunction<typeof hashSync>;
const mockCheckPassword = checkPassword as jest.MockedFunction<typeof checkPassword>;

type Interceptor = (args: { operation: string; args: unknown; query: (a: unknown) => unknown }) => unknown;

function captureInterceptor(): { interceptor: () => Interceptor; prisma: PrismaClient } {
  let captured: Interceptor | null = null;
  const prisma = {
    $extends: jest.fn((ext: { query?: { user?: { $allOperations?: Interceptor } } }) => {
      captured = ext.query?.user?.$allOperations ?? null;
      return prisma;
    }),
  } as unknown as PrismaClient;
  return {
    interceptor: () => {
      if (!captured) throw new Error("extension did not register a user interceptor");
      return captured;
    },
    prisma,
  };
}

function captureObject() {
  const captured: {
    userFields?: (t: unknown) => Record<string, unknown>;
    userFieldsEnumValues?: unknown;
  } = {};
  const t = new Proxy({} as Record<string, (...a: unknown[]) => unknown>, {
    get: () => (name: string) => name,
  });
  const builder = {
    prismaObject: jest.fn((_name: string, config: { fields: (t: unknown) => Record<string, unknown> }) => {
      captured.userFields = config.fields;
      return {};
    }),
    enumType: jest.fn((_name: string, config: { values: unknown }) => {
      captured.userFieldsEnumValues = config.values;
      return {};
    }),
    addScalarType: jest.fn((name: string) => name),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
  new UserObject(builder);
  if (!captured.userFields) throw new Error("prismaObject fields never captured");
  const fields = captured.userFields(t);
  return { fieldNames: Object.keys(fields), enumValues: captured.userFieldsEnumValues as string[] };
}

// scenario: password-hashed-hidden
describe("User passwords: stored as bcrypt hashes, never returned", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckPassword.mockReturnValue({
      password: "x",
      guesses: 1,
      guessesLog10: 0,
      sequence: [],
      calcTime: 0,
      score: 4,
      feedback: { warning: "", suggestions: [] },
      crackTimesSeconds: {
        onlineThrottling100PerHour: 0,
        onlineNoThrottling10PerSecond: 0,
        offlineSlowHashing1e4PerSecond: 0,
        offlineFastHashing1e10PerSecond: 0,
      },
      crackTimesDisplay: {
        onlineThrottling100PerHour: "x",
        onlineNoThrottling10PerSecond: "x",
        offlineSlowHashing1e4PerSecond: "x",
        offlineFastHashing1e10PerSecond: "x",
      },
    } as ReturnType<typeof checkPassword>);
    mockHashSync.mockReturnValue("bcrypt-hash");
  });

  describe("the Prisma user extension", () => {
    const config = {
      log: { prisma: { level: "" } },
      database: {},
      password: { validate: true, strength: 0 },
    } as unknown as AppConfigService;

    it("hashes a plaintext password on create before it reaches the query", () => {
      const { interceptor, prisma } = captureInterceptor();
      new PrismaService(config, prisma);
      const query = jest.fn().mockResolvedValue({});
      interceptor()({ operation: "create", args: { data: { password: "plaintext-create" } }, query });
      expect(mockHashSync).toHaveBeenCalledWith("plaintext-create", 10);
      expect(query).toHaveBeenCalledWith({ data: { password: "bcrypt-hash" } });
    });

    it("hashes a plaintext password on update before it reaches the query", () => {
      const { interceptor, prisma } = captureInterceptor();
      new PrismaService(config, prisma);
      const query = jest.fn().mockResolvedValue({});
      interceptor()({ operation: "update", args: { data: { password: "plaintext-update" } }, query });
      expect(mockHashSync).toHaveBeenCalledWith("plaintext-update", 10);
      expect(query).toHaveBeenCalledWith({ data: { password: "bcrypt-hash" } });
    });

    it("hashes both halves of an upsert", () => {
      const { interceptor, prisma } = captureInterceptor();
      new PrismaService(config, prisma);
      const query = jest.fn().mockResolvedValue({});
      interceptor()({
        operation: "upsert",
        args: { create: { password: "upsert-create" }, update: { password: "upsert-update" } },
        query,
      });
      expect(mockHashSync).toHaveBeenCalledWith("upsert-create", 10);
      expect(mockHashSync).toHaveBeenCalledWith("upsert-update", 10);
    });

    it("hashes every password in createMany when args.data is an array", () => {
      const { interceptor, prisma } = captureInterceptor();
      new PrismaService(config, prisma);
      const query = jest.fn().mockResolvedValue({});
      interceptor()({
        operation: "createMany",
        args: { data: [{ password: "a" }, { name: "no-pw" }, { password: "b" }] },
        query,
      });
      expect(mockHashSync).toHaveBeenCalledWith("a", 10);
      expect(mockHashSync).toHaveBeenCalledWith("b", 10);
      expect(mockHashSync).toHaveBeenCalledTimes(2);
    });

    it("passes read operations through untouched (negative control)", () => {
      const { interceptor, prisma } = captureInterceptor();
      new PrismaService(config, prisma);
      const query = jest.fn().mockResolvedValue([]);
      interceptor()({ operation: "findMany", args: { where: { email: "a" } }, query });
      expect(mockHashSync).not.toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith({ where: { email: "a" } });
    });

    it("does nothing when a write carries no password (negative control)", () => {
      const { interceptor, prisma } = captureInterceptor();
      new PrismaService(config, prisma);
      const query = jest.fn().mockResolvedValue({});
      interceptor()({ operation: "update", args: { data: { name: "no-pw" } }, query });
      expect(mockHashSync).not.toHaveBeenCalled();
    });
  });

  describe("the GraphQL User type", () => {
    it("exposes no field named 'password'", () => {
      const { fieldNames } = captureObject();
      expect(fieldNames).not.toContain("password");
    });

    it("exposes the fields the model keeps readable (sanity)", () => {
      const { fieldNames } = captureObject();
      for (const name of ["id", "email", "name", "role", "preferences"]) {
        expect(fieldNames).toContain(name);
      }
    });

    it("omits 'password' from the UserFields enum used for selection and sorting", () => {
      const { enumValues } = captureObject();
      expect(Array.isArray(enumValues)).toBe(true);
      expect(enumValues).not.toContain("password");
    });
  });
});
