import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { BannerObject } from "./object.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { GraphQLScalarType } from "graphql";
import { Scalars } from "..";

// Non-admin reads see only unexpired banners (expiration IS NULL OR expiration > now).
// Composed with the caller's where via AND so the caller's filter only narrows it.
export function narrowToUnexpired<W>(where: W | null | undefined, isAdmin: boolean, now: Date = new Date()): W | undefined {
  if (isAdmin) return (where ?? undefined) as W | undefined;
  const unexpired = { OR: [{ expiration: null }, { expiration: { gt: now } }] } as unknown as W;
  if (where === null || where === undefined) return unexpired;
  return { AND: [where, unexpired] } as unknown as W;
}

@Injectable()
@PothosQuery()
export class BannerQuery {
  readonly BannerWhereUnique;
  readonly BannerWhere;
  readonly BannerOrderBy;
  readonly BannerAggregate;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, bannerObject: BannerObject) {
    const { StringFilter, DateTimeFilter, PagingInput } = builder;
    const { BannerFields } = bannerObject;

    this.BannerWhereUnique = builder.prismaWhereUnique("Banner", {
      fields: {
        id: "String",
      },
    });

    this.BannerWhere = builder.prismaWhere("Banner", {
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

    this.BannerOrderBy = builder.prismaOrderBy("Banner", {
      fields: {
        id: true,
        message: true,
        expiration: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.BannerAggregate = builder.inputType("BannerAggregate", {
      fields: (t) => ({
        average: t.field({ type: [BannerFields] }),
        count: t.field({ type: [BannerFields] }),
        maximum: t.field({ type: [BannerFields] }),
        minimum: t.field({ type: [BannerFields] }),
        sum: t.field({ type: [BannerFields] }),
      }),
    });

    builder.addScalarType(
      "BannerGroupBy",
      new GraphQLScalarType<Scalars["BannerGroupBy"]["Input"], Scalars["BannerGroupBy"]["Output"]>({
        name: "BannerGroupBy",
      }),
    );

    const { BannerWhere, BannerWhereUnique, BannerOrderBy, BannerAggregate } = this;

    builder.queryField("pageBanner", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple banners.",
        authScopes: { user: true },
        type: "Banner",
        cursor: "id",
        args: {
          where: t.arg({ type: BannerWhere }),
        },
        resolve: async (query, _parent, args, ctx, _info) => {
          return prismaService.prisma.banner.findMany({
            ...query,
            where: narrowToUnexpired(args.where, Boolean(ctx.user?.authRoles.admin)) ?? {},
          });
        },
      }),
    );

    builder.queryField("readBanner", (t) =>
      t.prismaField({
        description: "Read a unique banner.",
        authScopes: { user: true },
        type: "Banner",
        args: {
          where: t.arg({ type: BannerWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _banner, args, _context, _info) => {
          subscriptions.register(`Banner/${args.where.id}`);
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const isAdmin = Boolean(ctx.user?.authRoles.admin);
          if (isAdmin) {
            return prismaService.prisma.banner.findUniqueOrThrow({
              ...query,
              where: args.where,
            });
          }
          return prismaService.prisma.banner.findFirstOrThrow({
            ...query,
            where: narrowToUnexpired(args.where, false),
          });
        },
      }),
    );

    builder.queryField("readBanners", (t) =>
      t.prismaField({
        description: "Read a list of banners.",
        authScopes: { user: true },
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
        resolve: async (query, _root, args, ctx, _info) => {
          return prismaService.prisma.banner.findMany({
            ...query,
            where: narrowToUnexpired(args.where, Boolean(ctx.user?.authRoles.admin)),
            distinct: args.distinct ?? undefined,
            orderBy: SchemaBuilderService.withOrderBy(args.orderBy, { createdAt: "desc" }),
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countBanners", (t) =>
      t.field({
        description: "Count the number of banners.",
        authScopes: { user: true },
        type: "Int",
        args: {
          where: t.arg({ type: BannerWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _banner, _args, _context, _info) => {
          subscriptions.register("Banner");
        },
        resolve: async (_root, args, ctx, _info) => {
          return prismaService.prisma.banner.count({
            where: narrowToUnexpired(args.where, Boolean(ctx.user?.authRoles.admin)),
          });
        },
      }),
    );

    builder.queryField("groupBanners", (t) =>
      t.field({
        description: "Group a list of banners.",
        authScopes: { user: true },
        type: ["BannerGroupBy"],
        args: {
          by: t.arg({ type: [BannerFields], required: true }),
          where: t.arg({ type: BannerWhere }),
          aggregate: t.arg({ type: BannerAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _banner, _args, _context, _info) => {
          subscriptions.register("Banner");
        },
        resolve: async (_root, args, ctx, _info) => {
          return prismaService.prisma.banner
            .groupBy({
              by: args.by ?? [],
              ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
              where: narrowToUnexpired(args.where, Boolean(ctx.user?.authRoles.admin)) ?? {},
            })
            .then((result) => result as PrismaJson.BannerGroupBy[]);
        },
      }),
    );
  }
}
