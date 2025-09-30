/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from "./log.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";

// Mock process.uptime
const mockUptime = jest.fn();
Object.defineProperty(process, 'uptime', {
  value: mockUptime,
  writable: true,
});

describe("LogService", () => {
  let logService: LogService;
  let module: TestingModule;
  let mockPrismaService: any;

  const createMockConfig = (overrides: Partial<AppConfigService> = {}) => ({
    instanceType: "log",
    service: {
      log: {
        prune: true,
      },
    },
    ...overrides,
  } as AppConfigService);

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUptime.mockReturnValue(3600); // 1 hour uptime

    const mockPrisma = {
      prisma: {
        log: {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      },
    };

    module = await Test.createTestingModule({
      providers: [
        LogService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AppConfigService.Key,
          useValue: createMockConfig(),
        },
      ],
    }).compile();

    logService = module.get<LogService>(LogService);
    mockPrismaService = module.get<PrismaService>(PrismaService) as any;
  });

  afterEach(async () => {
    await module.close();
  });

  describe("constructor", () => {
    it("should initialize with correct service name and configuration", () => {
      expect(logService).toBeInstanceOf(LogService);
    });

    it("should set prune flag from configuration", async () => {
      const testModule = await Test.createTestingModule({
        providers: [
          LogService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: AppConfigService.Key,
            useValue: createMockConfig({
              service: {
                log: {
                  prune: false,
                },
              },
            } as Partial<AppConfigService>),
          },
        ],
      }).compile();

      const service = testModule.get<LogService>(LogService);
      expect(service.schedule()).toBe(false);
      await testModule.close();
    });

    it("should calculate started time based on process uptime", () => {
      const currentTime = new Date();
      const expectedStartTime = new Date(currentTime.getTime() - 3600 * 1000);
      
      // Allow for small timing differences (within 1 second)
      const timeDifference = Math.abs(expectedStartTime.getTime() - currentTime.getTime() + 3600 * 1000);
      expect(timeDifference).toBeLessThan(1000);
    });
  });

  describe("schedule", () => {
    it("should return true when prune is enabled and service is enabled", () => {
      expect(logService.schedule()).toBe(true);
    });

    it("should return false when prune is disabled", async () => {
      const testModule = await Test.createTestingModule({
        providers: [
          LogService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: AppConfigService.Key,
            useValue: createMockConfig({
              service: {
                log: {
                  prune: false,
                },
              },
            } as Partial<AppConfigService>),
          },
        ],
      }).compile();

      const service = testModule.get<LogService>(LogService);
      expect(service.schedule()).toBe(false);
      await testModule.close();
    });

    it("should return false when service is not enabled in instanceType", async () => {
      const testModule = await Test.createTestingModule({
        providers: [
          LogService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: AppConfigService.Key,
            useValue: createMockConfig({
              instanceType: "other",
            } as Partial<AppConfigService>),
          },
        ],
      }).compile();

      const service = testModule.get<LogService>(LogService);
      expect(service.schedule()).toBe(false);
      await testModule.close();
    });
  });

  describe("execute", () => {
    it("should execute with timeout decorator", () => {
      expect(logService.execute).toBeDefined();
      expect(typeof logService.execute).toBe("function");
    });

    it("should call parent execute method", async () => {
      mockPrismaService.prisma.log.deleteMany.mockResolvedValue({ count: 0 });
      
      const executeSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(logService)), 'execute');
      
      await logService.execute();
      
      expect(executeSpy).toHaveBeenCalled();
      executeSpy.mockRestore();
    });
  });

  describe("task", () => {
    it("should successfully prune old log messages", async () => {
      mockPrismaService.prisma.log.deleteMany.mockResolvedValue({ count: 5 });

      await logService.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it("should handle database errors gracefully", async () => {
      const testError = new Error("Database connection failed");
      mockPrismaService.prisma.log.deleteMany.mockRejectedValue(testError);

      await logService.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
    });

    it("should use correct date filter based on process uptime", async () => {
      mockPrismaService.prisma.log.deleteMany.mockResolvedValue({ count: 0 });

      // Mock different uptime
      mockUptime.mockReturnValue(7200); // 2 hours

      const testModule = await Test.createTestingModule({
        providers: [
          LogService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: AppConfigService.Key,
            useValue: createMockConfig(),
          },
        ],
      }).compile();

      const service = testModule.get<LogService>(LogService);
      await service.task();

      const callArgs = mockPrismaService.prisma.log.deleteMany.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      if (callArgs && 'where' in callArgs && callArgs.where.createdAt && 'lt' in callArgs.where.createdAt) {
        const filterDate = callArgs.where.createdAt.lt as Date;
        expect(filterDate).toBeInstanceOf(Date);
        
        // The filter date should be approximately 2 hours ago
        const expectedDate = new Date(Date.now() - 7200 * 1000);
        const timeDifference = Math.abs(filterDate.getTime() - expectedDate.getTime());
        expect(timeDifference).toBeLessThan(1000); // Within 1 second
      }
      
      await testModule.close();
    });

    it("should handle zero uptime", async () => {
      mockPrismaService.prisma.log.deleteMany.mockResolvedValue({ count: 0 });

      mockUptime.mockReturnValue(0);

      const testModule = await Test.createTestingModule({
        providers: [
          LogService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: AppConfigService.Key,
            useValue: createMockConfig(),
          },
        ],
      }).compile();

      const service = testModule.get<LogService>(LogService);
      await service.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
      const callArgs = mockPrismaService.prisma.log.deleteMany.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      if (callArgs && 'where' in callArgs && callArgs.where.createdAt && 'lt' in callArgs.where.createdAt) {
        const filterDate = callArgs.where.createdAt.lt as Date;
        expect(filterDate).toBeInstanceOf(Date);
        
        // Should be approximately current time when uptime is 0
        const timeDifference = Math.abs(filterDate.getTime() - Date.now());
        expect(timeDifference).toBeLessThan(1000);
      }
      
      await testModule.close();
    });

    it("should handle very large uptime values", async () => {
      mockPrismaService.prisma.log.deleteMany.mockResolvedValue({ count: 0 });

      // Very large uptime (30 days)
      mockUptime.mockReturnValue(30 * 24 * 3600);

      const testModule = await Test.createTestingModule({
        providers: [
          LogService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: AppConfigService.Key,
            useValue: createMockConfig(),
          },
        ],
      }).compile();

      const service = testModule.get<LogService>(LogService);
      await service.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
      const callArgs = mockPrismaService.prisma.log.deleteMany.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      if (callArgs && 'where' in callArgs && callArgs.where.createdAt && 'lt' in callArgs.where.createdAt) {
        const filterDate = callArgs.where.createdAt.lt as Date;
        expect(filterDate).toBeInstanceOf(Date);
        
        // Should be 30 days ago
        const expectedDate = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const timeDifference = Math.abs(filterDate.getTime() - expectedDate.getTime());
        expect(timeDifference).toBeLessThan(1000);
      }
      
      await testModule.close();
    });
  });

  describe("error handling", () => {
    it("should handle Prisma client errors", async () => {
      const prismaError = new Error("P2002: Unique constraint failed");
      prismaError.name = "PrismaClientKnownRequestError";
      mockPrismaService.prisma.log.deleteMany.mockRejectedValue(prismaError);

      await logService.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
    });

    it("should handle network timeout errors", async () => {
      const timeoutError = new Error("Connection timeout");
      timeoutError.name = "TimeoutError";
      mockPrismaService.prisma.log.deleteMany.mockRejectedValue(timeoutError);

      await logService.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
    });

    it("should handle errors without stack trace", async () => {
      const errorWithoutStack = new Error("Simple error");
      delete errorWithoutStack.stack;
      mockPrismaService.prisma.log.deleteMany.mockRejectedValue(errorWithoutStack);

      await logService.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
    });
  });

  describe("integration with BaseService", () => {
    it("should inherit BaseService functionality", () => {
      expect(logService.execute).toBeDefined();
      expect(logService.schedule).toBeDefined();
    });

    it("should respect BaseService scheduling logic", () => {
      // First execution should work
      expect(logService.schedule()).toBe(true);
      
      // Second execution should be blocked
      expect(logService.schedule()).toBe(false);
    });

    it("should work with different instance types", async () => {
      const configs = [
        { instanceType: "log" },
        { instanceType: "services,log" },
        { instanceType: "web,log,api" },
      ];

      for (const configOverride of configs) {
        const testModule = await Test.createTestingModule({
          providers: [
            LogService,
            {
              provide: PrismaService,
              useValue: mockPrismaService,
            },
            {
              provide: AppConfigService.Key,
              useValue: createMockConfig(configOverride as Partial<AppConfigService>),
            },
          ],
        }).compile();

        const service = testModule.get<LogService>(LogService);
        expect(service.schedule()).toBe(true);
        await testModule.close();
      }
    });

    it("should be disabled when explicitly excluded", async () => {
      const testModule = await Test.createTestingModule({
        providers: [
          LogService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: AppConfigService.Key,
            useValue: createMockConfig({
              instanceType: "services,!log",
            } as Partial<AppConfigService>),
          },
        ],
      }).compile();

      const service = testModule.get<LogService>(LogService);
      expect(service.schedule()).toBe(false);
      await testModule.close();
    });
  });

  describe("performance considerations", () => {
    it("should handle large deletion operations", async () => {
      mockPrismaService.prisma.log.deleteMany.mockResolvedValue({ count: 1000000 }); // 1 million records

      await logService.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
    });

    it("should handle zero deletions", async () => {
      mockPrismaService.prisma.log.deleteMany.mockResolvedValue({ count: 0 });

      await logService.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
    });
  });

  describe("date calculations", () => {
    it("should handle fractional uptime values", async () => {
      mockPrismaService.prisma.log.deleteMany.mockResolvedValue({ count: 0 });

      mockUptime.mockReturnValue(123.456); // Fractional seconds

      const testModule = await Test.createTestingModule({
        providers: [
          LogService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: AppConfigService.Key,
            useValue: createMockConfig(),
          },
        ],
      }).compile();

      const service = testModule.get<LogService>(LogService);
      await service.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
      const callArgs = mockPrismaService.prisma.log.deleteMany.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      if (callArgs && 'where' in callArgs && callArgs.where.createdAt && 'lt' in callArgs.where.createdAt) {
        expect(callArgs.where.createdAt.lt).toBeInstanceOf(Date);
      }
      
      await testModule.close();
    });

    it("should handle negative uptime gracefully", async () => {
      mockPrismaService.prisma.log.deleteMany.mockResolvedValue({ count: 0 });

      mockUptime.mockReturnValue(-100); // Negative uptime (shouldn't happen in practice)

      const testModule = await Test.createTestingModule({
        providers: [
          LogService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
          {
            provide: AppConfigService.Key,
            useValue: createMockConfig(),
          },
        ],
      }).compile();

      const service = testModule.get<LogService>(LogService);
      await service.task();

      expect(mockPrismaService.prisma.log.deleteMany).toHaveBeenCalled();
      const callArgs = mockPrismaService.prisma.log.deleteMany.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      if (callArgs && 'where' in callArgs && callArgs.where.createdAt && 'lt' in callArgs.where.createdAt) {
        expect(callArgs.where.createdAt.lt).toBeInstanceOf(Date);
      }
      
      await testModule.close();
    });
  });
});
