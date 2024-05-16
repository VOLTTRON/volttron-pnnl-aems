import { merge } from "lodash";

import prisma from "@/prisma";

import { builder, PagingInput } from "../builder";
import { transformAggregate } from "../util";
import {
  ConfigurationsAggregate,
  ConfigurationsFields,
  ConfigurationsOrderBy,
  ConfigurationsWhere,
  ConfigurationsWhereUnique,
} from "./input";

builder.queryField("readConfiguration", (t) =>
  t.prismaField({
    description: "Read a unique configuration.",
    authScopes: { user: true },
    type: "Configurations",
    args: {
      where: t.arg({ type: ConfigurationsWhereUnique }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      if (!args.where) {
        throw new Error("Read input required.");
      }
      const auth = ctx.authUser;
      return prisma.configurations.findUniqueOrThrow({
        ...query,
        where: merge(args.where, auth.roles.admin ? {} : { userId: auth.id }),
      });
    },
  })
);

builder.queryField("readConfigurations", (t) =>
  t.prismaField({
    description: "Read a list of configurations.",
    authScopes: { user: true },
    type: ["Configurations"],
    args: {
      where: t.arg({ type: ConfigurationsWhere }),
      distinct: t.arg({ type: [ConfigurationsFields] }),
      orderBy: t.arg({ type: [ConfigurationsOrderBy] }),
      paging: t.arg({ type: PagingInput }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.configurations.findMany({
        ...query,
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { userId: auth.id }),
        distinct: args.distinct ?? undefined,
        orderBy: args.orderBy ?? {},
        ...(args.paging ?? {}),
      });
    },
  })
);

builder.queryField("countConfigurations", (t) =>
  t.field({
    description: "Count the number of configurations.",
    authScopes: { user: true },
    type: "Int",
    args: {
      where: t.arg({ type: ConfigurationsWhere }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.configurations.count({
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { userId: auth.id }),
      });
    },
  })
);

builder.queryField("groupConfigurations", (t) =>
  t.field({
    description: "Group a list of configurations.",
    authScopes: { user: true },
    type: ["JSON"],
    args: {
      by: t.arg({ type: [ConfigurationsFields], required: true }),
      where: t.arg({ type: ConfigurationsWhere }),
      aggregate: t.arg({ type: ConfigurationsAggregate }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.configurations.groupBy({
        by: args.by ?? [],
        ...(transformAggregate(args.aggregate) as any),
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { userId: auth.id }),
      });
    },
  })
);
