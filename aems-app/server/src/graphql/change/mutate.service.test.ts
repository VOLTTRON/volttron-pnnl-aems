import { ChangeMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { ChangeQuery } from "./query.service";
import { ChangeObject } from "./object.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

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
    prismaCreate: jest.fn(() => "ChangeCreate"),
    prismaUpdate: jest.fn(() => "ChangeUpdate"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeChangeQuery(): ChangeQuery {
  return { ChangeWhereUnique: "ChangeWhereUnique" } as unknown as ChangeQuery;
}

function makeChangeObject(): ChangeObject {
  return { ChangeData: "ChangeData", ChangeMutation: "ChangeMutationEnum" } as unknown as ChangeObject;
}

function makePrisma(returned: object = { id: "c1" }) {
  return {
    prisma: {
      change: {
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

const adminCtx = { user: { id: "admin", authRoles: { admin: true } } };

describe("ChangeMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  it("registers create/update/delete mutation fields", () => {
    new ChangeMutation(makeBuilder(), makePrisma(), makeSubscription(), makeChangeQuery(), makeChangeObject());
    expect(Object.keys(resolvers).sort()).toEqual(["createChange", "deleteChange", "updateChange"]);
  });

  it("createChange calls prisma.change.create and publishes subscription", async () => {
    const prisma = makePrisma({ id: "c1" });
    const sub = makeSubscription();
    new ChangeMutation(makeBuilder(), prisma, sub, makeChangeQuery(), makeChangeObject());
    const result = await resolvers["createChange"]({}, null, { create: { table: "User" } }, adminCtx);
    expect(prisma.prisma.change.create).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledWith("Change", expect.objectContaining({ id: "c1" }));
    expect(result).toEqual({ id: "c1" });
  });

  it("updateChange calls prisma.change.update and publishes 2 subscriptions", async () => {
    const prisma = makePrisma({ id: "c1" });
    const sub = makeSubscription();
    new ChangeMutation(makeBuilder(), prisma, sub, makeChangeQuery(), makeChangeObject());
    await resolvers["updateChange"]({}, null, { where: { id: "c1" }, update: { table: "X" } }, adminCtx);
    expect(prisma.prisma.change.update).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(sub.publish).toHaveBeenCalledWith("Change", expect.any(Object));
    expect(sub.publish).toHaveBeenCalledWith("Change/c1", expect.any(Object));
  });

  it("deleteChange calls prisma.change.delete and publishes 2 subscriptions", async () => {
    const prisma = makePrisma({ id: "c1" });
    const sub = makeSubscription();
    new ChangeMutation(makeBuilder(), prisma, sub, makeChangeQuery(), makeChangeObject());
    await resolvers["deleteChange"]({}, null, { where: { id: "c1" } }, adminCtx);
    expect(prisma.prisma.change.delete).toHaveBeenCalled();
    expect(sub.publish).toHaveBeenCalledTimes(2);
    expect(sub.publish).toHaveBeenCalledWith("Change/c1", expect.any(Object));
  });
});
