import { merge } from "lodash";

import prisma from "@/prisma";

import { builder, PagingInput } from "../builder";
import { transformAggregate } from "../util";
import { UnitsAggregate, UnitsFields, UnitsOrderBy, UnitsWhere, UnitsWhereUnique } from "./input";

builder.queryField("readUnits", (t) =>
  t.prismaField({
    description: "Read a unique units.",
    authScopes: { user: true },
    type: "Units",
    args: {
      where: t.arg({ type: UnitsWhereUnique }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      if (!args.where) {
        throw new Error("Read input required.");
      }
      const auth = ctx.authUser;
      return prisma.units.findUniqueOrThrow({
        ...query,
        where: merge(args.where, auth.roles.admin ? {} : { userId: auth.id }),
      });
    },
  })
);

builder.queryField("readUnitss", (t) =>
  t.prismaField({
    description: "Read a list of unitss.",
    authScopes: { user: true },
    type: ["Units"],
    args: {
      where: t.arg({ type: UnitsWhere }),
      distinct: t.arg({ type: [UnitsFields] }),
      orderBy: t.arg({ type: [UnitsOrderBy] }),
      paging: t.arg({ type: PagingInput }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.units.findMany({
        ...query,
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { userId: auth.id }),
        distinct: args.distinct ?? undefined,
        orderBy: args.orderBy ?? {},
        ...(args.paging ?? {}),
      });
    },
  })
);

builder.queryField("countUnitss", (t) =>
  t.field({
    description: "Count the number of unitss.",
    authScopes: { user: true },
    type: "Int",
    args: {
      where: t.arg({ type: UnitsWhere }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.units.count({
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { userId: auth.id }),
      });
    },
  })
);

builder.queryField("groupUnitss", (t) =>
  t.field({
    description: "Group a list of unitss.",
    authScopes: { user: true },
    type: ["JSON"],
    args: {
      by: t.arg({ type: [UnitsFields], required: true }),
      where: t.arg({ type: UnitsWhere }),
      aggregate: t.arg({ type: UnitsAggregate }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.units.groupBy({
        by: args.by ?? [],
        ...(transformAggregate(args.aggregate) as any),
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { userId: auth.id }),
      });
    },
  })
);
