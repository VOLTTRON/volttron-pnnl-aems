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
exports.OccupancyQuery = void 0;
const common_1 = require("@nestjs/common");
const object_service_1 = require("./object.service");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let OccupancyQuery = class OccupancyQuery {
    constructor(builder, prismaService, occupancyObject) {
        const { StringFilter, DateTimeFilter, PagingInput } = builder;
        const { OccupancyFields } = occupancyObject;
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
                stage: builder.ModelStage,
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
        builder.addScalarType("OccupancyGroupBy", new graphql_1.GraphQLScalarType({
            name: "OccupancyGroupBy",
        }));
        const { OccupancyWhere, OccupancyWhereUnique, OccupancyOrderBy, OccupancyAggregate } = this;
        builder.queryField("pageOccupancy", (t) => t.prismaConnection({
            description: "Paginate through multiple occupancies.",
            authScopes: { user: true },
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
        }));
        builder.queryField("readOccupancy", (t) => t.prismaField({
            description: "Read a unique occupancy.",
            authScopes: { user: true },
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
        }));
        builder.queryField("readOccupancies", (t) => t.prismaField({
            description: "Read a list of occupancies.",
            authScopes: { user: true },
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
        }));
        builder.queryField("countOccupancies", (t) => t.field({
            description: "Count the number of occupancies.",
            authScopes: { user: true },
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
        }));
        builder.queryField("groupOccupancies", (t) => t.field({
            description: "Group a list of occupancies.",
            authScopes: { user: true },
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
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.OccupancyQuery = OccupancyQuery;
exports.OccupancyQuery = OccupancyQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.OccupancyObject])
], OccupancyQuery);
//# sourceMappingURL=query.service.js.map