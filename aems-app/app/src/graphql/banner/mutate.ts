import { convertToJsonObject, prisma, recordChange } from "@/prisma";
import { builder } from "../builder";
import { BannerWhereUnique } from "./query";
import { Mutation } from "../types";
import { UserWhereUnique } from "../user/query";

export const BannerCreate = builder.prismaCreate("Banner", {
  fields: {
    message: "String",
    expiration: "DateTime",
  },
});

const BannerUpdateUsers = builder.prismaUpdateRelation("Banner", "users", {
  fields: {
    connect: UserWhereUnique,
    disconnect: UserWhereUnique,
  },
});

export const BannerUpdate = builder.prismaUpdate("Banner", {
  fields: {
    message: "String",
    expiration: "DateTime",
    users: BannerUpdateUsers,
  },
});

builder.mutationField("createBanner", (t) =>
  t.prismaField({
    description: "Create a new banner.",
    authScopes: { admin: true },
    type: "Banner",
    args: {
      create: t.arg({ type: BannerCreate, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.banner
        .create({
          ...query,
          data: args.create,
        })
        .then((banner) => {
          recordChange("Create", "Banner", banner.id, ctx.authUser, convertToJsonObject(banner));
          ctx.pubsub.publish("Banner", { topic: "Banner", id: banner.id, mutation: Mutation.Created });
          return banner;
        });
    },
  })
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
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.banner
        .update({
          ...query,
          where: args.where,
          data: args.update,
        })
        .then((banner) => {
          recordChange("Update", "Banner", banner.id, ctx.authUser, convertToJsonObject(banner));
          ctx.pubsub.publish("Banner", { topic: "Banner", id: banner.id, mutation: Mutation.Updated });
          ctx.pubsub.publish(`Banner/${banner.id}`, { topic: "Banner", id: banner.id, mutation: Mutation.Updated });
          return banner;
        });
    },
  })
);

builder.mutationField("deleteBanner", (t) =>
  t.prismaField({
    description: "Delete the specified banner.",
    authScopes: { admin: true },
    type: "Banner",
    args: {
      where: t.arg({ type: BannerWhereUnique, required: true }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      return prisma.banner
        .delete({
          ...query,
          where: args.where,
        })
        .then((banner) => {
          recordChange("Delete", "Banner", banner.id, ctx.authUser);
          ctx.pubsub.publish("Banner", { topic: "Banner", id: banner.id, mutation: Mutation.Deleted });
          ctx.pubsub.publish(`Banner/${banner.id}`, { topic: "Banner", id: banner.id, mutation: Mutation.Deleted });
          return banner;
        });
    },
  })
);
