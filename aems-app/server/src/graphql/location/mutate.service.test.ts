import { LocationMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { LocationQuery } from "./query.service";
import { LocationObject } from "./object.service";
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
    prismaCreate: jest.fn(() => "LocationCreate"),
    prismaUpdate: jest.fn(() => "LocationUpdate"),
    prismaCreateRelation: jest.fn(() => "LocationCreateRelation"),
    prismaUpdateRelation: jest.fn(() => "LocationUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeLocationQuery(): LocationQuery {
  return { LocationWhereUnique: "LocationWhereUnique" } as unknown as LocationQuery;
}

function makeLocationObject(): LocationObject {
  return {} as unknown as LocationObject;
}

function makeUnitQuery(): UnitQuery {
  return { UnitWhereUnique: "UnitWhereUnique" } as unknown as UnitQuery;
}

function makePrisma(returned: object = { id: "l1" }) {
  return {
    prisma: {
      location: {
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

describe("LocationMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers create/update/delete mutation fields", () => {
    new LocationMutation(makeBuilder(), makePrisma(), makeSubscription(), makeLocationQuery(), makeLocationObject(), makeUnitQuery(), makeChangeService());
    expect(Object.keys(resolvers).sort()).toEqual(["createLocation", "deleteLocation", "updateLocation"]);
  });

  it("createLocation creates and records change", async () => {
    const prisma = makePrisma({ id: "l1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new LocationMutation(makeBuilder(), prisma, sub, makeLocationQuery(), makeLocationObject(), makeUnitQuery(), change);
    await resolvers["createLocation"]({}, null, { create: { name: "PNNL", latitude: 46, longitude: -119 } }, userCtx);
    expect(prisma.prisma.location.create).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledWith("Location", expect.objectContaining({ id: "l1" }));
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Location", "Create", userCtx.user);
  });

  it("updateLocation updates, publishes twice, records change", async () => {
    const prisma = makePrisma({ id: "l1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new LocationMutation(makeBuilder(), prisma, sub, makeLocationQuery(), makeLocationObject(), makeUnitQuery(), change);
    await resolvers["updateLocation"]({}, null, { where: { id: "l1" }, update: { name: "X" } }, userCtx);
    expect(prisma.prisma.location.update).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Location", "Update", userCtx.user);
  });

  it("deleteLocation deletes, publishes twice, records change", async () => {
    const prisma = makePrisma({ id: "l1" });
    const sub = makeSubscription();
    const change = makeChangeService();
    new LocationMutation(makeBuilder(), prisma, sub, makeLocationQuery(), makeLocationObject(), makeUnitQuery(), change);
    await resolvers["deleteLocation"]({}, null, { where: { id: "l1" } }, userCtx);
    expect(prisma.prisma.location.delete).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(change.handleChange).toHaveBeenCalledWith("Unknown", expect.any(Object), "Location", "Delete", userCtx.user);
  });
});
