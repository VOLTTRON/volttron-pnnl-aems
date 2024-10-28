import { prisma } from "@/prisma";
import { builder } from "../builder";
import { AccountCreate } from "../account/mutate";
import { CommentCreate } from "../comment/mutate";
import { AccountWhereUnique } from "../account/query";
import { CommentWhereUnique } from "../comment/query";
import { UserWhereUnique } from "./query";
import { Mutation } from "../types";
import { BannerCreate } from "../banner/mutate";
import { BannerWhereUnique } from "../banner/query";

export const UserCreate = builder.prismaCreate("User", {
  fields: {
    name: "String",
    email: "String",
    image: "String",
    role: "String",
    emailVerified: "DateTime",
    preferences: "Preferences",
    password: "String",
  },
});

const UserUpdateAccounts = builder.prismaUpdateRelation("User", "accounts", {
  fields: {
    create: AccountCreate,
    connect: AccountWhereUnique,
    disconnect: AccountWhereUnique,
    delete: AccountWhereUnique,
  },
});

const UserUpdateComments = builder.prismaUpdateRelation("User", "comments", {
  fields: {
    create: CommentCreate,
    connect: CommentWhereUnique,
    disconnect: CommentWhereUnique,
    delete: CommentWhereUnique,
  },
});

const UserUpdateBanners = builder.prismaUpdateRelation("User", "banners", {
  fields: {
    create: BannerCreate,
    connect: BannerWhereUnique,
    disconnect: BannerWhereUnique,
    delete: BannerWhereUnique,
  },
});

export const UserUpdate = builder.prismaUpdate("User", {
  fields: {
    name: "String",
    email: "String",
    image: "String",
    role: "String",
    emailVerified: "DateTime",
    preferences: "Preferences",
    password: "String",
    accounts: UserUpdateAccounts,
    comments: UserUpdateComments,
    banners: UserUpdateBanners,
  },
});

builder.mutationField("createUser", (t) =>
  t.prismaField({
    description: "Create a new user.",
    authScopes: { admin: true },
    type: "User",
    args: {
      create: t.arg({ type: UserCreate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.user
        .create({
          ...query,
          data: args.create,
        })
        .then((user) => {
          ctx.pubsub.publish("User", { topic: "User", id: user.id, mutation: Mutation.Created });
          return user;
        });
    },
  })
);

builder.mutationField("updateUser", (t) =>
  t.prismaField({
    description: "Update the specified user.",
    authScopes: { admin: true },
    type: "User",
    args: {
      where: t.arg({ type: UserWhereUnique, required: true }),
      update: t.arg({ type: UserUpdate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.user
        .update({
          ...query,
          where: args.where,
          data: args.update,
        })
        .then((user) => {
          ctx.pubsub.publish("User", { topic: "User", id: user.id, mutation: Mutation.Updated });
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

builder.mutationField("deleteUser", (t) =>
  t.prismaField({
    description: "Delete the specified user.",
    authScopes: { admin: true },
    type: "User",
    args: {
      where: t.arg({ type: UserWhereUnique, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.user
        .delete({
          ...query,
          where: args.where,
        })
        .then((user) => {
          ctx.pubsub.publish("User", { topic: "User", id: user.id, mutation: Mutation.Deleted });
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
