import { HolidayMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { HolidayQuery } from "./query.service";
import { HolidayObject } from "./object.service";
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
    prismaCreate: jest.fn(() => "HolidayCreate"),
    prismaUpdate: jest.fn(() => "HolidayUpdate"),
    prismaCreateRelation: jest.fn(() => "HolidayCreateRelation"),
    prismaUpdateRelation: jest.fn(() => "HolidayUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeHolidayQuery(): HolidayQuery {
  return { HolidayWhereUnique: "HolidayWhereUnique" } as unknown as HolidayQuery;
}

function makeHolidayObject(): HolidayObject {
  return { HolidayType: "HolidayType" } as unknown as HolidayObject;
}

function makeConfigurationQuery(): ConfigurationQuery {
  return { ConfigurationWhereUnique: "ConfigurationWhereUnique" } as unknown as ConfigurationQuery;
}

function makePrisma(returned: object = { id: "h1" }) {
  return {
    prisma: {
      holiday: {
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

function makeMutation() {
  return new HolidayMutation(
    makeBuilder(),
    makePrisma(),
    makeSubscription(),
    makeHolidayQuery(),
    makeHolidayObject(),
    makeConfigurationQuery(),
    makeChangeService(),
  );
}

describe("HolidayMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers create/update/delete mutation fields", () => {
    makeMutation();
    expect(Object.keys(resolvers).sort()).toEqual(["createHoliday", "deleteHoliday", "updateHoliday"]);
  });

  it("createHoliday creates, publishes, and records change", async () => {
    const prisma = makePrisma({ id: "h1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new HolidayMutation(makeBuilder(), prisma, sub, makeHolidayQuery(), makeHolidayObject(), makeConfigurationQuery(), change);
    await resolvers["createHoliday"]({}, null, { create: { label: "Jul4" } }, userCtx);
    expect(prisma.prisma.holiday.create).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledWith("Holiday", expect.objectContaining({ id: "h1" }));
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Holiday", "Create", userCtx.user);
  });

  it("updateHoliday updates, publishes twice, records change", async () => {
    const prisma = makePrisma({ id: "h1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new HolidayMutation(makeBuilder(), prisma, sub, makeHolidayQuery(), makeHolidayObject(), makeConfigurationQuery(), change);
    await resolvers["updateHoliday"]({}, null, { where: { id: "h1" }, update: { label: "X" } }, userCtx);
    expect(prisma.prisma.holiday.update).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Holiday", "Update", userCtx.user);
  });

  it("deleteHoliday deletes, publishes twice, records change", async () => {
    const prisma = makePrisma({ id: "h1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new HolidayMutation(makeBuilder(), prisma, sub, makeHolidayQuery(), makeHolidayObject(), makeConfigurationQuery(), change);
    await resolvers["deleteHoliday"]({}, null, { where: { id: "h1" } }, userCtx);
    expect(prisma.prisma.holiday.delete).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Holiday", "Delete", userCtx.user);
  });
});
