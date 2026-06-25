import { OccupancyMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { OccupancyQuery } from "./query.service";
import { ScheduleMutation } from "../schedule/mutate.service";
import { ConfigurationQuery } from "../configuration/query.service";
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
    prismaCreate: jest.fn(() => "OccupancyCreate"),
    prismaUpdate: jest.fn(() => "OccupancyUpdate"),
    prismaCreateRelation: jest.fn(() => "OccupancyCreateRelation"),
    prismaUpdateRelation: jest.fn(() => "OccupancyUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeOccupancyQuery(): OccupancyQuery {
  return { OccupancyWhereUnique: "OccupancyWhereUnique" } as unknown as OccupancyQuery;
}

function makeScheduleMutation(): ScheduleMutation {
  return { ScheduleCreate: "ScheduleCreate", ScheduleUpdate: "ScheduleUpdate" } as unknown as ScheduleMutation;
}

function makeConfigurationQuery(): ConfigurationQuery {
  return { ConfigurationWhereUnique: "ConfigurationWhereUnique" } as unknown as ConfigurationQuery;
}

function makePrisma(returned: any = { id: "o1" }) {
  return {
    prisma: {
      occupancy: {
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

describe("OccupancyMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers create/update/delete mutation fields", () => {
    new OccupancyMutation(makeBuilder(), makePrisma(), makeSubscription(), makeOccupancyQuery(), makeScheduleMutation(), makeConfigurationQuery(), makeChangeService());
    expect(Object.keys(resolvers).sort()).toEqual(["createOccupancy", "deleteOccupancy", "updateOccupancy"]);
  });

  it("createOccupancy records only Occupancy change when no schedule", async () => {
    const prisma = makePrisma({ id: "o1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new OccupancyMutation(makeBuilder(), prisma, sub, makeOccupancyQuery(), makeScheduleMutation(), makeConfigurationQuery(), change);
    await resolvers["createOccupancy"]({}, null, { create: { label: "Mon" } }, userCtx);
    expect(prisma.prisma.occupancy.create).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledWith("Occupancy", expect.objectContaining({ id: "o1" }));
    expect(change.handleChange).toHaveBeenCalledTimes(1);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Occupancy", "Create", userCtx.user);
  });

  it("createOccupancy records both Occupancy and Schedule changes when schedule present", async () => {
    const prisma = makePrisma({ id: "o1", schedule: { id: "s1", label: "X" } });
    const sub = makeSubscription();
    const change = makeChangeService();
    new OccupancyMutation(makeBuilder(), prisma, sub, makeOccupancyQuery(), makeScheduleMutation(), makeConfigurationQuery(), change);
    await resolvers["createOccupancy"]({}, null, { create: { label: "Mon" } }, userCtx);
    expect(change.handleChange).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Schedule", "Create", userCtx.user);
  });

  it("updateOccupancy publishes twice and records change", async () => {
    const prisma = makePrisma({ id: "o1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new OccupancyMutation(makeBuilder(), prisma, sub, makeOccupancyQuery(), makeScheduleMutation(), makeConfigurationQuery(), change);
    await resolvers["updateOccupancy"]({}, null, { where: { id: "o1" }, update: { label: "X" } }, userCtx);
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Occupancy", "Update", userCtx.user);
  });

  it("deleteOccupancy publishes twice and records change", async () => {
    const prisma = makePrisma({ id: "o1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new OccupancyMutation(makeBuilder(), prisma, sub, makeOccupancyQuery(), makeScheduleMutation(), makeConfigurationQuery(), change);
    await resolvers["deleteOccupancy"]({}, null, { where: { id: "o1" } }, userCtx);
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Occupancy", "Delete", userCtx.user);
  });
});
