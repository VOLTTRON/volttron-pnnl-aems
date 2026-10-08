import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SyntheticService, TopicRegistry } from "./synthetic.service";
import { SyntheticHistorianWriter } from "./historian.writer";
import { SyntheticTopologyService, SyntheticUnit } from "./topology.service";

function registry(): TopicRegistry {
  const units: SyntheticUnit[] = [
    { id: "u1", campus: "DEMO_C1", building: "BLDG_A", system: "RTU_1" },
    { id: "u2", campus: "DEMO_C1", building: "BLDG_A", system: "RTU_2" },
  ];
  const buildings = [{ campus: "DEMO_C1", building: "BLDG_A" }];
  const topicIds = new Map<string, number>();
  // Every topic the service might ask for -- `collectTickValues` skips any absent, so a full map
  // is the only way to see every value a seed produces.
  let next = 1;
  for (const u of units) {
    for (const metric of [
      "ZoneTemperature", "ZoneHumidity", "OutdoorAirTemperature",
      "OccupiedCoolingSetPoint", "OccupiedHeatingSetPoint",
      "UnoccupiedCoolingSetPoint", "UnoccupiedHeatingSetPoint",
      "CoolingDemand", "HeatingDemand",
      "SupplyFanStatus", "FirstStageCooling", "SecondStageCooling",
      "FirstStageHeating", "AuxiliaryHeatCommand", "ReversingValve", "OccupancyCommand",
    ]) {
      topicIds.set(`${u.campus}/${u.building}/${u.system}/${metric}`, next++);
    }
  }
  for (const b of buildings) {
    for (const topic of ["air_temperature", "relative_humidity", "wind_speed"]) {
      topicIds.set(`${b.campus}/${b.building}/weather/${topic}`, next++);
    }
    for (const metric of ["WholeBuildingPower", "Demand"]) {
      topicIds.set(`${b.campus}/${b.building}/meter/${metric}`, next++);
    }
  }
  return { units, buildings, topicIds };
}

function makeConfig(seed: string): AppConfigService {
  return {
    instanceName: "synth",
    instanceType: "synth",
    service: {
      synthetic: { seed, historianDays: 1, tickSeconds: 60, campusPrefix: "DEMO_", ticker: false },
    },
  } as unknown as AppConfigService;
}

async function build(seed: string): Promise<{ service: SyntheticService; module: TestingModule }> {
  const module = await Test.createTestingModule({
    providers: [
      SyntheticService,
      { provide: AppConfigService.Key, useValue: makeConfig(seed) },
      { provide: PrismaService, useValue: { prisma: {} } },
      { provide: SyntheticTopologyService, useValue: { apply: jest.fn() } },
      { provide: SyntheticHistorianWriter, useValue: { ensureTopics: jest.fn(), topicHasData: jest.fn(), clearRange: jest.fn(), copyTopic: jest.fn(), tickInsert: jest.fn() } },
    ],
  }).compile();
  return { service: module.get(SyntheticService), module };
}

describe("SyntheticService.collectTickValues", () => {
  const modules: TestingModule[] = [];
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    for (const m of modules) await m.close();
    modules.length = 0;
  });

  // scenario: demo-values-follow-seed
  it("gives the same values for the same SYNTHETIC_SEED, and different values for a different one", async () => {
    const r = registry();
    const ts = new Date(Date.UTC(2026, 5, 15, 12, 0, 0));

    const a1 = await build("seed-alpha"); modules.push(a1.module);
    const a2 = await build("seed-alpha"); modules.push(a2.module);
    const b1 = await build("seed-beta");  modules.push(b1.module);

    const vA1 = a1.service.collectTickValues(r, ts);
    const vA2 = a2.service.collectTickValues(r, ts);
    const vB1 = b1.service.collectTickValues(r, ts);

    // Same seed, same values: equal lists in order.
    expect(vA1).toEqual(vA2);

    // Different seed, different values: the lists disagree on at least one row.
    const differs = vA1.some(([id, v], i) => {
      const [idB, vB] = vB1[i];
      return id !== idB || v !== vB;
    });
    expect(differs).toBe(true);
  });
});
