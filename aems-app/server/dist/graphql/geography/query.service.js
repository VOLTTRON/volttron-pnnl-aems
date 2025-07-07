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
var GeographyQuery_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeographyQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const object_service_1 = require("./object.service");
const pothos_decorator_1 = require("../pothos.decorator");
const common_2 = require("@local/common");
const lodash_1 = require("lodash");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let GeographyQuery = GeographyQuery_1 = class GeographyQuery {
    constructor(builder, prismaService, geographyObject) {
        this.logger = new common_1.Logger(GeographyQuery_1.name);
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
        builder.addScalarType("GeographyGroupBy", new graphql_1.GraphQLScalarType({
            name: "GeographyGroupBy",
        }));
        const { GeographyWhere, GeographyWhereUnique, GeographyOrderBy, GeographyAggregate } = this;
        builder.queryField("areaGeographies", (t) => t.prismaField({
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
                        .filter(common_2.typeofNonNullable)
                    : undefined;
                return prismaService.prisma.$queryRaw `
              SELECT "id", "name", "group", "type", "geojson", "createdAt", "updatedAt" FROM public."Geography"
              WHERE ST_Intersects(
                ST_SetSRID(ST_GeomFromGeoJSON(${args.area}), 4326),
                "Geography"."geometry"
              )
              ORDER BY "Geography"."createdAt" DESC
              `.then((records) => (fields ? records?.map((record) => (0, lodash_1.pick)(record, fields)) : records) ?? []);
            },
        }));
        builder.queryField("pageGeography", (t) => t.prismaConnection({
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
        }));
        builder.queryField("readGeography", (t) => t.prismaField({
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
        }));
        builder.queryField("readGeographies", (t) => t.prismaField({
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
        }));
        builder.queryField("countGeographies", (t) => t.field({
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
        }));
        builder.queryField("groupGeographies", (t) => t.field({
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
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.GeographyQuery = GeographyQuery;
exports.GeographyQuery = GeographyQuery = GeographyQuery_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.GeographyObject])
], GeographyQuery);
//# sourceMappingURL=query.service.js.map