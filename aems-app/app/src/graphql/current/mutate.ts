import { prisma } from "@/prisma";
import { builder } from "../builder";
import { Mutation } from "../types";

export const CurrentCreate = builder.prismaCreate("User", {
  name: "CurrentCreateInput",
  fields: {
    name: "String",
    email: "String",
    image: "String",
    preferences: "Preferences",
    password: "String",
  },
});

export const CurrentUpdate = builder.prismaUpdate("User", {
  name: "CurrentUpdateInput",
  fields: {
    name: "String",
    email: "String",
    image: "String",
    preferences: "Preferences",
    password: "String",
  },
});

builder.mutationField("createCurrent", (t) =>
  t.prismaField({
    description: "Create a new user.",
    authScopes: {},
    type: "User",
    args: {
      create: t.arg({ type: CurrentCreate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      if (auth.id) {
        throw new Error("User is currently logged in.");
      }
      return prisma.user
        .create({
          ...query,
          data: args.create,
        })
        .then((user) => {
          ctx.pubsub.publish("User", {
            topic: "User",
            id: user.id,
            mutation: Mutation.Created,
          });
          return user;
        });
    },
  })
);

builder.mutationField("updateCurrent", (t) =>
  t.prismaField({
    description: "Update the currently logged in user.",
    authScopes: { user: true },
    type: "User",
    args: {
      update: t.arg({ type: CurrentUpdate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const auth = ctx.authUser;
      if (!auth.id) {
        throw new Error("User must be logged in.");
      }
      return prisma.user
        .update({
          ...query,
          where: { id: auth.id },
          data: args.update,
        })
        .then((user) => {
          ctx.pubsub.publish("User", {
            topic: "User",
            id: user.id,
            mutation: Mutation.Updated,
          });
          ctx.pubsub.publish(`User/${user.id}`, {
            topic: "User",
            id: user.id,
            mutation: Mutation.Updated,
          });
          return user;
        });
    },
  })
);

builder.mutationField("deleteCurrent", (t) =>
  t.prismaField({
    description: "Delete the currently logged in user.",
    authScopes: { user: true },
    type: "User",
    resolve: async (query, _root, _args, ctx, _info) => {
      const auth = ctx.authUser;
      if (!auth.id) {
        throw new Error("User must be logged in.");
      }
      return prisma.user
        .delete({
          ...query,
          where: { id: auth.id },
        })
        .then((user) => {
          ctx.pubsub.publish("User", {
            topic: "User",
            id: user.id,
            mutation: Mutation.Deleted,
          });
          ctx.pubsub.publish(`User/${user.id}`, {
            topic: "User",
            id: user.id,
            mutation: Mutation.Deleted,
          });
          return user;
        });
    },
  })
);
