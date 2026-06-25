import { Test, TestingModule } from "@nestjs/testing";
import { CleanupService } from "./cleanup.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";

function makeConfig(): AppConfigService {
  return { instanceType: "cleanup", service: {} } as unknown as AppConfigService;
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

  it("task() queries occupancies even when none match", async () => {
    await service.task();
    expect(mockPrisma.prisma.occupancy.findMany).toHaveBeenCalled();
    expect(mockPrisma.prisma.occupancy.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [] } } });
  });

  it("task() deletes matching occupancies and updates affected units", async () => {
    mockPrisma.prisma.occupancy.findMany.mockResolvedValue([
      { id: "o1", configuration: { units: [{ id: "u1" }, { id: "u2" }] } },
      { id: "o2", configuration: { units: [{ id: "u2" }] } },
    ]);
    mockPrisma.prisma.occupancy.deleteMany.mockResolvedValue({ count: 2 });

    await service.task();

    expect(mockPrisma.prisma.occupancy.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["o1", "o2"] } } });
    const updateCall = mockPrisma.prisma.unit.updateMany.mock.calls[0][0];
    expect(updateCall.where.id.in.sort()).toEqual(["u1", "u2"]);
  });

  it("task() swallows prisma errors without throwing", async () => {
    mockPrisma.prisma.occupancy.findMany.mockRejectedValue(new Error("boom"));
    await expect(service.task()).resolves.toBeUndefined();
  });
});
