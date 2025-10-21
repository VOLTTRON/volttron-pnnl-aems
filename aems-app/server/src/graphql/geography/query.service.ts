import { Injectable, Logger } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { GeographyObject } from "./object.service";
import { PothosQuery } from "../pothos.decorator";
import { Geography } from "@prisma/client";
import { typeofNonNullable } from "@local/common";
import { pick } from "lodash";
import { PrismaService } from "@/prisma/prisma.service";
import { GraphQLScalarType } from "graphql";
import { Scalars } from "..";

@Injectable()
@PothosQuery()
export class GeographyQuery {
  private logger = new Logger(GeographyQuery.name);

  readonly GeographyAggregate;
  readonly GeographyWhereUnique;
  readonly GeographyWhere;
  readonly GeographyOrderBy;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, geographyObject: GeographyObject) {
    const { StringFilter, DateTimeFilter, PagingInput } = builder;
    const { GeographyFields } = geographyObject;

    this.GeographyAggregate = builder.inputType("GeographyAggregate", {
      fields: (t) => ({
        average: t.field({ type: [GeographyFields] }),
        count: t.field({ type: [GeographyFields] }),
        maximum: t.field({ type: [GeographyFields] }),
        minimum: t.field({ type: [GeographyFields] }),
        sum: t.field({ type: [GeographyFields] }),
      }),
    });

    this.GeographyWhereUnique = builder.prismaWhereUnique("Geography", {
      fields: {
        id: "String",
      },
    });

    this.GeographyWhere = builder.prismaWhere("Geography", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        name: StringFilter,
        group: StringFilter,
        type: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.GeographyOrderBy = builder.prismaOrderBy("Geography", {
      fields: {
        id: true,
        name: true,
        group: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    builder.addScalarType(
      "GeographyGroupBy",
      new GraphQLScalarType<Scalars["GeographyGroupBy"]["Input"], Scalars["GeographyGroupBy"]["Output"]>({
        name: "GeographyGroupBy",
      }),
    );

    const { GeographyWhere, GeographyWhereUnique, GeographyOrderBy, GeographyAggregate } = this;

    builder.queryField("areaGeographies", (t) =>
      t.prismaField({
        description: "Read a list of geographies at a specific location.",
        authScopes: { user: true },
        type: ["Geography"],
        args: {
          area: t.arg({ type: "GeographyGeoJson", required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _geography, _args, _context, _info) => {
          subscriptions.register(`Geography`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          const fields = query.select
            ? Object.entries(query.select)
                .map(([field, value]) => (value ? field : undefined))
                .filter(typeofNonNullable)
            : undefined;
          return prismaService.prisma.$queryRaw<Geography[]>`
              SELECT "id", "name", "group", "type", "geojson", "createdAt", "updatedAt" FROM public."Geography"
              WHERE ST_Intersects(
                ST_SetSRID(ST_GeomFromGeoJSON(${args.area}), 4326),
                "Geography"."geometry"
              )
              ORDER BY "Geography"."createdAt" DESC
              `.then(
            (records) => (fields ? (records?.map((record) => pick(record, fields)) as Geography[]) : records) ?? [],
          );
        },
      }),
    );

    builder.queryField("pageGeography", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple geographies.",
        authScopes: { user: true },
        type: "Geography",
        cursor: "id",
        args: {
          where: t.arg({ type: GeographyWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.geography.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readGeography", (t) =>
      t.prismaField({
        description: "Read a unique geography.",
        authScopes: { user: true },
        type: "Geography",
        args: {
          where: t.arg({ type: GeographyWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _geography, args, _context, _info) => {
          subscriptions.register(`Geography/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.geography.findUniqueOrThrow({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readGeographies", (t) =>
      t.prismaField({
        description: "Read a list of geographies.",
        authScopes: { user: true },
        type: ["Geography"],
        args: {
          where: t.arg({ type: GeographyWhere }),
          distinct: t.arg({ type: [GeographyFields] }),
          orderBy: t.arg({ type: [GeographyOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _geography, _args, _context, _info) => {
          subscriptions.register(`Geography`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.geography.findMany({
            ...query,
            where: args.where ?? {},
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countGeographies", (t) =>
      t.field({
        description: "Count the number of geographies.",
        authScopes: { user: true },
        type: "Int",
        args: {
          where: t.arg({ type: GeographyWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _geography, _args, _context, _info) => {
          subscriptions.register(`Geography`);
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.geography.count({
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("groupGeographies", (t) =>
      t.field({
        description: "Group a list of geographies.",
        authScopes: { user: true },
        type: ["GeographyGroupBy"],
        args: {
          by: t.arg({ type: [GeographyFields], required: true }),
          where: t.arg({ type: GeographyWhere }),
          aggregate: t.arg({ type: GeographyAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _geography, _args, _context, _info) => {
          subscriptions.register(`Geography`);
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.geography.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? {},
          });
        },
      }),
    );
  }
}
