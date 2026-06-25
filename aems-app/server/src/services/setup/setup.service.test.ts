jest.mock("node:fs/promises", () => ({ readFile: jest.fn() }));
jest.mock("@/utils/file", () => ({ getConfigFiles: jest.fn() }));

import { Test, TestingModule } from "@nestjs/testing";
import { SetupService } from "./setup.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { readFile } from "node:fs/promises";
import { getConfigFiles } from "@/utils/file";

function makeConfig(): AppConfigService {
  return {
    instanceType: "setup",
    service: { setup: { thermostatPaths: [], ilcPaths: [] } },
  } as unknown as AppConfigService;
}

describe("SetupService", () => {
  let module: TestingModule;
  let service: SetupService;
  let mockPrisma: any;
  let mockSub: any;

  beforeEach(async () => {
    (getConfigFiles as jest.Mock).mockReset();
    (readFile as jest.Mock).mockReset();
    (getConfigFiles as jest.Mock).mockResolvedValue([]);

    mockPrisma = {
      prisma: {
        unit: {
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockResolvedValue({ id: "u1" }),
          update: jest.fn().mockResolvedValue(null),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        control: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockResolvedValue({ id: "ctrl1" }),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      },
    };
    mockSub = { publish: jest.fn().mockResolvedValue(undefined) };

    module = await Test.createTestingModule({
      providers: [
        SetupService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SubscriptionService, useValue: mockSub },
        { provide: AppConfigService.Key, useValue: makeConfig() },
      ],
    }).compile();

    service = module.get<SetupService>(SetupService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("constructs without throwing", () => {
    expect(service).toBeDefined();
  });

  it("task() returns without errors when there are no thermostat config files and no existing units", async () => {
    await expect(service.task()).resolves.toBeUndefined();
    expect(mockPrisma.prisma.unit.create).not.toHaveBeenCalled();
    expect(mockPrisma.prisma.unit.deleteMany).not.toHaveBeenCalled();
  });

  it("task() skips creating a unit that already exists", async () => {
    // First getConfigFiles call (thermostat scan) returns 1 file; second (ILC scan) returns 0.
    (getConfigFiles as jest.Mock).mockResolvedValueOnce(["/path/to/AhuA.config"]).mockResolvedValueOnce([]);
    (readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({ campus: "PNNL", building: "B1", system: "Ahu1", local_tz: "America/Los_Angeles" }),
    );
    mockPrisma.prisma.unit.findFirst.mockResolvedValue({ id: "u1", name: "Pnnl-B_1-Ahu_1" });

    await service.task();

    expect(mockPrisma.prisma.unit.findFirst).toHaveBeenCalledWith({ where: { name: "Pnnl-B_1-Ahu_1" } });
    expect(mockPrisma.prisma.unit.create).not.toHaveBeenCalled();
  });

  it("task() creates a new thermostat unit when not found, then publishes Unit subscription", async () => {
    (getConfigFiles as jest.Mock).mockResolvedValueOnce(["/path/to/AhuA.config"]).mockResolvedValueOnce([]);
    (readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({ campus: "PNNL", building: "B1", system: "Ahu1", local_tz: "America/Los_Angeles" }),
    );
    mockPrisma.prisma.unit.findFirst.mockResolvedValue(null);
    mockPrisma.prisma.unit.create.mockResolvedValue({ id: "u1", name: "Pnnl-B_1-Ahu_1" });

    await service.task();

    expect(mockPrisma.prisma.unit.create).toHaveBeenCalled();
    expect(mockSub.publish).toHaveBeenCalledWith("Unit", expect.objectContaining({ id: "u1" }));
  });

  it("task() deletes orphan units that have no matching config file", async () => {
    (getConfigFiles as jest.Mock).mockResolvedValue([]);
    mockPrisma.prisma.unit.findMany.mockResolvedValue([{ id: "u-old", name: "Old-Orphan-Unit" }]);

    await service.task();

    expect(mockPrisma.prisma.unit.deleteMany).toHaveBeenCalledWith({ where: { name: "Old-Orphan-Unit" } });
  });
});
