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
exports.LocationQuery = void 0;
const common_1 = require("@nestjs/common");
const object_service_1 = require("./object.service");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let LocationQuery = class LocationQuery {
    constructor(builder, prismaService, locationObject) {
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
        builder.addScalarType("LocationGroupBy", new graphql_1.GraphQLScalarType({
            name: "LocationGroupBy",
        }));
        const { LocationWhere, LocationWhereUnique, LocationOrderBy, LocationAggregate } = this;
        builder.queryField("pageLocation", (t) => t.prismaConnection({
            description: "Paginate through multiple locations.",
            authScopes: { user: true },
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
        }));
        builder.queryField("readLocation", (t) => t.prismaField({
            description: "Read a unique location.",
            authScopes: { user: true },
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
        }));
        builder.queryField("readLocations", (t) => t.prismaField({
            description: "Read a list of locations.",
            authScopes: { user: true },
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
        }));
        builder.queryField("countLocations", (t) => t.field({
            description: "Count the number of locations.",
            authScopes: { user: true },
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
        }));
        builder.queryField("groupLocations", (t) => t.field({
            description: "Group a list of locations.",
            authScopes: { user: true },
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
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.LocationQuery = LocationQuery;
exports.LocationQuery = LocationQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.LocationObject])
], LocationQuery);
//# sourceMappingURL=query.service.js.map