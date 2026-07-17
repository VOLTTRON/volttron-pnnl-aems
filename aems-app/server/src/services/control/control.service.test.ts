jest.mock("node:fs/promises", () => ({ readFile: jest.fn().mockResolvedValue("{}") }));
jest.mock("@/utils/file", () => ({ getConfigFiles: jest.fn().mockResolvedValue([]) }));

import { Test, TestingModule } from "@nestjs/testing";
import { ControlService } from "./control.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { VolttronService } from "../volttron.service";

function makeConfig(): AppConfigService {
  return {
    instanceType: "control",
    service: { control: { templatePaths: [] } },
  } as unknown as AppConfigService;
}

describe("ControlService", () => {
  let module: TestingModule;
  let service: ControlService;
  let mockPrisma: any;
  let mockSub: any;
  let mockVolttron: any;

  beforeEach(async () => {
    mockPrisma = {
      prisma: {
        control: {
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn().mockResolvedValue(null),
        },
      },
    };
    mockSub = { publish: jest.fn().mockResolvedValue(undefined) };
    mockVolttron = {
      makeAuthCall: jest.fn().mockResolvedValue("token"),
      makeApiCall: jest.fn().mockResolvedValue(undefined),
    };

    module = await Test.createTestingModule({
      providers: [
        ControlService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SubscriptionService, useValue: mockSub },
        { provide: AppConfigService.Key, useValue: makeConfig() },
        { provide: VolttronService, useValue: mockVolttron },
      ],
    }).compile();

    service = module.get<ControlService>(ControlService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("constructs without throwing", () => {
    expect(service).toBeDefined();
  });

  it("task() exits early when no controls need pushing", async () => {
    await service.task();
    expect(mockPrisma.prisma.control.findMany).toHaveBeenCalled();
    expect(mockVolttron.makeAuthCall).not.toHaveBeenCalled();
  });

  it("task() pushes each control via VolttronService and publishes Control subscription events", async () => {
    mockPrisma.prisma.control.findMany.mockResolvedValue([
      { id: "ctrl1", label: "Bldg-A", peakLoadExclude: false, units: [] },
    ]);
    await service.task();
    expect(mockVolttron.makeAuthCall).toHaveBeenCalled();
    expect(mockVolttron.makeApiCall).toHaveBeenCalledWith("agent.ilc", "update_configurations", "token", expect.any(Object));
    expect(mockPrisma.prisma.control.update).toHaveBeenCalled();
    expect(mockSub.publish).toHaveBeenCalledWith("Control", expect.objectContaining({ id: "ctrl1" }));
    expect(mockSub.publish).toHaveBeenCalledWith("Control/ctrl1", expect.objectContaining({ id: "ctrl1" }));
  });

  it("task() clears units when peakLoadExclude is true", async () => {
    const control = { id: "ctrl1", label: "X", peakLoadExclude: true, units: [{ id: "u1" }] };
    mockPrisma.prisma.control.findMany.mockResolvedValue([control]);
    await service.task();
    expect(control.units).toEqual([]);
  });

  it("task() marks the control as Fail when Volttron call throws", async () => {
    mockPrisma.prisma.control.findMany.mockResolvedValue([
      { id: "ctrl1", label: "X", peakLoadExclude: false, units: [] },
    ]);
    mockVolttron.makeApiCall.mockRejectedValue(new Error("kaboom"));

    await service.task();

    const updateCalls = mockPrisma.prisma.control.update.mock.calls;
    const failCall = updateCalls.find((c: any[]) => c[0]?.data?.message);
    expect(failCall).toBeDefined();
    expect(failCall[0].data.message).toMatch(/kaboom/);
  });
});
