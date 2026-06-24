
import { AccountMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { AccountQuery } from "./query.service";
import { UserQuery } from "../user/query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown) => unknown> = {};

function makeMockT() {
  return {
    prismaField: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    prismaCreate: jest.fn(() => "AccountCreate"),
    prismaCreateRelation: jest.fn(() => "AccountCreateRelation"),
    prismaUpdate: jest.fn(() => "AccountUpdate"),
    prismaUpdateRelation: jest.fn(() => "AccountUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makeAccountQuery(): AccountQuery {
  return { AccountWhereUnique: "AccountWhereUnique" } as unknown as AccountQuery;
}

function makeUserQuery(): UserQuery {
  return { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery;
}

function makePrisma(returnAccount: object = { id: "a1", type: "oauth" }) {
  return {
    prisma: {
      account: {
        create: jest.fn().mockResolvedValue(returnAccount),
        update: jest.fn().mockResolvedValue(returnAccount),
        delete: jest.fn().mockResolvedValue(returnAccount),
      },
    },
  } as unknown as PrismaService;
}

function makeSubscription() {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
  } as unknown as SubscriptionService;
}

describe("AccountMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("createAccount resolver", () => {
    it("calls prisma.account.create with args.create data", async () => {
      const prisma = makePrisma({ id: "a1", type: "oauth" });
      const sub = makeSubscription();
      new AccountMutation(makeBuilder(), prisma, sub, makeAccountQuery(), makeUserQuery());

      const resolve = resolvers["createAccount"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      const result = await resolve({}, null, { create: { type: "oauth", provider: "github", providerAccountId: "123" } });

      expect(prisma.prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { type: "oauth", provider: "github", providerAccountId: "123" } }),
      );
      expect(result).toEqual({ id: "a1", type: "oauth" });
    });

    it("publishes an Account subscription event after create", async () => {
      const account = { id: "a2", type: "oauth" };
      const prisma = makePrisma(account);
      const sub = makeSubscription();
      new AccountMutation(makeBuilder(), prisma, sub, makeAccountQuery(), makeUserQuery());

      const resolve = resolvers["createAccount"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { create: { type: "oauth", provider: "github", providerAccountId: "456" } });

      expect(sub.publish).toHaveBeenCalledTimes(1);
      expect(sub.publish).toHaveBeenCalledWith("Account", expect.objectContaining({ id: "a2" }));
    });
  });

  describe("updateAccount resolver", () => {
    it("calls prisma.account.update with where and data", async () => {
      const prisma = makePrisma({ id: "a1", type: "updated" });
      const sub = makeSubscription();
      new AccountMutation(makeBuilder(), prisma, sub, makeAccountQuery(), makeUserQuery());

      const resolve = resolvers["updateAccount"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "a1" }, update: { type: "updated" } });

      expect(prisma.prisma.account.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "a1" }, data: { type: "updated" } }),
      );
    });

    it("publishes two subscription events after update", async () => {
      const account = { id: "a1", type: "updated" };
      const prisma = makePrisma(account);
      const sub = makeSubscription();
      new AccountMutation(makeBuilder(), prisma, sub, makeAccountQuery(), makeUserQuery());

      const resolve = resolvers["updateAccount"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "a1" }, update: { type: "updated" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Account", expect.objectContaining({ id: "a1" }));
      expect(sub.publish).toHaveBeenCalledWith("Account/a1", expect.objectContaining({ id: "a1" }));
    });
  });

  describe("deleteAccount resolver", () => {
    it("calls prisma.account.delete with where arg", async () => {
      const prisma = makePrisma({ id: "a1", type: "oauth" });
      const sub = makeSubscription();
      new AccountMutation(makeBuilder(), prisma, sub, makeAccountQuery(), makeUserQuery());

      const resolve = resolvers["deleteAccount"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "a1" } });

      expect(prisma.prisma.account.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "a1" } }),
      );
    });

    it("publishes two subscription events after delete", async () => {
      const account = { id: "a1", type: "oauth" };
      const prisma = makePrisma(account);
      const sub = makeSubscription();
      new AccountMutation(makeBuilder(), prisma, sub, makeAccountQuery(), makeUserQuery());

      const resolve = resolvers["deleteAccount"] as (q: unknown, r: unknown, args: unknown) => Promise<unknown>;
      await resolve({}, null, { where: { id: "a1" } });

      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("Account", expect.objectContaining({ id: "a1" }));
      expect(sub.publish).toHaveBeenCalledWith("Account/a1", expect.objectContaining({ id: "a1" }));
    });
  });
});
