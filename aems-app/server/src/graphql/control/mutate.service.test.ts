import { ControlMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { ControlQuery } from "./query.service";
import { UnitQuery } from "../unit/query.service";
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
    prismaCreate: jest.fn(() => "ControlCreate"),
    prismaUpdate: jest.fn(() => "ControlUpdate"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeControlQuery(): ControlQuery {
  return { ControlWhereUnique: "ControlWhereUnique" } as unknown as ControlQuery;
}

function makeUnitQuery(): UnitQuery {
  return { UnitWhereUnique: "UnitWhereUnique" } as unknown as UnitQuery;
}

function makePrisma(returned: object = { id: "ctrl1" }) {
  return {
    prisma: {
      control: {
        create: jest.fn().mockResolvedValue(returned),
        update: jest.fn().mockResolvedValue(returned),
        delete: jest.fn().mockResolvedValue(returned),
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

describe("ControlMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers create/update/delete mutation fields", () => {
    new ControlMutation(makeBuilder(), makePrisma(), makeSubscription(), makeControlQuery(), makeUnitQuery(), makeChangeService());
    expect(Object.keys(resolvers).sort()).toEqual(["createControl", "deleteControl", "updateControl"]);
  });

  it("createControl creates and records change", async () => {
    const prisma = makePrisma({ id: "ctrl1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new ControlMutation(makeBuilder(), prisma, sub, makeControlQuery(), makeUnitQuery(), change);
    await resolvers["createControl"]({}, null, { create: { name: "C" } }, userCtx);
    expect(prisma.prisma.control.create).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledWith("Control", expect.objectContaining({ id: "ctrl1" }));
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Control", "Create", userCtx.user);
  });

  it("updateControl updates, publishes twice, records change", async () => {
    const prisma = makePrisma({ id: "ctrl1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new ControlMutation(makeBuilder(), prisma, sub, makeControlQuery(), makeUnitQuery(), change);
    await resolvers["updateControl"]({}, null, { where: { id: "ctrl1" }, update: { name: "C2" } }, userCtx);
    expect(prisma.prisma.control.update).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(sub.publish).toHaveBeenCalledWith("Control/ctrl1", expect.any(Object));
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Control", "Update", userCtx.user);
  });

  it("deleteControl deletes, publishes twice, records change", async () => {
    const prisma = makePrisma({ id: "ctrl1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new ControlMutation(makeBuilder(), prisma, sub, makeControlQuery(), makeUnitQuery(), change);
    await resolvers["deleteControl"]({}, null, { where: { id: "ctrl1" } }, userCtx);
    expect(prisma.prisma.control.delete).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Control", "Delete", userCtx.user);
  });
});
