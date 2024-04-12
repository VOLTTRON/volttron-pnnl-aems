import { pick } from "lodash";

import prisma from "@/prisma";
import { Prisma } from "@prisma/client";

import { builder } from "../builder";
import { AccountCreate, AccountUpdate } from "./input";

builder.mutationField("createAccount", (t) =>
  t.prismaField({
    description: "Create a new account.",
    authScopes: { admin: true },
    type: "Account",
    args: {
      create: t.arg({ type: AccountCreate }),
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      if (!args.create) {
        throw new Error("Create input required.");
      }
      const account: Prisma.AccountCreateInput = pick(args.create, [
        "type",
        "provider",
        "providerAccountId",
        "expiresAt",
        "scope",
        "idToken",
        "userId",
      ]) as Prisma.AccountCreateInput;
      return prisma.account.create({
        ...query,
        data: account,
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
      id: t.arg({ type: "String", required: true }),
      update: t.arg({ type: AccountUpdate }),
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      const account: Prisma.AccountUpdateInput =
        pick(args.update, ["type", "provider", "providerAccountId", "expiresAt", "scope", "idToken", "userId"]) ?? {};
      return prisma.account.update({
        ...query,
        where: { id: args.id },
        data: account,
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
      id: t.arg({ type: "String", required: true }),
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.account.delete({
        ...query,
        where: { id: args.id },
      });
    },
  })
);
