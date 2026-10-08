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
    service: { control: { templatePaths: [] }, synthetic: { campusPrefix: "" } },
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
});
