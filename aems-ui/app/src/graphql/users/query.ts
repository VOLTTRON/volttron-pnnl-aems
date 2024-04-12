import prisma from "@/prisma";

import { builder, PagingInput } from "../builder";
import { transformAggregate } from "../util";
import { UserAggregate, UserFields, UserOrderBy, UserWhere, UserWhereUnique } from "./input";

builder.queryField("readUser", (t) =>
  t.prismaField({
    description: "Read a unique user.",
    authScopes: { admin: true },
    type: "User",
    args: {
      where: t.arg({ type: UserWhereUnique }),
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      if (!args.where) {
        throw new Error("Read input required.");
      }
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
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.user.groupBy({
        by: args.by ?? [],
        ...(transformAggregate(args.aggregate) as any),
        where: args.where ?? {},
      });
    },
  })
);
