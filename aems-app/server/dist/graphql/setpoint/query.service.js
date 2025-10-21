"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetpointQuery = void 0;
const common_1 = require("@nestjs/common");
const object_service_1 = require("./object.service");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let SetpointQuery = class SetpointQuery {
    constructor(builder, prismaService, setpointObject) {
        const { StringFilter, IntFilter, FloatFilter, DateTimeFilter, PagingInput } = builder;
        const { SetpointFields } = setpointObject;
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
                stage: builder.ModelStage,
                message: StringFilter,
                correlation: StringFilter,
                label: StringFilter,
                setpoint: FloatFilter,
                deadband: FloatFilter,
                heating: FloatFilter,
                cooling: FloatFilter,
                standbyTime: IntFilter,
                standbyOffset: FloatFilter,
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
                standbyTime: true,
                standbyOffset: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        builder.addScalarType("SetpointGroupBy", new graphql_1.GraphQLScalarType({
            name: "SetpointGroupBy",
        }));
        const { SetpointWhere, SetpointWhereUnique, SetpointOrderBy, SetpointAggregate } = this;
        builder.queryField("pageSetpoint", (t) => t.prismaConnection({
            description: "Paginate through multiple setpoints.",
            authScopes: { user: true },
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
        }));
        builder.queryField("readSetpoint", (t) => t.prismaField({
            description: "Read a unique setpoint.",
            authScopes: { user: true },
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
        }));
        builder.queryField("readSetpoints", (t) => t.prismaField({
            description: "Read a list of setpoints.",
            authScopes: { user: true },
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
        }));
        builder.queryField("countSetpoints", (t) => t.field({
            description: "Count the number of setpoints.",
            authScopes: { user: true },
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
        }));
        builder.queryField("groupSetpoints", (t) => t.field({
            description: "Group a list of setpoints.",
            authScopes: { user: true },
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
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.SetpointQuery = SetpointQuery;
exports.SetpointQuery = SetpointQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.SetpointObject])
], SetpointQuery);
//# sourceMappingURL=query.service.js.map