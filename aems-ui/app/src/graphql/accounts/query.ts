import { merge } from "lodash";

import prisma from "@/prisma";

import { builder, PagingInput } from "../builder";
import { transformAggregate } from "../util";
import { AccountAggregate, AccountFields, AccountOrderBy, AccountWhere, AccountWhereUnique } from "./input";

builder.queryField("readAccount", (t) =>
  t.prismaField({
    description: "Read a unique account.",
    authScopes: { user: true },
    type: "Account",
    args: {
      where: t.arg({ type: AccountWhereUnique }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      if (!args.where) {
        throw new Error("Read input required.");
      }
      const auth = ctx.authUser;
      return prisma.account.findUniqueOrThrow({
        ...query,
        where: merge(args.where, auth.roles.admin ? {} : { userId: auth.id }),
      });
    },
  })
);

builder.queryField("readAccounts", (t) =>
  t.prismaField({
    description: "Read a list of accounts.",
    authScopes: { user: true },
    type: ["Account"],
    args: {
      where: t.arg({ type: AccountWhere }),
      distinct: t.arg({ type: [AccountFields] }),
      orderBy: t.arg({ type: [AccountOrderBy] }),
      paging: t.arg({ type: PagingInput }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.account.findMany({
        ...query,
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { userId: auth.id }),
        distinct: args.distinct ?? undefined,
        orderBy: args.orderBy ?? {},
        ...(args.paging ?? {}),
      });
    },
  })
);

builder.queryField("countAccounts", (t) =>
  t.field({
    description: "Count the number of accounts.",
    authScopes: { user: true },
    type: "Int",
    args: {
      where: t.arg({ type: AccountWhere }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.account.count({
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { userId: auth.id }),
      });
    },
  })
);

builder.queryField("groupAccounts", (t) =>
  t.field({
    description: "Group a list of accounts.",
    authScopes: { user: true },
    type: ["JSON"],
    args: {
      by: t.arg({ type: [AccountFields], required: true }),
      where: t.arg({ type: AccountWhere }),
      aggregate: t.arg({ type: AccountAggregate }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const auth = ctx.authUser;
      return prisma.account.groupBy({
        by: args.by ?? [],
        ...(transformAggregate(args.aggregate) as any),
        where: merge(args.where ?? {}, auth.roles.admin ? {} : { userId: auth.id }),
      });
    },
  })
);
