import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "./config.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { VolttronService } from "../volttron.service";

function makeConfig(overrides: object = {}): AppConfigService {
  return {
    instanceType: "config",
    service: { config: { startup: false, serviceOverride: false, holidaySchedule: false } },
    ...overrides,
  } as unknown as AppConfigService;
}

describe("ConfigService", () => {
  let module: TestingModule;
  let service: ConfigService;
  let mockPrisma: any;
  let mockSub: any;
  let mockVolttron: any;

  async function build(config: AppConfigService = makeConfig()) {
    mockPrisma = {
      prisma: {
        unit: {
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn().mockResolvedValue(null),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
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
        ConfigService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SubscriptionService, useValue: mockSub },
        { provide: AppConfigService.Key, useValue: config },
        { provide: VolttronService, useValue: mockVolttron },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  }

  afterEach(async () => {
    await module.close();
  });

  it("constructs without throwing", async () => {
    await build();
    expect(service).toBeDefined();
  });

  it("onApplicationBootstrap is a no-op when service.config.startup is false", async () => {
    await build();
    await service.onApplicationBootstrap();
    expect(mockPrisma.prisma.unit.updateMany).not.toHaveBeenCalled();
  });

  it("onApplicationBootstrap marks all units for repush when startup is true", async () => {
    await build(makeConfig({ service: { config: { startup: true } } }));
    await service.onApplicationBootstrap();
    expect(mockPrisma.prisma.unit.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ message: expect.stringMatching(/Repushing/) }) }),
    );
  });

  it("task() exits early when no units need pushing", async () => {
    await build();
    await service.task();
    expect(mockPrisma.prisma.unit.findMany).toHaveBeenCalled();
    expect(mockVolttron.makeAuthCall).not.toHaveBeenCalled();
  });

  it("buildOccupancyPayload returns occupancy/override structure for a schedule", async () => {
    await build();
    const payload = (service as any).buildOccupancyPayload({
      occupied: true,
      startTime: "08:00",
      endTime: "17:00",
      overridePreStartTime: "07:30",
      overridePreEndTime: "08:00",
      overridePostStartTime: "17:00",
      overridePostEndTime: "18:00",
    });
    expect(payload).toHaveProperty("occupancy");
    expect(payload).toHaveProperty("override.pre");
    expect(payload).toHaveProperty("override.post");
  });

  it("buildOccupancyPayload handles null schedule gracefully", async () => {
    await build();
    const payload = (service as any).buildOccupancyPayload(null);
    expect(payload).toHaveProperty("occupancy");
  });
});
