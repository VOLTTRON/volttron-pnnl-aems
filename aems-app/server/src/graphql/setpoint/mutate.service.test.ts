import { SetpointMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { SetpointQuery } from "./query.service";
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
    prismaCreate: jest.fn(() => "SetpointCreate"),
    prismaUpdate: jest.fn(() => "SetpointUpdate"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeSetpointQuery(): SetpointQuery {
  return { SetpointWhereUnique: "SetpointWhereUnique" } as unknown as SetpointQuery;
}

function makePrisma(returned: object = { id: "sp1", label: "L" }) {
  return {
    prisma: {
      setpoint: {
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

describe("SetpointMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers create/update/delete mutation fields", () => {
    new SetpointMutation(makeBuilder(), makePrisma(), makeSubscription(), makeSetpointQuery(), makeChangeService());
    expect(Object.keys(resolvers).sort()).toEqual(["createSetpoint", "deleteSetpoint", "updateSetpoint"]);
  });

  it("createSetpoint creates, publishes, and records change", async () => {
    const prisma = makePrisma({ id: "sp1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new SetpointMutation(makeBuilder(), prisma, sub, makeSetpointQuery(), change);
    await resolvers["createSetpoint"]({}, null, { create: { setpoint: 72 } }, userCtx);
    expect(prisma.prisma.setpoint.create).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledWith("Setpoint", expect.objectContaining({ id: "sp1" }));
    expect(change.handleChange).toHaveBeenCalledWith(
      "Unknown",
      expect.any(Object),
      "Setpoint",
      "Create",
      userCtx.user,
    );
  });

  it("updateSetpoint updates, publishes twice, and records change", async () => {
    const prisma = makePrisma({ id: "sp1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new SetpointMutation(makeBuilder(), prisma, sub, makeSetpointQuery(), change);
    await resolvers["updateSetpoint"]({}, null, { where: { id: "sp1" }, update: { setpoint: 74 } }, userCtx);
    expect(prisma.prisma.setpoint.update).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(sub.publish).toHaveBeenCalledWith("Setpoint/sp1", expect.any(Object));
    expect(change.handleChange).toHaveBeenCalledWith(
      "Unknown",
      expect.any(Object),
      "Setpoint",
      "Update",
      userCtx.user,
    );
  });

  it("deleteSetpoint deletes, publishes twice, and records change", async () => {
    const prisma = makePrisma({ id: "sp1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new SetpointMutation(makeBuilder(), prisma, sub, makeSetpointQuery(), change);
    await resolvers["deleteSetpoint"]({}, null, { where: { id: "sp1" } }, userCtx);
    expect(prisma.prisma.setpoint.delete).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith(
      "Unknown",
      expect.any(Object),
      "Setpoint",
      "Delete",
      userCtx.user,
    );
  });
});
