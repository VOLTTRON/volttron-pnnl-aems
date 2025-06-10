import { prisma } from "@/prisma";
import { builder } from "../builder";
import { UserWhereUnique } from "../user/query";
import { ChangeWhereUnique } from "./query";
import { Mutation } from "../types";

const ChangeCreateUser = builder.prismaCreateRelation("Change", "user", {
  fields: {
    connect: UserWhereUnique,
  },
});

export const ChangeCreate = builder.prismaCreate("Change", {
  fields: {
    table: "String",
    key: "String",
    mutation: "MutationType",
    data: "JSON",
    user: ChangeCreateUser,
  },
});

const ChangeUpdateUser = builder.prismaUpdateRelation("Change", "user", {
  fields: {
    connect: UserWhereUnique,
    disconnect: "Boolean",
  },
});

export const ChangeUpdate = builder.prismaUpdate("Change", {
  fields: {
    table: "String",
    key: "String",
    mutation: "MutationType",
    data: "JSON",
    user: ChangeUpdateUser,
  },
});

builder.mutationField("createChange", (t) =>
  t.prismaField({
    description: "Create a new change.",
    authScopes: { admin: true },
    type: "Change",
    args: {
      create: t.arg({ type: ChangeCreate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.change
        .create({
          ...query,
          data: args.create,
        })
        .then((change) => {
          ctx.pubsub.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Created,
          });
          return change;
        });
    },
  })
);

builder.mutationField("updateChange", (t) =>
  t.prismaField({
    description: "Update the specified change.",
    authScopes: { admin: true },
    type: "Change",
    args: {
      where: t.arg({ type: ChangeWhereUnique, required: true }),
      update: t.arg({ type: ChangeUpdate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.change
        .update({
          ...query,
          where: args.where,
          data: args.update,
        })
        .then((change) => {
          ctx.pubsub.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Updated,
          });
          ctx.pubsub.publish(`Change/${change.id}`, {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Updated,
          });
          return change;
        });
    },
  })
);

builder.mutationField("deleteChange", (t) =>
  t.prismaField({
    description: "Delete the specified change.",
    authScopes: { admin: true },
    type: "Change",
    args: {
      where: t.arg({ type: ChangeWhereUnique, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.change
        .delete({
          ...query,
          where: args.where,
        })
        .then((change) => {
          ctx.pubsub.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Deleted,
          });
          ctx.pubsub.publish(`Change/${change.id}`, {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Deleted,
          });
          return change;
        });
    },
  })
);
