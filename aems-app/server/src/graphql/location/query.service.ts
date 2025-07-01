import { Injectable } from "@nestjs/common";
import { LocationObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
@PothosQuery()
export class LocationQuery {
  readonly LocationAggregate;
  readonly LocationWhereUnique;
  readonly LocationWhere;
  readonly LocationOrderBy;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, locationObject: LocationObject) {
    const { StringFilter, FloatFilter, DateTimeFilter, PagingInput } = builder;
    const { LocationFields } = locationObject;

    this.LocationAggregate = builder.inputType("LocationAggregate", {
      fields: (t) => ({
        average: t.field({ type: [LocationFields] }),
        count: t.field({ type: [LocationFields] }),
        maximum: t.field({ type: [LocationFields] }),
        minimum: t.field({ type: [LocationFields] }),
        sum: t.field({ type: [LocationFields] }),
      }),
    });

    this.LocationWhereUnique = builder.prismaWhereUnique("Location", {
      fields: {
        id: "String",
      },
    });

    this.LocationWhere = builder.prismaWhere("Location", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        name: StringFilter,
        latitude: FloatFilter,
        longitude: FloatFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.LocationOrderBy = builder.prismaOrderBy("Location", {
      fields: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { LocationWhere, LocationWhereUnique, LocationOrderBy, LocationAggregate } = this;

    builder.queryField("pageLocation", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple locations.",
        authScopes: { admin: true },
        type: "Location",
        cursor: "id",
        args: {
          where: t.arg({ type: LocationWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.location.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readLocation", (t) =>
      t.prismaField({
        description: "Read a unique location.",
        authScopes: { admin: true },
        type: "Location",
        args: {
          where: t.arg({ type: LocationWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, args, _context, _info) => {
          subscriptions.register(`Location/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.location.findUniqueOrThrow({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    builder.queryField("readLocations", (t) =>
      t.prismaField({
        description: "Read a list of locations.",
        authScopes: { admin: true },
        type: ["Location"],
        args: {
          where: t.arg({ type: LocationWhere }),
          distinct: t.arg({ type: [LocationFields] }),
          orderBy: t.arg({ type: [LocationOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Location");
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.location.findMany({
            ...query,
            where: args.where ?? {},
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countLocations", (t) =>
      t.field({
        description: "Count the number of locations.",
        authScopes: { admin: true },
        type: "Int",
        args: {
          where: t.arg({ type: LocationWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Location");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.location.count({
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("groupLocations", (t) =>
      t.field({
        description: "Group a list of locations.",
        authScopes: { admin: true },
        type: ["LocationGroupBy"],
        args: {
          by: t.arg({ type: [LocationFields], required: true }),
          where: t.arg({ type: LocationWhere }),
          aggregate: t.arg({ type: LocationAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Location");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.location.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? {},
          });
        },
      }),
    );
  }
}
