import { merge } from "lodash";

import { LogType } from "@/common";
import prisma from "@/prisma";

import { builder, PagingInput } from "../builder";
import { transformAggregate } from "../util";
import { LogAggregate, LogFields, LogOrderBy, LogWhere, LogWhereUnique } from "./input";

builder.queryField("readLog", (t) =>
  t.prismaField({
    description: "Read a unique log.",
    authScopes: { admin: true },
    type: "Log",
    args: {
      where: t.arg({ type: LogWhereUnique }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      if (!args.where) {
        throw new Error("Read input required.");
      }
      const auth = ctx.authUser;
      return prisma.log.findUniqueOrThrow({
        ...query,
        where: merge(args.where, auth.roles.admin ? {} : { type: LogType.BannerType?.enum }),
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
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.log.findMany({
        ...query,
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { type: LogType.BannerType?.enum }),
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
    resolve: async (_root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.log.count({
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { type: LogType.BannerType?.enum }),
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
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.log.groupBy({
        by: args.by ?? [],
        ...(transformAggregate(args.aggregate) as any),
        where: args.where ?? {},
      });
    },
  })
);
