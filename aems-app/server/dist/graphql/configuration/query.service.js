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
exports.ConfigurationQuery = void 0;
const common_1 = require("@nestjs/common");
const object_service_1 = require("./object.service");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const graphql_1 = require("graphql");
let ConfigurationQuery = class ConfigurationQuery {
    constructor(builder, prismaService, configurationObject) {
        const { StringFilter, DateTimeFilter, PagingInput } = builder;
        const { ConfigurationFields } = configurationObject;
        this.ConfigurationAggregate = builder.inputType("ConfigurationAggregate", {
            fields: (t) => ({
                average: t.field({ type: [ConfigurationFields] }),
                count: t.field({ type: [ConfigurationFields] }),
                maximum: t.field({ type: [ConfigurationFields] }),
                minimum: t.field({ type: [ConfigurationFields] }),
                sum: t.field({ type: [ConfigurationFields] }),
            }),
        });
        this.ConfigurationWhereUnique = builder.prismaWhereUnique("Configuration", {
            fields: {
                id: "String",
            },
        });
        this.ConfigurationWhere = builder.prismaWhere("Configuration", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                stage: builder.ModelStage,
                message: StringFilter,
                correlation: StringFilter,
                label: StringFilter,
                setpointId: StringFilter,
                mondayScheduleId: StringFilter,
                tuesdayScheduleId: StringFilter,
                wednesdayScheduleId: StringFilter,
                thursdayScheduleId: StringFilter,
                fridayScheduleId: StringFilter,
                saturdayScheduleId: StringFilter,
                sundayScheduleId: StringFilter,
                holidayScheduleId: StringFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.ConfigurationOrderBy = builder.prismaOrderBy("Configuration", {
            fields: {
                id: true,
                stage: true,
                message: true,
                correlation: true,
                label: true,
                setpointId: true,
                mondayScheduleId: true,
                tuesdayScheduleId: true,
                wednesdayScheduleId: true,
                thursdayScheduleId: true,
                fridayScheduleId: true,
                saturdayScheduleId: true,
                sundayScheduleId: true,
                holidayScheduleId: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        builder.addScalarType("ConfigurationGroupBy", new graphql_1.GraphQLScalarType({
            name: "ConfigurationGroupBy",
        }));
        const { ConfigurationWhere, ConfigurationWhereUnique, ConfigurationOrderBy, ConfigurationAggregate } = this;
        builder.queryField("pageConfiguration", (t) => t.prismaConnection({
            description: "Paginate through multiple configurations.",
            authScopes: { user: true },
            type: "Configuration",
            cursor: "id",
            args: {
                where: t.arg({ type: ConfigurationWhere }),
            },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.configuration.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readConfiguration", (t) => t.prismaField({
            description: "Read a unique configuration.",
            authScopes: { user: true },
            type: "Configuration",
            args: {
                where: t.arg({ type: ConfigurationWhereUnique, required: true }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, args, _context, _info) => {
                subscriptions.register(`Configuration/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.configuration.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readConfigurations", (t) => t.prismaField({
            description: "Read a list of configurations.",
            authScopes: { user: true },
            type: ["Configuration"],
            args: {
                where: t.arg({ type: ConfigurationWhere }),
                distinct: t.arg({ type: [ConfigurationFields] }),
                orderBy: t.arg({ type: [ConfigurationOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Configuration");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.configuration.findMany({
                    ...query,
                    where: args.where ?? {},
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? {},
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countConfigurations", (t) => t.field({
            description: "Count the number of configurations.",
            authScopes: { user: true },
            type: "Int",
            args: {
                where: t.arg({ type: ConfigurationWhere }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Configuration");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.configuration.count({
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("groupConfigurations", (t) => t.field({
            description: "Group a list of configurations.",
            authScopes: { user: true },
            type: ["ConfigurationGroupBy"],
            args: {
                by: t.arg({ type: [ConfigurationFields], required: true }),
                where: t.arg({ type: ConfigurationWhere }),
                aggregate: t.arg({ type: ConfigurationAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _parent, _args, _context, _info) => {
                subscriptions.register("Configuration");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.configuration.groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.ConfigurationQuery = ConfigurationQuery;
exports.ConfigurationQuery = ConfigurationQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.ConfigurationObject])
], ConfigurationQuery);
//# sourceMappingURL=query.service.js.map