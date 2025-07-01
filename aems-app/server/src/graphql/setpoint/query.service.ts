import { Injectable } from "@nestjs/common";
import { SetpointObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
@PothosQuery()
export class SetpointQuery {
  readonly SetpointAggregate;
  readonly SetpointWhereUnique;
  readonly SetpointWhere;
  readonly SetpointOrderBy;

  constructor(builder: SchemaBuilderService, prismaService: PrismaService, setpointObject: SetpointObject) {
    const { StringFilter, FloatFilter, DateTimeFilter, PagingInput } = builder;
    const { SetpointFields, ModelStage } = setpointObject;

    this.SetpointAggregate = builder.inputType("SetpointAggregate", {
      fields: (t) => ({
        average: t.field({ type: [SetpointFields] }),
        count: t.field({ type: [SetpointFields] }),
        maximum: t.field({ type: [SetpointFields] }),
        minimum: t.field({ type: [SetpointFields] }),
        sum: t.field({ type: [SetpointFields] }),
      }),
    });

    this.SetpointWhereUnique = builder.prismaWhereUnique("Setpoint", {
      fields: {
        id: "String",
      },
    });

    this.SetpointWhere = builder.prismaWhere("Setpoint", {
      fields: {
        OR: true,
        AND: true,
        NOT: true,
        id: StringFilter,
        stage: ModelStage,
        message: StringFilter,
        correlation: StringFilter,
        label: StringFilter,
        setpoint: FloatFilter,
        deadband: FloatFilter,
        heating: FloatFilter,
        cooling: FloatFilter,
        createdAt: DateTimeFilter,
        updatedAt: DateTimeFilter,
      },
    });

    this.SetpointOrderBy = builder.prismaOrderBy("Setpoint", {
      fields: {
        id: true,
        stage: true,
        message: true,
        correlation: true,
        label: true,
        setpoint: true,
        deadband: true,
        heating: true,
        cooling: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { SetpointWhere, SetpointWhereUnique, SetpointOrderBy, SetpointAggregate } = this;

    builder.queryField("pageSetpoint", (t) =>
      t.prismaConnection({
        description: "Paginate through multiple setpoints.",
        authScopes: { admin: true },
        type: "Setpoint",
        cursor: "id",
        args: {
          where: t.arg({ type: SetpointWhere }),
        },
        resolve: async (query, _parent, args, _ctx, _info) => {
          return prismaService.prisma.setpoint.findMany({
            ...query,
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("readSetpoint", (t) =>
      t.prismaField({
        description: "Read a unique setpoint.",
        authScopes: { admin: true },
        type: "Setpoint",
        args: {
          where: t.arg({ type: SetpointWhereUnique, required: true }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, args, _context, _info) => {
          subscriptions.register(`Setpoint/${args.where.id}`);
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.setpoint.findUniqueOrThrow({
            ...query,
            where: args.where,
          });
        },
      }),
    );

    builder.queryField("readSetpoints", (t) =>
      t.prismaField({
        description: "Read a list of setpoints.",
        authScopes: { admin: true },
        type: ["Setpoint"],
        args: {
          where: t.arg({ type: SetpointWhere }),
          distinct: t.arg({ type: [SetpointFields] }),
          orderBy: t.arg({ type: [SetpointOrderBy] }),
          paging: t.arg({ type: PagingInput }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Setpoint");
        },
        resolve: async (query, _root, args, _ctx, _info) => {
          return prismaService.prisma.setpoint.findMany({
            ...query,
            where: args.where ?? {},
            distinct: args.distinct ?? undefined,
            orderBy: args.orderBy ?? {},
            ...(args.paging ?? {}),
          });
        },
      }),
    );

    builder.queryField("countSetpoints", (t) =>
      t.field({
        description: "Count the number of setpoints.",
        authScopes: { admin: true },
        type: "Int",
        args: {
          where: t.arg({ type: SetpointWhere }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Setpoint");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.setpoint.count({
            where: args.where ?? {},
          });
        },
      }),
    );

    builder.queryField("groupSetpoints", (t) =>
      t.field({
        description: "Group a list of setpoints.",
        authScopes: { admin: true },
        type: ["SetpointGroupBy"],
        args: {
          by: t.arg({ type: [SetpointFields], required: true }),
          where: t.arg({ type: SetpointWhere }),
          aggregate: t.arg({ type: SetpointAggregate }),
        },
        smartSubscription: true,
        subscribe: (subscriptions, _parent, _args, _context, _info) => {
          subscriptions.register("Setpoint");
        },
        resolve: async (_root, args, _ctx, _info) => {
          return prismaService.prisma.setpoint.groupBy({
            by: args.by ?? [],
            ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
            where: args.where ?? {},
          });
        },
      }),
    );
  }
}
