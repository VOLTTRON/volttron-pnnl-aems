import { PrismaLogger } from "./logger.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { AppLoggerService } from "./logging.service";

// Silence ConsoleLogger output during tests
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

function makeConfig(): AppConfigService {
  return {
    log: {
      database: { level: "log" },
      console: { level: null },
      throttle: { enabled: false },
    },
    instanceName: "test",
  } as unknown as AppConfigService;
}

function makePrisma() {
  return {
    prisma: {
      log: {
        create: jest.fn().mockResolvedValue({}),
      },
    },
  } as unknown as PrismaService;
}

function makeLoggerService(): jest.Mocked<AppLoggerService> {
  return { registerLogger: jest.fn() } as unknown as jest.Mocked<AppLoggerService>;
}

describe("PrismaLogger", () => {
  it("constructs and registers itself with AppLoggerService", () => {
    const loggerService = makeLoggerService();
    const logger = new PrismaLogger(makeConfig(), makePrisma(), loggerService);
    expect(logger).toBeInstanceOf(PrismaLogger);
    expect(loggerService.registerLogger).toHaveBeenCalledWith(logger);
  });

  it("writes a log row to the database when a message is logged", async () => {
    const prisma = makePrisma();
    const logger = new PrismaLogger(makeConfig(), prisma, makeLoggerService());
    logger.log("hello from test");
    await new Promise((r) => setTimeout(r, 20));
    expect(prisma.prisma.log.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "Info" }) }),
    );
  });

  it("writes an Error row when error() is called", async () => {
    const prisma = makePrisma();
    const logger = new PrismaLogger(makeConfig(), prisma, makeLoggerService());
    logger.error("something broke");
    await new Promise((r) => setTimeout(r, 20));
    expect(prisma.prisma.log.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "Error" }) }),
    );
  });

  it("writes a Warn row when warn() is called", async () => {
    const prisma = makePrisma();
    const logger = new PrismaLogger(makeConfig(), prisma, makeLoggerService());
    logger.warn("careful");
    await new Promise((r) => setTimeout(r, 20));
    expect(prisma.prisma.log.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "Warn" }) }),
    );
  });

  it("does not throw when the database write fails", async () => {
    const prisma = makePrisma();
    (prisma.prisma.log.create as jest.Mock).mockRejectedValue(new Error("DB down"));
    const logger = new PrismaLogger(makeConfig(), prisma, makeLoggerService());
    expect(() => logger.log("message")).not.toThrow();
    await new Promise((r) => setTimeout(r, 20));
  });
});
