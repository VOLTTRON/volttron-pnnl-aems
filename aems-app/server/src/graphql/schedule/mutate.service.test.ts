import { ScheduleMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { ScheduleQuery } from "./query.service";
import { SetpointMutation } from "../setpoint/mutate.service";
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
    prismaCreate: jest.fn(() => "ScheduleCreate"),
    prismaUpdate: jest.fn(() => "ScheduleUpdate"),
    prismaCreateRelation: jest.fn(() => "ScheduleCreateRelation"),
    prismaUpdateRelation: jest.fn(() => "ScheduleUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeScheduleQuery(): ScheduleQuery {
  return { ScheduleWhereUnique: "ScheduleWhereUnique" } as unknown as ScheduleQuery;
}

function makeSetpointMutation(): SetpointMutation {
  return { SetpointCreate: "SetpointCreate", SetpointUpdate: "SetpointUpdate" } as unknown as SetpointMutation;
}

function makePrisma(returned: any = { id: "s1" }) {
  return {
    prisma: {
      schedule: {
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

describe("ScheduleMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers create/update/delete mutation fields", () => {
    new ScheduleMutation(makeBuilder(), makePrisma(), makeSubscription(), makeScheduleQuery(), makeSetpointMutation(), makeChangeService());
    expect(Object.keys(resolvers).sort()).toEqual(["createSchedule", "deleteSchedule", "updateSchedule"]);
  });

  it("createSchedule records Schedule change (no setpoint)", async () => {
    const prisma = makePrisma({ id: "s1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new ScheduleMutation(makeBuilder(), prisma, sub, makeScheduleQuery(), makeSetpointMutation(), change);
    await resolvers["createSchedule"]({}, null, { create: { label: "W" } }, userCtx);
    expect(prisma.prisma.schedule.create).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledWith("Schedule", expect.objectContaining({ id: "s1" }));
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Schedule", "Create", userCtx.user);
    expect(change.handleChange).toHaveBeenCalledTimes(1);
  });

  it("createSchedule also records Setpoint change when setpoint present", async () => {
    const prisma = makePrisma({ id: "s1", setpoint: { id: "sp1", label: "Sp" } });
    const sub = makeSubscription();
    const change = makeChangeService();
    new ScheduleMutation(makeBuilder(), prisma, sub, makeScheduleQuery(), makeSetpointMutation(), change);
    await resolvers["createSchedule"]({}, null, { create: { label: "W" } }, userCtx);
    expect(change.handleChange).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Setpoint", "Create", userCtx.user);
  });

  it("updateSchedule publishes twice and records change", async () => {
    const prisma = makePrisma({ id: "s1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new ScheduleMutation(makeBuilder(), prisma, sub, makeScheduleQuery(), makeSetpointMutation(), change);
    await resolvers["updateSchedule"]({}, null, { where: { id: "s1" }, update: { label: "X" } }, userCtx);
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Schedule", "Update", userCtx.user);
  });

  it("deleteSchedule publishes twice and records change", async () => {
    const prisma = makePrisma({ id: "s1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new ScheduleMutation(makeBuilder(), prisma, sub, makeScheduleQuery(), makeSetpointMutation(), change);
    await resolvers["deleteSchedule"]({}, null, { where: { id: "s1" } }, userCtx);
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Schedule", "Delete", userCtx.user);
  });
});
