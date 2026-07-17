 
 

import { Test, TestingModule } from "@nestjs/testing";
import { EventService } from "./event.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";

function makeConfig(overrides: object = {}): AppConfigService {
  return {
    instanceType: "event",
    service: {
      event: {
        prune: true,
        age: { value: 30, unit: "days" },
      },
    },
    ...overrides,
  } as unknown as AppConfigService;
}

describe("EventService", () => {
  let module: TestingModule;
  let service: EventService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      prisma: {
        event: {
          deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
        },
      },
    };

    module = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AppConfigService.Key, useValue: makeConfig() },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("constructs without throwing", () => {
    expect(service).toBeInstanceOf(EventService);
  });

  describe("schedule()", () => {
    it("returns true when prune is enabled and not already running", () => {
      expect(service.schedule()).toBe(true);
    });

    it("returns false when prune is disabled", async () => {
      const pruneOffModule = await Test.createTestingModule({
        providers: [
          EventService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: AppConfigService.Key, useValue: makeConfig({ service: { event: { prune: false, age: { value: 30, unit: "days" } } } }) },
        ],
      }).compile();
      const pruneOffService = pruneOffModule.get<EventService>(EventService);
      expect(pruneOffService.schedule()).toBe(false);
      await pruneOffModule.close();
    });
  });

  describe("task()", () => {
    it("calls prisma.event.deleteMany with a cutoff date filter", async () => {
      await service.task();
      expect(mockPrisma.prisma.event.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ createdAt: expect.objectContaining({ lt: expect.any(Date) }) }),
        }),
      );
    });

    it("handles a deleteMany error without rethrowing", async () => {
      mockPrisma.prisma.event.deleteMany.mockRejectedValue(new Error("DB error"));
      await expect(service.task()).resolves.toBeUndefined();
    });
  });
});
