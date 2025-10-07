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
exports.HolidayQuery = void 0;
const common_1 = require("@nestjs/common");
const object_service_1 = require("./object.service");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let HolidayQuery = class HolidayQuery {
    constructor(builder, prismaService, holidayObject) {
        const { StringFilter, IntFilter, DateTimeFilter, PagingInput } = builder;
        const { HolidayFields, HolidayType } = holidayObject;
        this.HolidayAggregate = builder.inputType("HolidayAggregate", {
            fields: (t) => ({
                average: t.field({ type: [HolidayFields] }),
                count: t.field({ type: [HolidayFields] }),
                maximum: t.field({ type: [HolidayFields] }),
                minimum: t.field({ type: [HolidayFields] }),
                sum: t.field({ type: [HolidayFields] }),
            }),
        });
        this.HolidayWhereUnique = builder.prismaWhereUnique("Holiday", {
            fields: {
                id: "String",
            },
        });
        this.HolidayWhere = builder.prismaWhere("Holiday", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                stage: builder.ModelStage,
                message: StringFilter,
                correlation: StringFilter,
                type: HolidayType,
                label: StringFilter,
                month: IntFilter,
                day: IntFilter,
                observance: StringFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.HolidayOrderBy = builder.prismaOrderBy("Holiday", {
            fields: {
                id: true,
                stage: true,
                message: true,
                correlation: true,
                type: true,
                label: true,
                month: true,
                day: true,
                observance: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        builder.addScalarType("HolidayGroupBy", new graphql_1.GraphQLScalarType({
            name: "HolidayGroupBy",
        }));
        const { HolidayWhere, HolidayWhereUnique, HolidayOrderBy, HolidayAggregate } = this;
        builder.queryField("pageHoliday", (t) => t.prismaConnection({
            description: "Paginate through multiple holidays.",
            authScopes: { user: true },
            type: "Holiday",
            cursor: "id",
            args: {
                where: t.arg({ type: HolidayWhere }),
            },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.holiday.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readHoliday", (t) => t.prismaField({
            description: "Read a unique holiday.",
            authScopes: { user: true },
            type: "Holiday",
            args: {
                where: t.arg({ type: HolidayWhereUnique, required: true }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, args, _context, _info) => {
                subscriptions.register(`Holiday/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.holiday.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readHolidays", (t) => t.prismaField({
            description: "Read a list of holidays.",
            authScopes: { user: true },
            type: ["Holiday"],
            args: {
                where: t.arg({ type: HolidayWhere }),
                distinct: t.arg({ type: [HolidayFields] }),
                orderBy: t.arg({ type: [HolidayOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Holiday");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.holiday.findMany({
                    ...query,
                    where: args.where ?? {},
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? {},
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countHolidays", (t) => t.field({
            description: "Count the number of holidays.",
            authScopes: { user: true },
            type: "Int",
            args: {
                where: t.arg({ type: HolidayWhere }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Holiday");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.holiday.count({
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("groupHolidays", (t) => t.field({
            description: "Group a list of holidays.",
            authScopes: { user: true },
            type: ["HolidayGroupBy"],
            args: {
                by: t.arg({ type: [HolidayFields], required: true }),
                where: t.arg({ type: HolidayWhere }),
                aggregate: t.arg({ type: HolidayAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Holiday");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.holiday.groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.HolidayQuery = HolidayQuery;
exports.HolidayQuery = HolidayQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.HolidayObject])
], HolidayQuery);
//# sourceMappingURL=query.service.js.map