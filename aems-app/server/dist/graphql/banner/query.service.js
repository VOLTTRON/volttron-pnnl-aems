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
exports.BannerQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const object_service_1 = require("./object.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let BannerQuery = class BannerQuery {
    constructor(builder, prismaService, bannerObject) {
        const { StringFilter, DateTimeFilter, PagingInput } = builder;
        const { BannerFields } = bannerObject;
        this.BannerWhereUnique = builder.prismaWhereUnique("Banner", {
            fields: {
                id: "String",
            },
        });
        this.BannerWhere = builder.prismaWhere("Banner", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                message: StringFilter,
                expiration: DateTimeFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.BannerOrderBy = builder.prismaOrderBy("Banner", {
            fields: {
                id: true,
                message: true,
                expiration: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        this.BannerAggregate = builder.inputType("BannerAggregate", {
            fields: (t) => ({
                average: t.field({ type: [BannerFields] }),
                count: t.field({ type: [BannerFields] }),
                maximum: t.field({ type: [BannerFields] }),
                minimum: t.field({ type: [BannerFields] }),
                sum: t.field({ type: [BannerFields] }),
            }),
        });
        builder.addScalarType("BannerGroupBy", new graphql_1.GraphQLScalarType({
            name: "BannerGroupBy",
        }));
        const { BannerWhere, BannerWhereUnique, BannerOrderBy, BannerAggregate } = this;
        builder.queryField("pageBanner", (t) => t.prismaConnection({
            description: "Paginate through multiple banners.",
            authScopes: { user: true },
            type: "Banner",
            cursor: "id",
            args: {
                where: t.arg({ type: BannerWhere }),
            },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.banner.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readBanner", (t) => t.prismaField({
            description: "Read a unique banner.",
            authScopes: { user: true },
            type: "Banner",
            args: {
                where: t.arg({ type: BannerWhereUnique, required: true }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _banner, args, _context, _info) => {
                subscriptions.register(`Banner/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.banner.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readBanners", (t) => t.prismaField({
            description: "Read a list of banners.",
            authScopes: { user: true },
            type: ["Banner"],
            args: {
                where: t.arg({ type: BannerWhere }),
                distinct: t.arg({ type: [BannerFields] }),
                orderBy: t.arg({ type: [BannerOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _banner, _args, _context, _info) => {
                subscriptions.register("Banner");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.banner.findMany({
                    ...query,
                    where: args.where ?? undefined,
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? {},
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countBanners", (t) => t.field({
            description: "Count the number of banners.",
            authScopes: { user: true },
            type: "Int",
            args: {
                where: t.arg({ type: BannerWhere }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _banner, _args, _context, _info) => {
                subscriptions.register("Banner");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.banner.count({
                    where: args.where ?? undefined,
                });
            },
        }));
        builder.queryField("groupBanners", (t) => t.field({
            description: "Group a list of banners.",
            authScopes: { user: true },
            type: ["BannerGroupBy"],
            args: {
                by: t.arg({ type: [BannerFields], required: true }),
                where: t.arg({ type: BannerWhere }),
                aggregate: t.arg({ type: BannerAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _banner, _args, _context, _info) => {
                subscriptions.register("Banner");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.banner
                    .groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                })
                    .then((result) => result);
            },
        }));
    }
};
exports.BannerQuery = BannerQuery;
exports.BannerQuery = BannerQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.BannerObject])
], BannerQuery);
//# sourceMappingURL=query.service.js.map