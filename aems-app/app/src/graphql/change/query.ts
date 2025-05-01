import { prisma } from "@/prisma";
import { builder, PagingInput, DateTimeFilter, StringFilter, MutationTypeFilter } from "../builder";
import { UserOrderBy, UserWhere } from "../user/query";
import { transformAggregate } from "../util";
import { ChangeFields } from "./object";

export const ChangeAggregate = builder.inputType("ChangeAggregate", {
  fields: (t) => ({
    average: t.field({ type: [ChangeFields] }),
    count: t.field({ type: [ChangeFields] }),
    maximum: t.field({ type: [ChangeFields] }),
    minimum: t.field({ type: [ChangeFields] }),
    sum: t.field({ type: [ChangeFields] }),
  }),
});

export const ChangeWhereUnique = builder.prismaWhereUnique("Change", {
  fields: {
    id: "String",
  },
});

export const ChangeWhere = builder.prismaWhere("Change", {
  fields: {
    OR: true,
    AND: true,
    NOT: true,
    id: StringFilter,
    table: StringFilter,
    key: StringFilter,
    mutation: MutationTypeFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
    userId: StringFilter,
    user: UserWhere,
  },
});

export const ChangeOrderBy = builder.prismaOrderBy("Change", {
  fields: {
    id: true,
    table: true,
    key: true,
    mutation: true,
    createdAt: true,
    updatedAt: true,
    userId: true,
    user: UserOrderBy,
  },
});

builder.queryField("pageChange", (t) =>
  t.prismaConnection({
    description: "Paginate through multiple changes.",
    authScopes: { admin: true },
    type: "Change",
    cursor: "id",
    args: {
      where: t.arg({ type: ChangeWhere }),
    },
    resolve: async (query, _parent, args, _ctx, _info) => {
      return prisma.change.findMany({
        ...query,
        where: args.where ?? {},
      });
    },
  })
);

builder.queryField("readChange", (t) =>
  t.prismaField({
    description: "Read a unique change.",
    authScopes: { admin: true },
    type: "Change",
    args: {
      where: t.arg({ type: ChangeWhereUnique, required: true }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _change, args, _context, _info) => {
      subscriptions.register(`Change/${args.where.id}`);
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.change.findUniqueOrThrow({
        ...query,
        where: args.where,
      });
    },
  })
);

builder.queryField("readChanges", (t) =>
  t.prismaField({
    description: "Read a list of changes.",
    authScopes: { admin: true },
    type: ["Change"],
    args: {
      where: t.arg({ type: ChangeWhere }),
      distinct: t.arg({ type: [ChangeFields] }),
      orderBy: t.arg({ type: [ChangeOrderBy] }),
      paging: t.arg({ type: PagingInput }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _change, _args, _context, _info) => {
      subscriptions.register("Change");
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.change.findMany({
        ...query,
        where: args.where ?? undefined,
        distinct: args.distinct ?? undefined,
        orderBy: args.orderBy ?? {},
        ...(args.paging ?? {}),
      });
    },
  })
);

builder.queryField("countChanges", (t) =>
  t.field({
    description: "Count the number of changes.",
    authScopes: { admin: true },
    type: "Int",
    args: {
      where: t.arg({ type: ChangeWhere }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _change, _args, _context, _info) => {
      subscriptions.register("Change");
    },
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.change.count({
        where: args.where ?? undefined,
      });
    },
  })
);

builder.queryField("groupChanges", (t) =>
  t.field({
    description: "Group a list of changes.",
    authScopes: { admin: true },
    type: ["JSON"],
    args: {
      by: t.arg({ type: [ChangeFields], required: true }),
      where: t.arg({ type: ChangeWhere }),
      aggregate: t.arg({ type: ChangeAggregate }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _change, _args, _context, _info) => {
      subscriptions.register("Change");
    },
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.change.groupBy({
        by: args.by ?? [],
        ...(transformAggregate(args.aggregate) as any),
        where: args.where ?? undefined,
      });
    },
  })
);
