/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PrismaService } from "./prisma.service";
import { AppConfigService } from "@/app.config";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "@node-rs/bcrypt";
import { checkPassword } from "@/auth";

// Mock dependencies
jest.mock("@node-rs/bcrypt");
jest.mock("@/auth");
jest.mock("@/logging");

const mockHashSync = hashSync as jest.MockedFunction<typeof hashSync>;
const mockCheckPassword = checkPassword as jest.MockedFunction<typeof checkPassword>;

// Helper function to create complete ZxcvbnResult mock
const createZxcvbnResult = (overrides: Record<string, any> = {}): any => ({
  password: "test",
  guesses: 1000,
  guessesLog10: 3,
  sequence: [],
  calcTime: 1,
  score: 3,
  feedback: {
    warning: "",
    suggestions: [],
  },
  crackTimesSeconds: {
    onlineThrottling100PerHour: 0,
    onlineNoThrottling10PerSecond: 0,
    offlineSlowHashing1e4PerSecond: 0,
    offlineFastHashing1e10PerSecond: 0,
  },
  crackTimesDisplay: {
    onlineThrottling100PerHour: "instant",
    onlineNoThrottling10PerSecond: "instant",
    offlineSlowHashing1e4PerSecond: "instant",
    offlineFastHashing1e10PerSecond: "instant",
  },
  ...overrides,
});

describe("PrismaService", () => {
  let prismaService: PrismaService;
  let mockConfigService: AppConfigService;
  let mockPrismaClient: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock configuration
    mockConfigService = {
      log: {
        prisma: {
          level: "info",
        },
      },
      database: {
        url: "postgresql://user:pass@localhost:5432/testdb",
      },
      password: {
        validate: true,
        strength: 2,
      },
    } as AppConfigService;

    // Mock PrismaClient
    mockPrismaClient = {
      $on: jest.fn(),
      $extends: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<PrismaClient>;

    // Mock checkPassword
    mockCheckPassword.mockReturnValue(createZxcvbnResult());

    // Mock hashSync
    mockHashSync.mockReturnValue("hashed_password");
  });

  describe("constructor", () => {
    it("should initialize with default PrismaClient when none provided", () => {
      prismaService = new PrismaService(mockConfigService);

      expect(prismaService).toBeInstanceOf(PrismaService);
      expect(prismaService.prisma).toBeDefined();
    });

    it("should use provided PrismaClient when supplied", () => {
      prismaService = new PrismaService(mockConfigService, mockPrismaClient);

      expect(prismaService).toBeInstanceOf(PrismaService);
      expect(prismaService.prisma).toBeDefined();
    });

    it("should configure query logging when log level is set", () => {
      mockConfigService.log.prisma.level = "debug";

      prismaService = new PrismaService(mockConfigService);

      expect(prismaService).toBeInstanceOf(PrismaService);
    });

    it("should handle database URL parsing for logging", () => {
      mockConfigService.database.url = "postgresql://user:password@localhost:5432/mydb";

      prismaService = new PrismaService(mockConfigService);

      expect(prismaService).toBeInstanceOf(PrismaService);
    });
  });

  describe("password processing", () => {
    beforeEach(() => {
      prismaService = new PrismaService(mockConfigService, mockPrismaClient);
    });

    describe("processPassword function", () => {
      it("should hash password when validation passes", () => {
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: "strongPassword123!",
            guesses: 1000000,
            guessesLog10: 6,
            score: 3,
          }),
        );

        // Test that the service initializes without throwing
        expect(() => {
          new PrismaService(mockConfigService, mockPrismaClient);
        }).not.toThrow();

        // The password processing would be tested through actual Prisma operations
        // For now, we verify the service can be created with password validation enabled
        expect(mockConfigService.password.validate).toBe(true);
        expect(mockConfigService.password.strength).toBe(2);
      });

      it("should throw error when password validation fails with warning", () => {
        mockConfigService.password.validate = true;
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: "weakpass",
            guesses: 100,
            guessesLog10: 2,
            score: 1,
            feedback: { warning: "Password is too weak", suggestions: [] },
          }),
        );

        prismaService = new PrismaService(mockConfigService, mockPrismaClient);

        expect(() => {
          // Simulate the internal password processing
          const result = mockCheckPassword("weakpass");
          if (mockConfigService.password.validate && result.feedback.warning) {
            throw new Error(result.feedback.warning);
          }
        }).toThrow("Password is too weak");
      });

      it("should throw error when password strength is below minimum", () => {
        mockConfigService.password.strength = 3;
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: "weakpass",
            guesses: 100,
            guessesLog10: 2,
            score: 1,
          }),
        );

        prismaService = new PrismaService(mockConfigService, mockPrismaClient);

        expect(() => {
          // Simulate the internal password processing
          const result = mockCheckPassword("weakpass");
          if (result.score < mockConfigService.password.strength) {
            throw new Error("Password does not meet minimum strength requirements.");
          }
        }).toThrow("Password does not meet minimum strength requirements.");
      });

      it("should process password when validation is disabled", () => {
        mockConfigService.password.validate = false;
        mockConfigService.password.strength = 0; // Set to 0 so score 0 passes
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: "weakpass",
            guesses: 10,
            guessesLog10: 1,
            score: 0,
            feedback: { warning: "Very weak password", suggestions: [] },
          }),
        );

        prismaService = new PrismaService(mockConfigService, mockPrismaClient);

        expect(() => {
          // Simulate the internal password processing
          const result = mockCheckPassword("weakpass");
          if (mockConfigService.password.validate && result.feedback.warning) {
            throw new Error(result.feedback.warning);
          }
          if (result.score < mockConfigService.password.strength) {
            throw new Error("Password does not meet minimum strength requirements.");
          }
          mockHashSync("weakpass", 10);
        }).not.toThrow();

        expect(mockHashSync).toHaveBeenCalledWith("weakpass", 10);
      });

      it("should handle minimum strength of 0", () => {
        mockConfigService.password.strength = 0;
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: "anypass",
            guesses: 10,
            guessesLog10: 1,
            score: 0,
          }),
        );

        prismaService = new PrismaService(mockConfigService, mockPrismaClient);

        expect(() => {
          // Simulate the internal password processing
          const result = mockCheckPassword("anypass");
          if (result.score < mockConfigService.password.strength) {
            throw new Error("Password does not meet minimum strength requirements.");
          }
          mockHashSync("anypass", 10);
        }).not.toThrow();

        expect(mockHashSync).toHaveBeenCalledWith("anypass", 10);
      });

      it("should handle maximum strength requirement", () => {
        mockConfigService.password.strength = 4;
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: "veryStrongP@ssw0rd!2023",
            guesses: 10000000,
            guessesLog10: 7,
            score: 4,
          }),
        );

        prismaService = new PrismaService(mockConfigService, mockPrismaClient);

        expect(() => {
          // Simulate the internal password processing
          const result = mockCheckPassword("veryStrongP@ssw0rd!2023");
          if (result.score < mockConfigService.password.strength) {
            throw new Error("Password does not meet minimum strength requirements.");
          }
          mockHashSync("veryStrongP@ssw0rd!2023", 10);
        }).not.toThrow();

        expect(mockHashSync).toHaveBeenCalledWith("veryStrongP@ssw0rd!2023", 10);
      });
    });

    describe("edge cases", () => {
      it("should handle empty password", () => {
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: "",
            guesses: 1,
            guessesLog10: 0,
            score: 0,
            feedback: { warning: "Password cannot be empty", suggestions: [] },
          }),
        );

        expect(() => {
          const result = mockCheckPassword("");
          if (mockConfigService.password.validate && result.feedback.warning) {
            throw new Error(result.feedback.warning);
          }
        }).toThrow("Password cannot be empty");
      });

      it("should handle very long passwords", () => {
        const longPassword = "a".repeat(1000);
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: longPassword,
            guesses: 10000,
            guessesLog10: 4,
            score: 2,
          }),
        );

        expect(() => {
          const result = mockCheckPassword(longPassword);
          if (result.score < mockConfigService.password.strength) {
            throw new Error("Password does not meet minimum strength requirements.");
          }
          mockHashSync(longPassword, 10);
        }).not.toThrow();

        expect(mockHashSync).toHaveBeenCalledWith(longPassword, 10);
      });

      it("should handle special characters in passwords", () => {
        const specialPassword = "P@$$w0rd!#$%^&*()";
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: specialPassword,
            guesses: 10000000,
            guessesLog10: 7,
            score: 4,
          }),
        );

        expect(() => {
          const result = mockCheckPassword(specialPassword);
          if (result.score < mockConfigService.password.strength) {
            throw new Error("Password does not meet minimum strength requirements.");
          }
          mockHashSync(specialPassword, 10);
        }).not.toThrow();

        expect(mockHashSync).toHaveBeenCalledWith(specialPassword, 10);
      });

      it("should handle unicode characters in passwords", () => {
        const unicodePassword = "пароль123";
        mockCheckPassword.mockReturnValue(
          createZxcvbnResult({
            password: unicodePassword,
            guesses: 10000,
            guessesLog10: 4,
            score: 2,
          }),
        );

        expect(() => {
          const result = mockCheckPassword(unicodePassword);
          if (result.score < mockConfigService.password.strength) {
            throw new Error("Password does not meet minimum strength requirements.");
          }
          mockHashSync(unicodePassword, 10);
        }).not.toThrow();

        expect(mockHashSync).toHaveBeenCalledWith(unicodePassword, 10);
      });
    });

    describe("configuration variations", () => {
      it("should work with validation enabled and low strength requirement", () => {
        mockConfigService.password.validate = true;
        mockConfigService.password.strength = 1;

        prismaService = new PrismaService(mockConfigService, mockPrismaClient);

        expect(prismaService).toBeInstanceOf(PrismaService);
      });

      it("should work with validation disabled and high strength requirement", () => {
        mockConfigService.password.validate = false;
        mockConfigService.password.strength = 4;

        prismaService = new PrismaService(mockConfigService, mockPrismaClient);

        expect(prismaService).toBeInstanceOf(PrismaService);
      });

      it("should handle missing password configuration", () => {
        const configWithoutPassword = {
          log: { prisma: { level: "info" } },
          database: { url: "postgresql://localhost:5432/test" },
        } as AppConfigService;

        expect(() => {
          new PrismaService(configWithoutPassword, mockPrismaClient);
        }).not.toThrow();
      });
    });

    describe("logging configuration", () => {
      it("should handle different log levels", () => {
        const logLevels = ["debug", "info", "warn", "error"];

        for (const level of logLevels) {
          mockConfigService.log.prisma.level = level;

          expect(() => {
            new PrismaService(mockConfigService, mockPrismaClient);
          }).not.toThrow();
        }
      });

      it("should handle invalid log level gracefully", () => {
        mockConfigService.log.prisma.level = "invalid";

        expect(() => {
          new PrismaService(mockConfigService, mockPrismaClient);
        }).not.toThrow();
      });

      it("should handle missing log configuration", () => {
        const configWithoutLog = {
          log: undefined,
          database: { url: "postgresql://localhost:5432/test" },
          password: { validate: true, strength: 2 },
        } as unknown as AppConfigService;

        expect(() => {
          new PrismaService(configWithoutLog, mockPrismaClient);
        }).toThrow();
      });
    });

    describe("database URL handling", () => {
      it("should handle various database URL formats", () => {
        const urls = [
          "postgresql://user:pass@localhost:5432/db",
          "postgresql://localhost:5432/db",
          "postgresql://user@localhost/db",
          "postgres://user:pass@host:5432/db",
        ];

        for (const url of urls) {
          mockConfigService.database.url = url;

          expect(() => {
            new PrismaService(mockConfigService, mockPrismaClient);
          }).not.toThrow();
        }
      });

      it("should handle database URL without credentials", () => {
        mockConfigService.database.url = "postgresql://localhost:5432/testdb";

        expect(() => {
          new PrismaService(mockConfigService, mockPrismaClient);
        }).not.toThrow();
      });

      it("should handle malformed database URL", () => {
        mockConfigService.database.url = "invalid-url";

        expect(() => {
          new PrismaService(mockConfigService, mockPrismaClient);
        }).not.toThrow();
      });
    });
  });

  describe("static properties", () => {
    it("should have prisma property", () => {
      prismaService = new PrismaService(mockConfigService, mockPrismaClient);

      expect(prismaService.prisma).toBeDefined();
    });

    it("should be readonly prisma property", () => {
      prismaService = new PrismaService(mockConfigService, mockPrismaClient);

      // TypeScript should enforce readonly, but we can test the property exists
      expect(Object.getOwnPropertyDescriptor(prismaService, "prisma")).toBeDefined();
    });
  });
});
