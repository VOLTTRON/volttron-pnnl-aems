import { Test, TestingModule } from "@nestjs/testing";
import { CleanupService } from "./cleanup.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";

function makeConfig(): AppConfigService {
  return { instanceType: "cleanup", service: {}, volttron: { timezone: "Asia/Tokyo" } } as unknown as AppConfigService;
}

describe("CleanupService", () => {
  let module: TestingModule;
  let service: CleanupService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      prisma: {
        occupancy: {
          findMany: jest.fn().mockResolvedValue([]),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        unit: {
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      },
    };

    module = await Test.createTestingModule({
      providers: [
        CleanupService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AppConfigService.Key, useValue: makeConfig() },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("constructs without throwing", () => {
    expect(service).toBeDefined();
  });

  // scenario: occupancy-cleanup-deletes-past
  describe("each night", () => {
    // 03:00 UTC on 10 March is still 9 March in Los Angeles and already 10 March in Tokyo. Dates are
    // stored at noon UTC, as the client writes them.
    const at = (id: string, day: string, timezones: (string | null)[]) => ({
      id,
      date: new Date(`${day}T12:00:00Z`),
      configuration: { units: timezones.map((timezone, i) => ({ id: `${id}-u${i}`, timezone })) },
    });
    beforeEach(() => {
      jest.useFakeTimers({ now: new Date("2026-03-10T03:00:00Z"), doNotFake: ["nextTick", "setImmediate", "setTimeout", "setInterval", "queueMicrotask"] });
    });
    afterEach(() => jest.useRealTimers());

    const deleted = () => (mockPrisma.prisma.occupancy.deleteMany.mock.calls[0]?.[0]?.where.id.in ?? []).slice().sort();

    it("deletes the occupancies dated before today in their units' timezone, and marks those units", async () => {
      mockPrisma.prisma.occupancy.findMany.mockResolvedValue([
        at("past", "2026-03-08", ["America/Los_Angeles"]),
        at("today-la", "2026-03-09", ["America/Los_Angeles"]),
        at("yesterday-tokyo", "2026-03-09", ["Asia/Tokyo"]),
        at("future", "2026-03-11", ["Asia/Tokyo"]),
      ]);
      mockPrisma.prisma.occupancy.deleteMany.mockResolvedValue({ count: 2 });
      await service.task();
      expect(deleted()).toEqual(["past", "yesterday-tokyo"]);
      expect(mockPrisma.prisma.unit.updateMany.mock.calls[0][0].where.id.in.sort()).toEqual(["past-u0", "yesterday-tokyo-u0"]);
    });

    it("keeps an occupancy that is still today for any unit using it", async () => {
      mockPrisma.prisma.occupancy.findMany.mockResolvedValue([at("shared", "2026-03-09", ["Asia/Tokyo", "America/Los_Angeles"])]);
      await service.task();
      expect(deleted()).toEqual([]);
    });

    it("uses VOLTTRON_TIMEZONE for a unit with no timezone", async () => {
      mockPrisma.prisma.occupancy.findMany.mockResolvedValue([at("none", "2026-03-09", [null])]);
      await service.task();
      expect(deleted()).toEqual(["none"]);
    });
  });

  it("task() swallows prisma errors without throwing", async () => {
    mockPrisma.prisma.occupancy.findMany.mockRejectedValue(new Error("boom"));
    await expect(service.task()).resolves.toBeUndefined();
  });
});
