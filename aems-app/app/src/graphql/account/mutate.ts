import { convertToJsonObject, prisma, recordChange } from "@/prisma";
import { builder } from "../builder";
import { AccountWhereUnique } from "./query";
import { UserWhereUnique } from "../user/query";
import { Mutation } from "../types";

const AccountCreateUser = builder.prismaCreateRelation("Account", "user", {
  fields: {
    connect: UserWhereUnique,
  },
});

export const AccountCreate = builder.prismaCreate("Account", {
  fields: {
    type: "String",
    provider: "String",
    providerAccountId: "String",
    expiresAt: "Int",
    scope: "String",
    idToken: "String",
    user: AccountCreateUser,
  },
});

const AccountUpdateUser = builder.prismaUpdateRelation("Account", "user", {
  fields: {
    connect: UserWhereUnique,
    disconnect: "Boolean",
  },
});

export const AccountUpdate = builder.prismaUpdate("Account", {
  fields: {
    type: "String",
    provider: "String",
    providerAccountId: "String",
    expiresAt: "Int",
    scope: "String",
    idToken: "String",
    user: AccountUpdateUser,
  },
});

builder.mutationField("createAccount", (t) =>
  t.prismaField({
    description: "Create a new account.",
    authScopes: { admin: true },
    type: "Account",
    args: {
      create: t.arg({ type: AccountCreate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.account
        .create({
          ...query,
          data: args.create,
        })
        .then((account) => {
          recordChange("Create", "Account", account.id, ctx.authUser, convertToJsonObject(account));
          ctx.pubsub.publish("Account", {
            topic: "Account",
            id: account.id,
            mutation: Mutation.Created,
          });
          return account;
        });
    },
  })
);

builder.mutationField("updateAccount", (t) =>
  t.prismaField({
    description: "Update the specified account.",
    authScopes: { admin: true },
    type: "Account",
    args: {
      where: t.arg({ type: AccountWhereUnique, required: true }),
      update: t.arg({ type: AccountUpdate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.account
        .update({
          ...query,
          where: args.where,
          data: args.update,
        })
        .then((account) => {
          recordChange("Update", "Account", account.id, ctx.authUser, convertToJsonObject(account));
          ctx.pubsub.publish("Account", {
            topic: "Account",
            id: account.id,
            mutation: Mutation.Updated,
          });
          ctx.pubsub.publish(`Account/${account.id}`, {
            topic: "Account",
            id: account.id,
            mutation: Mutation.Updated,
          });
          return account;
        });
    },
  })
);

builder.mutationField("deleteAccount", (t) =>
  t.prismaField({
    description: "Delete the specified account.",
    authScopes: { admin: true },
    type: "Account",
    args: {
      where: t.arg({ type: AccountWhereUnique, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.account
        .delete({
          ...query,
          where: args.where,
        })
        .then((account) => {
          recordChange("Delete", "Account", account.id, ctx.authUser);
          ctx.pubsub.publish("Account", {
            topic: "Account",
            id: account.id,
            mutation: Mutation.Deleted,
          });
          ctx.pubsub.publish(`Account/${account.id}`, {
            topic: "Account",
            id: account.id,
            mutation: Mutation.Deleted,
          });
          return account;
        });
    },
  })
);
