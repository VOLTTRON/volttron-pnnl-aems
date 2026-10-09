import { StageType } from "@local/common";
import { PrismaClient } from "@prisma/client";
import { AppConfigService } from "@/app.config";
import { SubscriptionService } from "@/subscription/subscription.service";
import { Marked, MarkingClient, writeAndMark } from "./push-marking";
import { PrismaService } from "./prisma.service";

type Row = Record<string, any>;

/** Prisma's WHERE as far as the marking uses it: equality, `in`, `OR`, and a relation's `some`. */
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === "OR") return (value as Row[]).some((w) => matches(row, w));
    if (value && typeof value === "object" && "in" in value) return (value.in as unknown[]).includes(row[key]);
    if (value && typeof value === "object" && "some" in value) {
      return (row[key] as string[]).some((id) => matches({ id }, value.some as Row));
    }
    return row[key] === value;
  });
}

/**
 * Two configurations with two units each, a setpoint and schedules shared between them as the
 * schema allows, a holiday on the first, two controls, and an occupancy whose own schedule is used
 * by no configuration directly.
 */
function database() {
  const tables: Record<string, Row[]> = {
    setpoint: [{ id: "sp1" }, { id: "sp2" }, { id: "sp-occupancy" }],
    schedule: [
      { id: "mon1", setpointId: null },
      { id: "mon2", setpointId: null },
      { id: "occ-schedule", setpointId: "sp-occupancy" },
    ],
    configuration: [
      { id: "c1", setpointId: "sp1", mondayScheduleId: "mon1", holidays: ["h1"] },
      { id: "c2", setpointId: "sp2", mondayScheduleId: "mon2", holidays: [] },
    ],
    occupancy: [{ id: "o2", configurationId: "c2", scheduleId: "occ-schedule" }],
    holiday: [{ id: "h1" }],
    unit: [
      { id: "u1", configurationId: "c1", controlId: "k1" },
      { id: "u2", configurationId: "c1", controlId: "k1" },
      { id: "u3", configurationId: "c2", controlId: "k2" },
      { id: "u4", configurationId: "c2", controlId: null },
    ],
    control: [{ id: "k1" }, { id: "k2" }],
  };
  const marks = { units: [] as string[], controls: [] as string[] };
  const delegate = (table: string) => ({
    findMany: ({ where }: { where: Row }) => Promise.resolve(tables[table].filter((r) => matches(r, where)).map((r) => ({ ...r }))),
    updateMany: ({ where, data }: { where: Row; data: Row }) => {
      const rows = tables[table].filter((r) => matches(r, where));
      rows.forEach((r) => {
        expect(data).toEqual({ stage: StageType.Update.enum, message: null });
        (table === "unit" ? marks.units : marks.controls).push(r.id as string);
      });
      return Promise.resolve({ count: rows.length });
    },
  });
  const client = Object.fromEntries(Object.keys(tables).map((t) => [t, delegate(t)])) as unknown as MarkingClient;

  /** Runs a write the way the Prisma extension does, with QUERY standing in for the database's own. */
  async function write(model: string, operation: string, args: Row, query: (args: Row) => Row = (a) => ({ id: a.where?.id })) {
    await writeAndMark(client, model, operation, args, (a) => Promise.resolve(query(a as Row)));
    return { units: [...marks.units].sort(), controls: [...new Set(marks.controls)].sort() };
  }
  return { tables, write };
}

// scenario: edit-marks-every-unit
describe("an edit to what a configuration sends", () => {
  it.each([
    ["the configuration", "Configuration", { where: { id: "c1" }, data: { label: "renamed" } }],
    ["its setpoint", "Setpoint", { where: { id: "sp1" }, data: { setpoint: 72 } }],
    ["a schedule it uses", "Schedule", { where: { id: "mon1" }, data: { startTime: "07:00" } }],
    ["a holiday in it", "Holiday", { where: { id: "h1" }, data: { type: "Disabled" } }],
  ])("to %s marks every unit using it, and no other", async (_, model, args) => {
    const { write } = database();
    expect((await write(model, "update", args)).units).toEqual(["u1", "u2"]);
  });

  it("to an occupancy's schedule, or the occupancy, marks the units of the configuration it is in", async () => {
    expect((await database().write("Schedule", "update", { where: { id: "occ-schedule" }, data: { occupied: false } })).units).toEqual(["u3", "u4"]);
    expect((await database().write("Setpoint", "update", { where: { id: "sp-occupancy" }, data: { heating: 61 } })).units).toEqual(["u3", "u4"]);
    expect((await database().write("Occupancy", "update", { where: { id: "o2" }, data: { label: "x" } })).units).toEqual(["u3", "u4"]);
  });

  it("creating an occupancy in it, or deleting one, marks its units", async () => {
    const created = database();
    const added = await created.write("Occupancy", "create", { data: { configurationId: "c1" } }, () => {
      created.tables.occupancy.push({ id: "o-new", configurationId: "c1", scheduleId: null });
      return { id: "o-new" };
    });
    expect(added.units).toEqual(["u1", "u2"]);

    const deleting = database();
    const removed = await deleting.write("Occupancy", "delete", { where: { id: "o2" } }, () => {
      deleting.tables.occupancy = deleting.tables.occupancy.filter((o) => o.id !== "o2");
      return { id: "o2" };
    });
    expect(removed.units).toEqual(["u3", "u4"]);
  });

  it("through updateUnit, carrying the configuration, marks every unit using it", async () => {
    const { write } = database();
    expect((await write("Unit", "update", { where: { id: "u1" }, data: { configuration: { update: { label: "x" } } } })).units).toEqual(["u1", "u2"]);
  });

  it("to a unit's own settings marks that unit alone", async () => {
    const { write } = database();
    expect((await write("Unit", "update", { where: { id: "u1" }, data: { heatPump: true } })).units).toEqual(["u1"]);
  });

  it.each([
    ["stage", { stage: "Complete" }],
    ["message", { message: "Synchronizing with Volttron..." }],
    ["correlation", { correlation: "abc" }],
    ["stage, message and correlation together", { stage: "Fail", message: "x", correlation: "y" }],
  ])("to %s alone marks none", async (_, data) => {
    for (const [model, id] of [["Configuration", "c1"], ["Setpoint", "sp1"], ["Unit", "u1"], ["Control", "k1"]]) {
      expect(await database().write(model, "update", { where: { id }, data })).toEqual({ units: [], controls: [] });
    }
  });
});

// scenario: unit-edit-marks-control
describe("a control", () => {
  it("is marked when it is saved", async () => {
    expect((await database().write("Control", "update", { where: { id: "k2" }, data: { label: "x" } })).controls).toEqual(["k2"]);
  });

  it("is marked when any unit in it changes", async () => {
    expect((await database().write("Unit", "update", { where: { id: "u2" }, data: { peakLoadExclude: true } })).controls).toEqual(["k1"]);
  });

  it("is marked when a configuration its units use changes", async () => {
    expect((await database().write("Setpoint", "update", { where: { id: "sp2" }, data: { cooling: 79 } })).controls).toEqual(["k2"]);
  });

  it("a unit leaves and the one it joins are both marked", async () => {
    const db = database();
    const moved = await db.write("Unit", "update", { where: { id: "u1" }, data: { controlId: "k2" } }, () => {
      db.tables.unit.find((u) => u.id === "u1")!.controlId = "k2";
      return { id: "u1" };
    });
    expect(moved.controls).toEqual(["k1", "k2"]);
  });

  it("is not marked by a unit's stage, message or correlation alone", async () => {
    expect((await database().write("Unit", "update", { where: { id: "u1" }, data: { stage: "Process", message: null } })).controls).toEqual([]);
  });
});

// scenario: unit-save-order
describe("a Units-editor save", () => {
  it("writes holidays, occupancies and location before marking the unit for a push", async () => {
    const events: string[] = [];
    const client = {
      configuration: { findMany: () => Promise.resolve([]) },
      schedule: { findMany: () => Promise.resolve([]) },
      occupancy: { findMany: () => Promise.resolve([]) },
      unit: {
        findMany: () => Promise.resolve([{ id: "u1", configurationId: "c1", controlId: null }]),
        updateMany: ({ data }: { where: Row; data: Row }) => {
          expect(data).toEqual({ stage: StageType.Update.enum, message: null });
          events.push("mark-unit");
          return Promise.resolve({ count: 1 });
        },
      },
      control: { updateMany: () => Promise.resolve({ count: 0 }) },
    } as unknown as MarkingClient;

    // One prisma.unit.update call carrying nested writes for holidays, occupancies and location,
    // the way the Units-editor save is sent.
    const query = () => {
      events.push("write-holiday");
      events.push("write-occupancy");
      events.push("write-location");
      return Promise.resolve({ id: "u1" });
    };

    await writeAndMark(
      client,
      "Unit",
      "update",
      {
        where: { id: "u1" },
        data: {
          configuration: { update: { holidays: { update: {} }, occupancies: { update: {} } } },
          location: { update: {} },
        },
      },
      query,
    );

    expect(events).toEqual(["write-holiday", "write-occupancy", "write-location", "mark-unit"]);
  });

  it("skips the mark when nothing writable changed, so metadata-only saves do not push", async () => {
    const events: string[] = [];
    const client = {
      unit: { findMany: () => Promise.resolve([]), updateMany: () => { events.push("mark-unit"); return Promise.resolve({ count: 0 }); } },
      control: { updateMany: () => Promise.resolve({ count: 0 }) },
    } as unknown as MarkingClient;
    await writeAndMark(client, "Unit", "update", { where: { id: "u1" }, data: { stage: "Complete" } }, () => {
      events.push("write-metadata");
      return Promise.resolve({ id: "u1" });
    });
    expect(events).toEqual(["write-metadata"]);
  });
});

describe("a write through PrismaService", () => {
  const config = { log: { prisma: { level: "" } }, database: {}, password: { validate: false, strength: 0 } } as unknown as AppConfigService;

  /** A PrismaService over a client whose extension is captured, so a write can be sent through it. */
  function service() {
    let extension: any;
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const client = {
      $extends: jest.fn((e: unknown) => {
        extension = e;
        return {};
      }),
      unit: { findMany: jest.fn().mockResolvedValue([]), updateMany },
      control: { findMany: jest.fn().mockResolvedValue([{ id: "k2" }]), updateMany },
    };
    const prismaService = new PrismaService(config, client as unknown as PrismaClient);
    const write = (model: string, data: object) =>
      extension.query.$allModels.$allOperations({
        model,
        operation: "update",
        args: { where: { id: "k2" }, data },
        query: () => Promise.resolve({ id: "k2" }),
      }) as Promise<unknown>;
    return { prismaService, write, updateMany };
  }

  it("marks what it changes and tells every listener", async () => {
    const { prismaService, write, updateMany } = service();
    const heard: Marked[] = [];
    prismaService.onPushMarked((marked) => void heard.push(marked));
    await expect(write("Control", { label: "x" })).resolves.toEqual({ id: "k2" });
    expect(updateMany).toHaveBeenCalledWith({ where: { id: { in: ["k2"] } }, data: { stage: StageType.Update.enum, message: null } });
    expect(heard).toEqual([{ units: [], controls: ["k2"] }]);
  });

  it("tells no listener about a metadata-only write", async () => {
    const { prismaService, write } = service();
    const heard: Marked[] = [];
    prismaService.onPushMarked((marked) => void heard.push(marked));
    await write("Control", { stage: "Complete" });
    expect(heard).toEqual([]);
  });

  it("is published on the Unit and Control topics by SubscriptionService", async () => {
    const { prismaService } = service();
    let listener: ((marked: Marked) => Promise<void>) | undefined;
    jest.spyOn(prismaService, "onPushMarked").mockImplementation((l) => void (listener = l as typeof listener));
    const subscriptions = new SubscriptionService(prismaService, { graphql: { pubsub: "memory" }, nodeEnv: "test" } as unknown as AppConfigService);
    const publish = jest.spyOn(subscriptions, "publish").mockResolvedValue(undefined);
    await listener!({ units: ["u1"], controls: ["k1"] });
    expect(publish.mock.calls.map((c) => c[0])).toEqual(["Unit", "Unit/u1", "Control", "Control/k1"]);
  });
});
