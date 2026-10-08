import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SyntheticTopologyService } from "./topology.service";

type UpsertCall = { where: { id: string }; update: Record<string, unknown>; create: Record<string, unknown> };

/** Row store for one Prisma table. Captures every upsert and lets a test tamper between runs. */
function table() {
  const rows = new Map<string, Record<string, unknown>>();
  const calls: UpsertCall[] = [];
  return {
    rows,
    calls,
    upsert: jest.fn(({ where, update, create }: UpsertCall) => {
      calls.push({ where, update, create });
      const existing = rows.get(where.id);
      if (existing) {
        Object.assign(existing, update);
        return Promise.resolve({ ...existing });
      }
      const row = { ...create };
      rows.set(where.id, row);
      return Promise.resolve({ ...row });
    }),
    update: jest.fn(() => Promise.resolve({})),
  };
}

function makeConfig(overrides: Partial<{ campusPrefix: string }> = {}): AppConfigService {
  const campusPrefix = overrides.campusPrefix ?? "DEMO_";
  return {
    instanceName: "synth",
    instanceType: "synth",
    service: {
      synthetic: { seed: "test-seed", historianDays: 1, tickSeconds: 60, campusPrefix, ticker: false },
    },
  } as unknown as AppConfigService;
}

describe("SyntheticTopologyService.apply", () => {
  let module: TestingModule;
  let prisma: Record<string, ReturnType<typeof table>>;

  beforeEach(async () => {
    prisma = {
      setpoint: table(),
      schedule: table(),
      configuration: table(),
      location: table(),
      control: table(),
      unit: table(),
      user: table(),
    };
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (module) await module.close();
  });

  async function build(config: AppConfigService): Promise<SyntheticTopologyService> {
    module = await Test.createTestingModule({
      providers: [
        SyntheticTopologyService,
        { provide: AppConfigService.Key, useValue: config },
        { provide: PrismaService, useValue: { prisma } },
      ],
    }).compile();
    return module.get(SyntheticTopologyService);
  }

  // scenario: demo-topology-upserted
  it("upserts 2 campuses by 3 buildings by 3 units with fixed ids, each building a location and a control, and resets wiring on rerun", async () => {
    const service = await build(makeConfig());

    const { units, buildings } = await service.apply();

    // The shape, by count.
    expect(units).toHaveLength(2 * 3 * 3);
    expect(buildings).toHaveLength(2 * 3);
    expect(prisma.unit.rows.size).toBe(18);
    expect(prisma.control.rows.size).toBe(6);
    expect(prisma.location.rows.size).toBe(6);

    // The ids are fixed under the prefix: a second apply() hits the same keys, so no new rows arrive.
    const unitIds = new Set(prisma.unit.rows.keys());
    const controlIds = new Set(prisma.control.rows.keys());
    const locationIds = new Set(prisma.location.rows.keys());
    for (const id of [...unitIds, ...controlIds, ...locationIds]) expect(id.startsWith("DEMO_")).toBe(true);

    // A rerun resets each demo unit's configuration, control and location: an edit between runs is
    // overwritten by the next apply().
    for (const row of prisma.unit.rows.values()) {
      row.configurationId = "edited-config";
      row.controlId = "edited-control";
      row.locationId = "edited-location";
    }
    const sentinel = Array.from(prisma.unit.rows.values())[0];
    expect(sentinel.configurationId).toBe("edited-config");

    await service.apply();

    expect(prisma.unit.rows.size).toBe(18);
    expect(new Set(prisma.unit.rows.keys())).toEqual(unitIds);
    for (const row of prisma.unit.rows.values()) {
      expect(row.configurationId).not.toBe("edited-config");
      expect(row.controlId).not.toBe("edited-control");
      expect(row.locationId).not.toBe("edited-location");
    }
  });

  // scenario: synth-confined-to-prefix
  // Named here under the empty-prefix refusal. The "no write outside the prefix" half is covered
  // where every write is performed: every id upserted here starts with the prefix.
  it("refuses to run when the campus prefix is empty", async () => {
    const service = await build(makeConfig({ campusPrefix: "" }));

    await expect(service.apply()).rejects.toThrow(/prefix/i);
    expect(prisma.unit.upsert).not.toHaveBeenCalled();
    expect(prisma.control.upsert).not.toHaveBeenCalled();
    expect(prisma.location.upsert).not.toHaveBeenCalled();
    expect(prisma.setpoint.upsert).not.toHaveBeenCalled();
  });

  it("never writes to a row whose id lacks the prefix", async () => {
    const service = await build(makeConfig());

    await service.apply();

    for (const bucket of ["setpoint", "schedule", "configuration", "location", "control", "unit"] as const) {
      for (const call of prisma[bucket].calls) {
        expect(String(call.where.id).startsWith("DEMO_")).toBe(true);
      }
    }
  });
});
