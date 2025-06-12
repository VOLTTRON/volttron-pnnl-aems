import { prisma } from "@/prisma";

import { builder, StringFilter } from "../builder";
import { UserWhereUnique } from "../user/query";

export const FileWhere = builder.prismaWhere("File", {
  fields: {
    id: StringFilter,
    feedbackId: StringFilter,
    userId: StringFilter,
    user: UserWhereUnique,
  },
});

export const FileWhereUnique = builder.prismaWhereUnique("File", {
  fields: {
    id: "String",
  },
});

builder.queryField("readFile", (t) =>
  t.prismaField({
    description: "Read a specific file by its ID",
    authScopes: { user: true },
    type: "File",
    args: {
      where: t.arg({ type: FileWhereUnique, required: true }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _parent, args, _context, _info) => {
      subscriptions.register(`File/${args.where.id}`);
    },
    resolve: async (_query, _root, args, ctx, _info) => {
      // If not admin, limit to their own files
      const auth = ctx.authUser;
      const where = args.where ?? {};

      if (!auth.roles.admin) {
        delete where.user;
        where.userId = auth.id;
      }

      return prisma.file.findUniqueOrThrow({
        where: { id: args.where?.id },
      });
    },
  })
);

builder.queryField("readFeedbackFiles", (t) =>
  t.prismaField({
    description: "Read attached files to specific feedback.",
    authScopes: { user: true },
    type: ["File"],
    args: {
      where: t.arg({ type: FileWhere }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _parent, args, _context, _info) => {
      subscriptions.register(`File`);
    },
    resolve: async (query, _root, args, ctx, _info) => {
      // If not admin, limit to their own files
      const auth = ctx.authUser;
      const where = args.where ?? {};

      if (!auth.roles.admin) {
        delete where.user;
        where.userId = auth.id;
      }

      return prisma.file.findMany({
        ...query,
        where: {
          feedbackId: args.where?.feedbackId, // Filtering by feedbackId
        },
      });
    },
  })
);
