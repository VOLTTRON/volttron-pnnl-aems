import { prisma } from "@/prisma";
import { builder, DateTimeFilter, LogTypeFilter, PagingInput, StringFilter } from "../builder";
import { transformAggregate } from "../util";
import { LogFields } from "./object";

export const LogAggregate = builder.inputType("LogAggregate", {
  fields: (t) => ({
    average: t.field({ type: [LogFields] }),
    count: t.field({ type: [LogFields] }),
    maximum: t.field({ type: [LogFields] }),
    minimum: t.field({ type: [LogFields] }),
    sum: t.field({ type: [LogFields] }),
  }),
});

export const LogWhereUnique = builder.prismaWhereUnique("Log", {
  fields: {
    id: "String",
  },
});
export const LogWhere = builder.prismaWhere("Log", {
  fields: {
    OR: true,
    AND: true,
    NOT: true,
    id: StringFilter,
    type: LogTypeFilter,
    message: StringFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
  },
});

export const LogOrderBy = builder.prismaOrderBy("Log", {
  fields: {
    id: true,
    type: true,
    message: true,
    createdAt: true,
    updatedAt: true,
  },
});

builder.queryField("pageLog", (t) =>
  t.prismaConnection({
    description: "Paginate through multiple logs.",
    authScopes: { admin: true },
    type: "Log",
    cursor: "id",
    args: {
      where: t.arg({ type: LogWhere }),
    },
    resolve: async (query, _parent, args, _ctx, _info) => {
      return prisma.log.findMany({
        ...query,
        where: args.where ?? {},
      });
    },
  })
);

builder.queryField("readLog", (t) =>
  t.prismaField({
    description: "Read a unique log.",
    authScopes: { admin: true },
    type: "Log",
    args: {
      where: t.arg({ type: LogWhereUnique, required: true }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _log, args, _context, _info) => {
      subscriptions.register(`Log/${args.where.id}`);
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.log.findUniqueOrThrow({
        ...query,
        where: args.where,
      });
    },
  })
);

builder.queryField("readLogs", (t) =>
  t.prismaField({
    description: "Read a list of logs.",
    authScopes: { admin: true },
    type: ["Log"],
    args: {
      where: t.arg({ type: LogWhere }),
      distinct: t.arg({ type: [LogFields] }),
      orderBy: t.arg({ type: [LogOrderBy] }),
      paging: t.arg({ type: PagingInput }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _log, _args, _context, _info) => {
      subscriptions.register("Log");
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.log.findMany({
        ...query,
        where: args.where ?? undefined,
        distinct: args.distinct ?? undefined,
        orderBy: args.orderBy ?? {},
        ...(args.paging ?? {}),
      });
    },
  })
);

builder.queryField("countLogs", (t) =>
  t.field({
    description: "Count the number of logs.",
    authScopes: { admin: true },
    type: "Int",
    args: {
      where: t.arg({ type: LogWhere }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _log, _args, _context, _info) => {
      subscriptions.register("Log");
    },
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.log.count({
        where: args.where ?? undefined,
      });
    },
  })
);

builder.queryField("groupLogs", (t) =>
  t.field({
    description: "Group a list of logs.",
    authScopes: { admin: true },
    type: ["JSON"],
    args: {
      by: t.arg({ type: [LogFields], required: true }),
      where: t.arg({ type: LogWhere }),
      aggregate: t.arg({ type: LogAggregate }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _log, _args, _context, _info) => {
      subscriptions.register("Log");
    },
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.log.groupBy({
        by: args.by ?? [],
        ...(transformAggregate(args.aggregate) as any),
        where: args.where ?? {},
      });
    },
  })
);
