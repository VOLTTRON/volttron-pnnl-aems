import { prisma } from "@/prisma";
import { builder, DateTimeFilter, PagingInput, StringFilter } from "../builder";
import { transformAggregate } from "../util";
import { UserFields } from "./object";

export const UserAggregate = builder.inputType("UserAggregate", {
  fields: (t) => ({
    average: t.field({ type: [UserFields] }),
    count: t.field({ type: [UserFields] }),
    maximum: t.field({ type: [UserFields] }),
    minimum: t.field({ type: [UserFields] }),
    sum: t.field({ type: [UserFields] }),
  }),
});

export const UserWhereUnique = builder.prismaWhereUnique("User", {
  fields: {
    id: "String",
  },
});

export const UserWhere = builder.prismaWhere("User", {
  fields: {
    OR: true,
    AND: true,
    NOT: true,
    id: StringFilter,
    name: StringFilter,
    email: StringFilter,
    image: StringFilter,
    role: StringFilter,
    emailVerified: DateTimeFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
  },
});

export const UserOrderBy = builder.prismaOrderBy("User", {
  fields: {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
  },
});

builder.queryField("pageUser", (t) =>
  t.prismaConnection({
    description: "Paginate through multiple users.",
    authScopes: { admin: true },
    type: "User",
    cursor: "id",
    args: {
      where: t.arg({ type: UserWhere }),
    },
    resolve: async (query, _parent, args, _ctx, _info) => {
      return prisma.user.findMany({
        ...query,
        where: args.where ?? {},
      });
    },
  })
);

builder.queryField("readUser", (t) =>
  t.prismaField({
    description: "Read a unique user.",
    authScopes: { admin: true },
    type: "User",
    args: {
      where: t.arg({ type: UserWhereUnique, required: true }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _parent, args, _context, _info) => {
      subscriptions.register(`User/${args.where.id}`);
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.user.findUniqueOrThrow({
        ...query,
        where: args.where,
      });
    },
  })
);

builder.queryField("readUsers", (t) =>
  t.prismaField({
    description: "Read a list of user.",
    authScopes: { admin: true },
    type: ["User"],
    args: {
      where: t.arg({ type: UserWhere }),
      distinct: t.arg({ type: [UserFields] }),
      orderBy: t.arg({ type: [UserOrderBy] }),
      paging: t.arg({ type: PagingInput }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _parent, _args, _context, _info) => {
      subscriptions.register("User");
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.user.findMany({
        ...query,
        where: args.where ?? {},
        distinct: args.distinct ?? undefined,
        orderBy: args.orderBy ?? {},
        ...(args.paging ?? {}),
      });
    },
  })
);

builder.queryField("countUsers", (t) =>
  t.field({
    description: "Count the number of user.",
    authScopes: { admin: true },
    type: "Int",
    args: {
      where: t.arg({ type: UserWhere }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _parent, _args, _context, _info) => {
      subscriptions.register("User");
    },
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.user.count({
        where: args.where ?? {},
      });
    },
  })
);

builder.queryField("groupUsers", (t) =>
  t.field({
    description: "Group a list of user.",
    authScopes: { admin: true },
    type: ["JSON"],
    args: {
      by: t.arg({ type: [UserFields], required: true }),
      where: t.arg({ type: UserWhere }),
      aggregate: t.arg({ type: UserAggregate }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _parent, _args, _context, _info) => {
      subscriptions.register("User");
    },
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.user.groupBy({
        by: args.by ?? [],
        ...(transformAggregate(args.aggregate) as any),
        where: args.where ?? {},
      });
    },
  })
);
