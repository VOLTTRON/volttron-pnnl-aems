import { ConfigurationMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { ConfigurationQuery } from "./query.service";
import { SetpointMutation } from "../setpoint/mutate.service";
import { ScheduleMutation } from "../schedule/mutate.service";
import { OccupancyQuery } from "../occupancy/query.service";
import { OccupancyMutation } from "../occupancy/mutate.service";
import { HolidayQuery } from "../holiday/query.service";
import { HolidayMutation } from "../holiday/mutate.service";
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
    prismaCreate: jest.fn(() => "ConfigurationCreate"),
    prismaUpdate: jest.fn(() => "ConfigurationUpdate"),
    prismaCreateRelation: jest.fn(() => "ConfigurationCreateRelation"),
    prismaUpdateRelation: jest.fn(() => "ConfigurationUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeAllDeps() {
  return {
    configurationQuery: { ConfigurationWhereUnique: "ConfigurationWhereUnique" } as unknown as ConfigurationQuery,
    setpointMutation: { SetpointUpdate: "SetpointUpdate" } as unknown as SetpointMutation,
    scheduleMutation: { ScheduleUpdate: "ScheduleUpdate" } as unknown as ScheduleMutation,
    occupancyQuery: { OccupancyWhereUnique: "OccupancyWhereUnique" } as unknown as OccupancyQuery,
    occupancyMutation: { OccupancyCreate: "OccupancyCreate" } as unknown as OccupancyMutation,
    holidayQuery: { HolidayWhereUnique: "HolidayWhereUnique" } as unknown as HolidayQuery,
    holidayMutation: { HolidayCreate: "HolidayCreate" } as unknown as HolidayMutation,
  };
}

function makePrisma(returned: any = { id: "cfg1" }) {
  return {
    prisma: {
      configuration: {
        create: jest.fn().mockResolvedValue(returned),
        update: jest.fn().mockResolvedValue(returned),
        delete: jest.fn().mockResolvedValue(returned),
        findUnique: jest.fn().mockResolvedValue(returned),
      },
      unit: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(null),
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
  const deps = makeAllDeps();
  new ConfigurationMutation(
    makeBuilder(),
    prisma,
    sub,
    deps.configurationQuery,
    deps.setpointMutation,
    deps.scheduleMutation,
    deps.occupancyQuery,
    deps.occupancyMutation,
    deps.holidayQuery,
    deps.holidayMutation,
    change,
  );
  return { prisma, sub, change };
}

describe("ConfigurationMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers create/update/delete mutation fields", () => {
    instantiate();
    expect(Object.keys(resolvers).sort()).toEqual(["createConfiguration", "deleteConfiguration", "updateConfiguration"]);
  });

  it("createConfiguration creates, publishes, and records Configuration change", async () => {
    const { prisma, sub, change } = instantiate(makePrisma({ id: "cfg1", label: "L" }));
    await resolvers["createConfiguration"]({}, null, { create: { label: "L" } }, userCtx);
    expect(prisma.prisma.configuration.create).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledWith("Configuration", expect.objectContaining({ id: "cfg1" }));
    expect(change.handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "Configuration", "Create", userCtx.user);
  });

  it("createConfiguration also records nested Setpoint and Schedule changes when present", async () => {
    const { change } = instantiate(
      makePrisma({
        id: "cfg1",
        label: "L",
        setpoint: { id: "sp1", label: "Sp" },
        mondaySchedule: { id: "s-mon", label: "Mon" },
        tuesdaySchedule: { id: "s-tue", label: "Tue" },
      }),
    );
    await resolvers["createConfiguration"]({}, null, { create: { label: "L" } }, userCtx);
    expect(change.handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "Setpoint", "Create", userCtx.user);
    expect(change.handleChange).toHaveBeenCalledWith(expect.any(String), expect.any(Object), "Schedule", "Create", userCtx.user);
  });

  it("updateConfiguration publishes twice", async () => {
    const { sub } = instantiate(makePrisma({ id: "cfg1", label: "L" }));
    await resolvers["updateConfiguration"]({}, null, { where: { id: "cfg1" }, update: { label: "X" } }, userCtx);
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(sub.publish).toHaveBeenCalledWith("Configuration/cfg1", expect.any(Object));
  });

  it("deleteConfiguration deletes and publishes twice", async () => {
    const { prisma, sub } = instantiate(makePrisma({ id: "cfg1", label: "L" }));
    await resolvers["deleteConfiguration"]({}, null, { where: { id: "cfg1" } }, userCtx);
    expect(prisma.prisma.configuration.delete).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
  });
});
