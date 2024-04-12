import prisma from "@/prisma";

import { builder } from "../builder";

builder.queryField("readCurrent", (t) =>
  t.prismaField({
    description: "Read the currently logged in user.",
    authScopes: { user: true },
    type: "User",
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      if (!auth.id) {
        throw new Error("User must be logged in.");
      }
      return prisma.user.findUniqueOrThrow({
        ...query,
        ...args,
        where: { id: auth.id },
      });
    },
  })
);
