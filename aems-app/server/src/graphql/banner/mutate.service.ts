import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { UserQuery } from "../user/query.service";
import { Mutation } from "@local/common";
import { BannerQuery } from "./query.service";
import { PothosMutation } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
@PothosMutation()
export class BannerMutation {
  readonly BannerCreate;
  readonly BannerUpdateUsers;
  readonly BannerUpdate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    subscriptionService: SubscriptionService,
    bannerQuery: BannerQuery,
    userQuery: UserQuery,
  ) {
    const { BannerWhereUnique } = bannerQuery;
    const { UserWhereUnique } = userQuery;

    this.BannerCreate = builder.prismaCreate("Banner", {
      fields: {
        message: "String",
        expiration: "DateTime",
      },
    });

    this.BannerUpdateUsers = builder.prismaUpdateRelation("Banner", "users", {
      fields: {
        connect: UserWhereUnique,
        disconnect: UserWhereUnique,
      },
    });

    this.BannerUpdate = builder.prismaUpdate("Banner", {
      fields: {
        message: "String",
        expiration: "DateTime",
        users: this.BannerUpdateUsers,
      },
    });

    const { BannerCreate, BannerUpdate } = this;

    builder.mutationField("createBanner", (t) =>
      t.prismaField({
        description: "Create a new banner.",
        authScopes: { admin: true },
        type: "Banner",
        args: {
          create: t.arg({ type: BannerCreate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.banner
            .create({
              ...query,
              data: args.create,
            })
            .then(async (banner) => {
              await subscriptionService.publish("Banner", {
                topic: "Banner",
                id: banner.id,
                mutation: Mutation.Created,
              });
              return banner;
            });
        },
      }),
    );

    builder.mutationField("updateBanner", (t) =>
      t.prismaField({
        description: "Update the specified banner.",
        authScopes: { admin: true },
        type: "Banner",
        args: {
          where: t.arg({ type: BannerWhereUnique, required: true }),
          update: t.arg({ type: BannerUpdate, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.banner
            .update({
              ...query,
              where: args.where,
              data: args.update,
            })
            .then(async (banner) => {
              await subscriptionService.publish("Banner", {
                topic: "Banner",
                id: banner.id,
                mutation: Mutation.Updated,
              });
              await subscriptionService.publish(`Banner/${banner.id}`, {
                topic: "Banner",
                id: banner.id,
                mutation: Mutation.Updated,
              });
              return banner;
            });
        },
      }),
    );

    builder.mutationField("deleteBanner", (t) =>
      t.prismaField({
        description: "Delete the specified banner.",
        authScopes: { admin: true },
        type: "Banner",
        args: {
          where: t.arg({ type: BannerWhereUnique, required: true }),
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.banner
            .delete({
              ...query,
              where: args.where,
            })
            .then(async (banner) => {
              await subscriptionService.publish("Banner", {
                topic: "Banner",
                id: banner.id,
                mutation: Mutation.Deleted,
              });
              await subscriptionService.publish(`Banner/${banner.id}`, {
                topic: "Banner",
                id: banner.id,
                mutation: Mutation.Deleted,
              });
              return banner;
            });
        },
      }),
    );
  }
}
