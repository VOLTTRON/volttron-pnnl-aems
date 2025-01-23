import { prisma } from "@/prisma";
import { builder } from "../builder";

builder.queryField("readCurrent", (t) =>
  t.prismaField({
    description: "Read the currently logged in user.",
    type: "User",
    nullable: true,
    smartSubscription: true,
    subscribe: (subscriptions, _parent, _args, context, _info) => {
      const auth = context.authUser;
      if (auth.id) {
        subscriptions.register(`User/${auth.id}`);
      }
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      if (!auth.id) {
        return Promise.resolve(null);
      }
      return prisma.user.findUniqueOrThrow({
        ...query,
        ...args,
        where: { id: auth.id },
      });
    },
  })
);
