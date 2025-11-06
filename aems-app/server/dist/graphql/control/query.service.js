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
exports.ControlQuery = void 0;
const common_1 = require("@nestjs/common");
const object_service_1 = require("./object.service");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let ControlQuery = class ControlQuery {
    constructor(builder, prismaService, controlObject) {
        const { StringFilter, BooleanFilter, DateTimeFilter, PagingInput } = builder;
        const { ControlFields } = controlObject;
        this.ControlAggregate = builder.inputType("ControlAggregate", {
            fields: (t) => ({
                average: t.field({ type: [ControlFields] }),
                count: t.field({ type: [ControlFields] }),
                maximum: t.field({ type: [ControlFields] }),
                minimum: t.field({ type: [ControlFields] }),
                sum: t.field({ type: [ControlFields] }),
            }),
        });
        this.ControlWhereUnique = builder.prismaWhereUnique("Control", {
            fields: {
                id: "String",
            },
        });
        this.ControlWhere = builder.prismaWhere("Control", {
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
                label: StringFilter,
                peakLoadExclude: BooleanFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.ControlOrderBy = builder.prismaOrderBy("Control", {
            fields: {
                id: true,
                stage: true,
                message: true,
                correlation: true,
                name: true,
                campus: true,
                building: true,
                label: true,
                peakLoadExclude: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        builder.addScalarType("ControlGroupBy", new graphql_1.GraphQLScalarType({
            name: "ControlGroupBy",
        }));
        const { ControlWhere, ControlWhereUnique, ControlOrderBy, ControlAggregate } = this;
        builder.queryField("pageControl", (t) => t.prismaConnection({
            description: "Paginate through multiple controls.",
            authScopes: { user: true },
            type: "Control",
            cursor: "id",
            args: {
                where: t.arg({ type: ControlWhere }),
            },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.control.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readControl", (t) => t.prismaField({
            description: "Read a unique control.",
            authScopes: { user: true },
            type: "Control",
            args: {
                where: t.arg({ type: ControlWhereUnique, required: true }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, args, _context, _info) => {
                subscriptions.register(`Control/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.control.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readControls", (t) => t.prismaField({
            description: "Read a list of controls.",
            authScopes: { user: true },
            type: ["Control"],
            args: {
                where: t.arg({ type: ControlWhere }),
                distinct: t.arg({ type: [ControlFields] }),
                orderBy: t.arg({ type: [ControlOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Control");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.control.findMany({
                    ...query,
                    where: args.where ?? {},
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? {},
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countControls", (t) => t.field({
            description: "Count the number of controls.",
            authScopes: { user: true },
            type: "Int",
            args: {
                where: t.arg({ type: ControlWhere }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Control");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.control.count({
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("groupControls", (t) => t.field({
            description: "Group a list of controls.",
            authScopes: { user: true },
            type: ["ControlGroupBy"],
            args: {
                by: t.arg({ type: [ControlFields], required: true }),
                where: t.arg({ type: ControlWhere }),
                aggregate: t.arg({ type: ControlAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Control");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.control.groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.ControlQuery = ControlQuery;
exports.ControlQuery = ControlQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.ControlObject])
], ControlQuery);
//# sourceMappingURL=query.service.js.map