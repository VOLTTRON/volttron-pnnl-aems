import { UnitMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { UnitQuery } from "./query.service";
import { ConfigurationMutation } from "../configuration/mutate.service";
import { ControlMutation } from "../control/mutate.service";
import { LocationMutation } from "../location/mutate.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { ChangeService } from "@/change/change.service";

const resolvers: Record<string, (...args: unknown[]) => unknown> = {};

function makeMockT() {
  return {
    prismaField: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    ModelStage: "ModelStage",
    prismaCreate: jest.fn(() => "UnitCreate"),
    prismaUpdate: jest.fn(() => "UnitUpdate"),
    prismaCreateRelation: jest.fn(() => "UnitCreateRelation"),
    prismaUpdateRelation: jest.fn(() => "UnitUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeUnitQuery(): UnitQuery {
  return { UnitWhereUnique: "UnitWhereUnique" } as unknown as UnitQuery;
}

function makeConfigurationMutation(): ConfigurationMutation {
  return { ConfigurationUpdate: "ConfigurationUpdate" } as unknown as ConfigurationMutation;
}

function makeControlMutation(): ControlMutation {
  return { ControlUpdate: "ControlUpdate" } as unknown as ControlMutation;
}

function makeLocationMutation(): LocationMutation {
  return { LocationUpdate: "LocationUpdate" } as unknown as LocationMutation;
}

function makePrisma(returned: any = { id: "u1", label: "L", name: "AHU-1" }, beforeRow: any = null) {
  return {
    prisma: {
      unit: {
        create: jest.fn().mockResolvedValue(returned),
        update: jest.fn().mockResolvedValue(returned),
        delete: jest.fn().mockResolvedValue(returned),
        findUnique: jest.fn().mockResolvedValue(beforeRow ?? returned),
      },
    },
  } as unknown as PrismaService;
}

function makeSubscription() {
  return { publish: jest.fn().mockResolvedValue(undefined) } as unknown as SubscriptionService;
}

function makeChangeService(): ChangeService {
  return { handleChange: jest.fn().mockResolvedValue(undefined) } as unknown as ChangeService;
}

const userCtx = { user: { id: "u1", authRoles: { admin: false } } };

function instantiate(prisma = makePrisma(), sub = makeSubscription(), change = makeChangeService()) {
  new UnitMutation(
    makeBuilder(),
    prisma,
    sub,
    makeUnitQuery(),
    makeConfigurationMutation(),
    makeControlMutation(),
    makeLocationMutation(),
    change,
  );
  return { prisma, sub, change };
}

describe("UnitMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers create/update/delete mutation fields", () => {
    instantiate();
    expect(Object.keys(resolvers).sort()).toEqual(["createUnit", "deleteUnit", "updateUnit"]);
  });

  it("createUnit publishes and records Unit change", async () => {
    const { prisma, sub, change } = instantiate(makePrisma({ id: "u1", label: "L", name: "AHU-1" }));
    await resolvers["createUnit"]({}, null, { create: { name: "AHU-1" } }, userCtx);
    expect(prisma.prisma.unit.create).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledWith("Unit", expect.objectContaining({ id: "u1" }));
    expect(change.handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "Unit", "Create", userCtx.user);
  });

  it("createUnit records nested Configuration/Control/Location changes when present", async () => {
    const { change } = instantiate(
      makePrisma({
        id: "u1",
        label: "L",
        name: "AHU-1",
        configuration: { id: "cfg1", label: "C" },
        control: { id: "ctrl1", name: "Ctl" },
        location: { id: "loc1", name: "Loc" },
      }),
    );
    await resolvers["createUnit"]({}, null, { create: { name: "AHU-1" } }, userCtx);
    expect(change.handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "Configuration", "Create", userCtx.user);
    expect(change.handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "Control", "Create", userCtx.user);
    expect(change.handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "Location", "Create", userCtx.user);
  });

  it("updateUnit publishes twice and queries before-row", async () => {
    const before = { id: "u1", label: "old" };
    const after = { id: "u1", label: "new", name: "AHU-1", stage: "Pending" };
    const prisma = makePrisma(after, before);
    const sub = makeSubscription();
    instantiate(prisma, sub);
    await resolvers["updateUnit"]({}, null, { where: { id: "u1" }, update: { label: "new" } }, userCtx);
    expect(prisma.prisma.unit.findUnique).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(sub.publish).toHaveBeenCalledWith("Unit/u1", expect.any(Object));
  });

  it("deleteUnit publishes twice and records Unit change", async () => {
    const { prisma, sub, change } = instantiate(makePrisma({ id: "u1", label: "L", name: "AHU-1" }));
    await resolvers["deleteUnit"]({}, null, { where: { id: "u1" } }, userCtx);
    expect(prisma.prisma.unit.delete).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "Unit", "Delete", userCtx.user);
  });
});
