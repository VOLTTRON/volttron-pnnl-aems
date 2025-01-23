import { prisma } from "@/prisma";

import { DateTimeFilter, PagingInput, StringFilter, builder } from "../builder";
import { FeedbackFields } from "./object";
import { UserWhereUnique } from "../user/query";

export const FeedbackWhere = builder.prismaWhere("Feedback", {
  fields: {
    id: StringFilter,
    message: StringFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
    userId: StringFilter,
    user: UserWhereUnique
  },
});

export const FeedbackOrderBy = builder.prismaOrderBy("Feedback", {
  fields: {
    id: true,
    status: true,
    message: true,
    createdAt: true,
    updatedAt: true,
  },
});

export const FeedbackWhereUnique = builder.prismaWhereUnique("Feedback", {
  fields: {
    id: "String",
  },
});

builder.queryField("readFeedback", (t) =>
  t.prismaField({
    description: "read a unique feedback",
    authScopes: { user: true },
    type: "Feedback",
    args: {
      where: t.arg({ type: FeedbackWhereUnique, required: true })
    },
    resolve: async (_query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      const where = args.where ?? {};
      if (!auth.roles.admin) {
        delete where.user;
        where.userId = auth.id;
      }
      return prisma.feedback.findUniqueOrThrow({
        where: args.where,
      });
    },
  })
);


builder.queryField("readAllFeedback", (t) =>
  t.prismaField({
    description: "Read a list of feedback.",
    authScopes: { user: true },
    type: ["Feedback"],
    args: {
      where: t.arg({ type: FeedbackWhere }),
      distinct: t.arg({ type: [FeedbackFields] }),
      orderBy: t.arg({ type: [FeedbackOrderBy] }),
      paging: t.arg({ type: PagingInput }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      const where = args.where ?? {};
      if (!auth.roles.admin) {
        delete where.user;
        where.userId = auth.id;
      }
      return prisma.feedback.findMany({
        ...query,
        where: args.where ?? undefined,
        distinct: args.distinct ?? undefined,
        orderBy: args.orderBy ?? {},
        ...(args.paging ?? {})
      });
    },
  })
);