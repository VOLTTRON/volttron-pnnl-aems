import { Injectable } from "@nestjs/common";
import { UnitObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { GraphQLScalarType } from "graphql";
import { Scalars } from "..";

@Injectable()
@PothosQuery()
export class UnitQuery {
  readonly UnitAggregate;
  readonly UnitWhereUnique;
  readonly UnitWhere;
  readonly UnitOrderBy;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, unitObject: UnitObject) {
    const { StringFilter, IntFilter, FloatFilter, BooleanFilter, DateTimeFilter, PagingInput } = builder;
    const { UnitFields } = unitObject;

    this.UnitAggregate = builder.inputType("UnitAggregate", {
      fields: (t) => ({
        average: t.field({ type: [UnitFields] }),
        count: t.field({ type: [UnitFields] }),
        maximum: t.field({ type: [UnitFields] }),
        minimum: t.field({ type: [UnitFields] }),
        sum: t.field({ type: [UnitFields] }),
      }),
    });

    this.UnitWhereUnique = builder.prismaWhereUnique("Unit", {
      fields: {
        id: "String",
      },
    });

    this.UnitWhere = builder.prismaWhere("Unit", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        stage: builder.ModelStage,
        message: StringFilter,
        correlation: StringFilter,
        name: StringFilter,
        campus: StringFilter,
        building: StringFilter,
        system: StringFilter,
        timezone: StringFilter,
        label: StringFilter,
        coolingCapacity: FloatFilter,
        compressors: IntFilter,
        coolingLockout: FloatFilter,
        optimalStartLockout: FloatFilter,
        optimalStartDeviation: FloatFilter,
        earliestStart: IntFilter,
        latestStart: IntFilter,
        zoneLocation: StringFilter,
        zoneMass: StringFilter,
        zoneOrientation: StringFilter,
        zoneBuilding: StringFilter,
        heatPump: BooleanFilter,
        heatPumpBackup: FloatFilter,
        economizer: BooleanFilter,
        heatPumpLockout: FloatFilter,
        coolingPeakOffset: FloatFilter,
        heatingPeakOffset: FloatFilter,
        peakLoadExclude: BooleanFilter,
        economizerSetpoint: FloatFilter,
        configurationId: StringFilter,
        controlId: StringFilter,
        locationId: StringFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.UnitOrderBy = builder.prismaOrderBy("Unit", {
      fields: {
        id: true,
        stage: true,
        message: true,
        correlation: true,
        name: true,
        campus: true,
        building: true,
        system: true,
        timezone: true,
        label: true,
        coolingCapacity: true,
        compressors: true,
        coolingLockout: true,
        optimalStartLockout: true,
        optimalStartDeviation: true,
        earliestStart: true,
        latestStart: true,
        zoneLocation: true,
        zoneMass: true,
        zoneOrientation: true,
        zoneBuilding: true,
        heatPump: true,
        heatPumpBackup: true,
        economizer: true,
        heatPumpLockout: true,
        coolingPeakOffset: true,
        heatingPeakOffset: true,
        peakLoadExclude: true,
        economizerSetpoint: true,
        configurationId: true,
        controlId: true,
        locationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    builder.addScalarType(
      "UnitGroupBy",
      new GraphQLScalarType<Scalars["UnitGroupBy"]["Input"], Scalars["UnitGroupBy"]["Output"]>({
        name: "UnitGroupBy",
      }),
    );

    const { UnitWhere, UnitWhereUnique, UnitOrderBy, UnitAggregate } = this;

    builder.queryField("pageUnit", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple units.",
        authScopes: { user: true },
        type: "Unit",
        cursor: "id",
        args: {
          where: t.arg({ type: UnitWhere }),
        },
        resolve: async (query, _parent, args, ctx, _info) => {
          const filtered = { ...(args.where ?? {}), users: { some: { id: ctx.user?.id } } };
          return prismaService.prisma.unit.findMany({
            ...query,
            where: !ctx.user?.authRoles.admin ? filtered : (args.where ?? {}),
          });
        },
      }),
    );

    builder.queryField("readUnit", (t) =>
      t.prismaField({
        description: "Read a unique unit.",
        authScopes: { user: true },
        type: "Unit",
        args: {
          where: t.arg({ type: UnitWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, args, _context, _info) => {
          subscriptions.register(`Unit/${args.where.id}`);
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const filtered = { ...(args.where ?? {}), users: { some: { id: ctx.user?.id } } };
          return prismaService.prisma.unit.findUniqueOrThrow({
            ...query,
            where: !ctx.user?.authRoles.admin ? filtered : (args.where ?? {}),
          });
        },
      }),
    );

    builder.queryField("readUnits", (t) =>
      t.prismaField({
        description: "Read a list of units.",
        authScopes: { user: true },
        type: ["Unit"],
        args: {
          where: t.arg({ type: UnitWhere }),
          distinct: t.arg({ type: [UnitFields] }),
          orderBy: t.arg({ type: [UnitOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Unit");
        },
        resolve: async (query, _root, args, ctx, _info) => {
          const filtered = { ...(args.where ?? {}), users: { some: { id: ctx.user?.id } } };
          return prismaService.prisma.unit.findMany({
            ...query,
            where: !ctx.user?.authRoles.admin ? filtered : (args.where ?? {}),
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countUnits", (t) =>
      t.field({
        description: "Count the number of units.",
        authScopes: { user: true },
        type: "Int",
        args: {
          where: t.arg({ type: UnitWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Unit");
        },
        resolve: async (_root, args, ctx, _info) => {
          const filtered = { ...(args.where ?? {}), users: { some: { id: ctx.user?.id } } };
          return prismaService.prisma.unit.count({
            where: !ctx.user?.authRoles.admin ? filtered : (args.where ?? {}),
          });
        },
      }),
    );

    builder.queryField("groupUnits", (t) =>
      t.field({
        description: "Group a list of units.",
        authScopes: { user: true },
        type: ["UnitGroupBy"],
        args: {
          by: t.arg({ type: [UnitFields], required: true }),
          where: t.arg({ type: UnitWhere }),
          aggregate: t.arg({ type: UnitAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Unit");
        },
        resolve: async (_root, args, ctx, _info) => {
          const filtered = { ...(args.where ?? {}), users: { some: { id: ctx.user?.id } } };
          return prismaService.prisma.unit.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: !ctx.user?.authRoles.admin ? filtered : (args.where ?? {}),
          });
        },
      }),
    );
  }
}
