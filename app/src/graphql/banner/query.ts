import { prisma } from "@/prisma";
import { builder, DateTimeFilter, PagingInput, StringFilter } from "../builder";
import { transformAggregate } from "../util";
import { BannerFields } from "./object";

export const BannerAggregate = builder.inputType("BannerAggregate", {
  fields: (t) => ({
    average: t.field({ type: [BannerFields] }),
    count: t.field({ type: [BannerFields] }),
    maximum: t.field({ type: [BannerFields] }),
    minimum: t.field({ type: [BannerFields] }),
    sum: t.field({ type: [BannerFields] }),
  }),
});

export const BannerWhereUnique = builder.prismaWhereUnique("Banner", {
  fields: {
    id: "String",
  },
});

export const BannerWhere = builder.prismaWhere("Banner", {
  fields: {
    OR: true,
    AND: true,
    NOT: true,
    id: StringFilter,
    message: StringFilter,
    expiration: DateTimeFilter,
    createdAt: DateTimeFilter,
    updatedAt: DateTimeFilter,
  },
});

export const BannerOrderBy = builder.prismaOrderBy("Banner", {
  fields: {
    id: true,
    message: true,
    expiration: true,
    createdAt: true,
    updatedAt: true,
  },
});

builder.queryField("pageBanner", (t) =>
  t.prismaConnection({
    description: "Paginate through multiple banners.",
    type: "Banner",
    cursor: "id",
    args: {
      where: t.arg({ type: BannerWhere }),
    },
    resolve: async (query, _parent, args, _ctx, _info) => {
      return prisma.banner.findMany({
        ...query,
        where: args.where ?? {},
      });
    },
  })
);

builder.queryField("readBanner", (t) =>
  t.prismaField({
    description: "Read a unique banner.",
    type: "Banner",
    args: {
      where: t.arg({ type: BannerWhereUnique, required: true }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _banner, args, _context, _info) => {
      subscriptions.register(`Banner/${args.where.id}`);
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.banner.findUniqueOrThrow({
        ...query,
        where: args.where,
      });
    },
  })
);

builder.queryField("readBanners", (t) =>
  t.prismaField({
    description: "Read a list of banners.",
    type: ["Banner"],
    args: {
      where: t.arg({ type: BannerWhere }),
      distinct: t.arg({ type: [BannerFields] }),
      orderBy: t.arg({ type: [BannerOrderBy] }),
      paging: t.arg({ type: PagingInput }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _banner, _args, _context, _info) => {
      subscriptions.register("Banner");
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      return prisma.banner.findMany({
        ...query,
        where: args.where ?? undefined,
        distinct: args.distinct ?? undefined,
        orderBy: args.orderBy ?? {},
        ...(args.paging ?? {}),
      });
    },
  })
);

builder.queryField("countBanners", (t) =>
  t.field({
    description: "Count the number of banners.",
    type: "Int",
    args: {
      where: t.arg({ type: BannerWhere }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _banner, _args, _context, _info) => {
      subscriptions.register("Banner");
    },
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.banner.count({
        where: args.where ?? undefined,
      });
    },
  })
);

builder.queryField("groupBanners", (t) =>
  t.field({
    description: "Group a list of banners.",
    type: ["JSON"],
    args: {
      by: t.arg({ type: [BannerFields], required: true }),
      where: t.arg({ type: BannerWhere }),
      aggregate: t.arg({ type: BannerAggregate }),
    },
    smartSubscription: true,
    subscribe: (subscriptions, _banner, _args, _context, _info) => {
      subscriptions.register("Banner");
    },
    resolve: async (_root, args, _ctx, _info) => {
      return prisma.banner.groupBy({
        by: args.by ?? [],
        ...(transformAggregate(args.aggregate) as any),
        where: args.where ?? {},
      });
    },
  })
);
