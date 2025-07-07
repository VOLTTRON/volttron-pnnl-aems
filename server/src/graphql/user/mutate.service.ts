import { Injectable } from "@nestjs/common";
import { Mutation } from "@local/common";
import { SchemaBuilderService } from "../builder.service";
import { UserQuery } from "./query.service";
import { AccountQuery } from "../account/query.service";
import { AccountMutation } from "../account/mutate.service";
import { CommentQuery } from "../comment/query.service";
import { BannerQuery } from "../banner/query.service";
import { CommentMutation } from "../comment/mutate.service";
import { BannerMutation } from "../banner/mutate.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { UserObject } from "./object.service";

@Injectable()
@PothosMutation()
export class UserMutation {
  readonly UserCreate;
  readonly UserUpdate;
  readonly UserUpdateAccounts;
  readonly UserUpdateComments;
  readonly UserUpdateBanners;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    userObject: UserObject,
    userQuery: UserQuery,
    accountQuery: AccountQuery,
    commentQuery: CommentQuery,
    bannerQuery: BannerQuery,
    accountMutation: AccountMutation,
    commentMutation: CommentMutation,
    bannerMutation: BannerMutation,
  ) {
    const { UserPreferences } = userObject;
    const { UserWhereUnique } = userQuery;
    const { AccountWhereUnique } = accountQuery;
    const { CommentWhereUnique } = commentQuery;
    const { BannerWhereUnique } = bannerQuery;
    const { AccountCreate } = accountMutation;
    const { CommentCreate } = commentMutation;
    const { BannerCreate } = bannerMutation;

    this.UserCreate = builder.prismaCreate("User", {
      fields: {
        name: "String",
        email: "String",
        image: "String",
        role: "String",
        emailVerified: builder.DateTime,
        preferences: UserPreferences,
        password: "String",
      },
    });

    this.UserUpdate = builder.prismaUpdate("User", {
      fields: {
        name: "String",
        email: "String",
        image: "String",
        role: "String",
        emailVerified: builder.DateTime,
        preferences: UserPreferences,
        password: "String",
      },
    });

    const { UserCreate, UserUpdate } = this;

    this.UserUpdateAccounts = builder.prismaUpdateRelation("User", "accounts", {
      fields: {
        create: AccountCreate,
        connect: AccountWhereUnique,
        disconnect: AccountWhereUnique,
        delete: AccountWhereUnique,
      },
    });

    this.UserUpdateComments = builder.prismaUpdateRelation("User", "comments", {
      fields: {
        create: CommentCreate,
        connect: CommentWhereUnique,
        disconnect: CommentWhereUnique,
        delete: CommentWhereUnique,
      },
    });

    this.UserUpdateBanners = builder.prismaUpdateRelation("User", "banners", {
      fields: {
        create: BannerCreate,
        connect: BannerWhereUnique,
        disconnect: BannerWhereUnique,
        delete: BannerWhereUnique,
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
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.user
            .create({
              ...query,
              data: { ...args.create },
            })
            .then(async (user) => {
              await subscriptionService.publish("User", { topic: "User", id: user.id, mutation: Mutation.Created });
              return user;
            });
        },
      }),
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
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.user
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (user) => {
              await subscriptionService.publish("User", { topic: "User", id: user.id, mutation: Mutation.Updated });
              await subscriptionService.publish(`User/${user.id}`, {
                topic: "User",
                id: user.id,
                mutation: Mutation.Updated,
              });
              return user;
            });
        },
      }),
    );

    builder.mutationField("deleteUser", (t) =>
      t.prismaField({
        description: "Delete the specified user.",
        authScopes: { admin: true },
        type: "User",
        args: {
          where: t.arg({ type: UserWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.user
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (user) => {
              await subscriptionService.publish("User", { topic: "User", id: user.id, mutation: Mutation.Deleted });
              await subscriptionService.publish(`User/${user.id}`, {
                topic: "User",
                id: user.id,
                mutation: Mutation.Deleted,
              });
              return user;
            });
        },
      }),
    );
  }
}
