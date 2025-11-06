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
exports.ScheduleQuery = void 0;
const common_1 = require("@nestjs/common");
const object_service_1 = require("./object.service");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let ScheduleQuery = class ScheduleQuery {
    constructor(builder, prismaService, scheduleObject) {
        const { StringFilter, BooleanFilter, DateTimeFilter, PagingInput } = builder;
        const { ScheduleFields } = scheduleObject;
        this.ScheduleAggregate = builder.inputType("ScheduleAggregate", {
            fields: (t) => ({
                average: t.field({ type: [ScheduleFields] }),
                count: t.field({ type: [ScheduleFields] }),
                maximum: t.field({ type: [ScheduleFields] }),
                minimum: t.field({ type: [ScheduleFields] }),
                sum: t.field({ type: [ScheduleFields] }),
            }),
        });
        this.ScheduleWhereUnique = builder.prismaWhereUnique("Schedule", {
            fields: {
                id: "String",
            },
        });
        this.ScheduleWhere = builder.prismaWhere("Schedule", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                stage: builder.ModelStage,
                message: StringFilter,
                correlation: StringFilter,
                label: StringFilter,
                startTime: StringFilter,
                endTime: StringFilter,
                occupied: BooleanFilter,
                setpointId: StringFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.ScheduleOrderBy = builder.prismaOrderBy("Schedule", {
            fields: {
                id: true,
                stage: true,
                message: true,
                correlation: true,
                label: true,
                startTime: true,
                endTime: true,
                occupied: true,
                setpointId: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        builder.addScalarType("ScheduleGroupBy", new graphql_1.GraphQLScalarType({
            name: "ScheduleGroupBy",
        }));
        const { ScheduleWhere, ScheduleWhereUnique, ScheduleOrderBy, ScheduleAggregate } = this;
        builder.queryField("pageSchedule", (t) => t.prismaConnection({
            description: "Paginate through multiple schedules.",
            authScopes: { user: true },
            type: "Schedule",
            cursor: "id",
            args: {
                where: t.arg({ type: ScheduleWhere }),
            },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.schedule.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readSchedule", (t) => t.prismaField({
            description: "Read a unique schedule.",
            authScopes: { user: true },
            type: "Schedule",
            args: {
                where: t.arg({ type: ScheduleWhereUnique, required: true }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, args, _context, _info) => {
                subscriptions.register(`Schedule/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.schedule.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readSchedules", (t) => t.prismaField({
            description: "Read a list of schedules.",
            authScopes: { user: true },
            type: ["Schedule"],
            args: {
                where: t.arg({ type: ScheduleWhere }),
                distinct: t.arg({ type: [ScheduleFields] }),
                orderBy: t.arg({ type: [ScheduleOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Schedule");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.schedule.findMany({
                    ...query,
                    where: args.where ?? {},
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? {},
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countSchedules", (t) => t.field({
            description: "Count the number of schedules.",
            authScopes: { user: true },
            type: "Int",
            args: {
                where: t.arg({ type: ScheduleWhere }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Schedule");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.schedule.count({
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("groupSchedules", (t) => t.field({
            description: "Group a list of schedules.",
            authScopes: { user: true },
            type: ["ScheduleGroupBy"],
            args: {
                by: t.arg({ type: [ScheduleFields], required: true }),
                where: t.arg({ type: ScheduleWhere }),
                aggregate: t.arg({ type: ScheduleAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Schedule");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.schedule.groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.ScheduleQuery = ScheduleQuery;
exports.ScheduleQuery = ScheduleQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.ScheduleObject])
], ScheduleQuery);
//# sourceMappingURL=query.service.js.map