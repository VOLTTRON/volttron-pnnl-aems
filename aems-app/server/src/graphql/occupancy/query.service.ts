import { Injectable } from "@nestjs/common";
import { OccupancyObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
@PothosQuery()
export class OccupancyQuery {
  readonly OccupancyAggregate;
  readonly OccupancyWhereUnique;
  readonly OccupancyWhere;
  readonly OccupancyOrderBy;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, occupancyObject: OccupancyObject) {
    const { StringFilter, DateTimeFilter, PagingInput } = builder;
    const { OccupancyFields, ModelStage } = occupancyObject;

    this.OccupancyAggregate = builder.inputType("OccupancyAggregate", {
      fields: (t) => ({
        average: t.field({ type: [OccupancyFields] }),
        count: t.field({ type: [OccupancyFields] }),
        maximum: t.field({ type: [OccupancyFields] }),
        minimum: t.field({ type: [OccupancyFields] }),
        sum: t.field({ type: [OccupancyFields] }),
      }),
    });

    this.OccupancyWhereUnique = builder.prismaWhereUnique("Occupancy", {
      fields: {
        id: "String",
      },
    });

    this.OccupancyWhere = builder.prismaWhere("Occupancy", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        stage: ModelStage,
        message: StringFilter,
        correlation: StringFilter,
        label: StringFilter,
        date: DateTimeFilter,
        scheduleId: StringFilter,
        configurationId: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.OccupancyOrderBy = builder.prismaOrderBy("Occupancy", {
      fields: {
        id: true,
        stage: true,
        message: true,
        correlation: true,
        label: true,
        date: true,
        scheduleId: true,
        configurationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { OccupancyWhere, OccupancyWhereUnique, OccupancyOrderBy, OccupancyAggregate } = this;

    builder.queryField("pageOccupancy", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple occupancies.",
        authScopes: { admin: true },
        type: "Occupancy",
        cursor: "id",
        args: {
          where: t.arg({ type: OccupancyWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.occupancy.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readOccupancy", (t) =>
      t.prismaField({
        description: "Read a unique occupancy.",
        authScopes: { admin: true },
        type: "Occupancy",
        args: {
          where: t.arg({ type: OccupancyWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, args, _context, _info) => {
          subscriptions.register(`Occupancy/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.occupancy.findUniqueOrThrow({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    builder.queryField("readOccupancies", (t) =>
      t.prismaField({
        description: "Read a list of occupancies.",
        authScopes: { admin: true },
        type: ["Occupancy"],
        args: {
          where: t.arg({ type: OccupancyWhere }),
          distinct: t.arg({ type: [OccupancyFields] }),
          orderBy: t.arg({ type: [OccupancyOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Occupancy");
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.occupancy.findMany({
            ...query,
            where: args.where ?? {},
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countOccupancies", (t) =>
      t.field({
        description: "Count the number of occupancies.",
        authScopes: { admin: true },
        type: "Int",
        args: {
          where: t.arg({ type: OccupancyWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Occupancy");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.occupancy.count({
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("groupOccupancies", (t) =>
      t.field({
        description: "Group a list of occupancies.",
        authScopes: { admin: true },
        type: ["OccupancyGroupBy"],
        args: {
          by: t.arg({ type: [OccupancyFields], required: true }),
          where: t.arg({ type: OccupancyWhere }),
          aggregate: t.arg({ type: OccupancyAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Occupancy");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.occupancy.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? {},
          });
        },
      }),
    );
  }
}
