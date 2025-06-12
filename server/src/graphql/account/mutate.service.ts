import { Mutation } from "@local/common";
import { Injectable } from "@nestjs/common";
import { AccountQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { UserQuery } from "../user/query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class AccountMutation {
  readonly AccountCreateUser;
  readonly AccountCreate;
  readonly AccountUpdateUser;
  readonly AccountUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    accountQuery: AccountQuery,
    userQuery: UserQuery,
  ) {
    const { AccountWhereUnique } = accountQuery;
    const { UserWhereUnique } = userQuery;

    this.AccountCreateUser = builder.prismaCreateRelation("Account", "user", {
      fields: {
        connect: UserWhereUnique,
      },
    });

    this.AccountCreate = builder.prismaCreate("Account", {
      fields: {
        type: "String",
        provider: "String",
        providerAccountId: "String",
        expiresAt: "Int",
        scope: "String",
        idToken: "String",
        user: this.AccountCreateUser,
      },
    });

    this.AccountUpdateUser = builder.prismaUpdateRelation("Account", "user", {
      fields: {
        connect: UserWhereUnique,
        disconnect: "Boolean",
      },
    });

    this.AccountUpdate = builder.prismaUpdate("Account", {
      fields: {
        type: "String",
        provider: "String",
        providerAccountId: "String",
        expiresAt: "Int",
        scope: "String",
        idToken: "String",
        user: this.AccountUpdateUser,
      },
    });

    const { AccountCreate, AccountUpdate } = this;

    builder.mutationField("createAccount", (t) =>
      t.prismaField({
        description: "Create a new account.",
        authScopes: { admin: true },
        type: "Account",
        args: {
          create: t.arg({ type: AccountCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.account
            .create({
              ...query,
              data: args.create,
            })
            .then(async (account) => {
              await subscriptionService.publish("Account", {
                topic: "Account",
                id: account.id,
                mutation: Mutation.Created,
              });
              return account;
            });
        },
      }),
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
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.account
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (account) => {
              await subscriptionService.publish("Account", {
                topic: "Account",
                id: account.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Account/${account.id}`, {
                topic: "Account",
                id: account.id,
                mutation: Mutation.Updated,
              });
              return account;
            });
        },
      }),
    );

    builder.mutationField("deleteAccount", (t) =>
      t.prismaField({
        description: "Delete the specified account.",
        authScopes: { admin: true },
        type: "Account",
        args: {
          where: t.arg({ type: AccountWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.account
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (account) => {
              await subscriptionService.publish("Account", {
                topic: "Account",
                id: account.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Account/${account.id}`, {
                topic: "Account",
                id: account.id,
                mutation: Mutation.Deleted,
              });
              return account;
            });
        },
      }),
    );
  }
}
