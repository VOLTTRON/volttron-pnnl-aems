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
exports.LogQuery = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const object_service_1 = require("./object.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
let LogQuery = class LogQuery {
    constructor(builder, prismaService, logObject) {
        const { StringFilter, DateTimeFilter, LogTypeFilter, PagingInput } = builder;
        const { LogFields } = logObject;
        this.LogWhereUnique = builder.prismaWhereUnique("Log", {
            fields: {
                id: "String",
            },
        });
        this.LogWhere = builder.prismaWhere("Log", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                type: LogTypeFilter,
                message: StringFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.LogOrderBy = builder.prismaOrderBy("Log", {
            fields: {
                id: true,
                type: true,
                message: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        this.LogAggregate = builder.inputType("LogAggregate", {
            fields: (t) => ({
                average: t.field({ type: [LogFields] }),
                count: t.field({ type: [LogFields] }),
                maximum: t.field({ type: [LogFields] }),
                minimum: t.field({ type: [LogFields] }),
                sum: t.field({ type: [LogFields] }),
            }),
        });
        const { LogWhere, LogWhereUnique, LogOrderBy, LogAggregate } = this;
        builder.queryField("pageLog", (t) => t.prismaConnection({
            description: "Paginate through multiple logs.",
            authScopes: { admin: true },
            type: "Log",
            cursor: "id",
            args: {
                where: t.arg({ type: LogWhere }),
            },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.log.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readLog", (t) => t.prismaField({
            description: "Read a unique log.",
            authScopes: { admin: true },
            type: "Log",
            args: {
                where: t.arg({ type: LogWhereUnique, required: true }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _log, args, _context, _info) => {
                subscriptions.register(`Log/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.log.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readLogs", (t) => t.prismaField({
            description: "Read a list of logs.",
            authScopes: { admin: true },
            type: ["Log"],
            args: {
                where: t.arg({ type: LogWhere }),
                distinct: t.arg({ type: [LogFields] }),
                orderBy: t.arg({ type: [LogOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _log, _args, _context, _info) => {
                subscriptions.register("Log");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.log.findMany({
                    ...query,
                    where: args.where ?? undefined,
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? {},
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countLogs", (t) => t.field({
            description: "Count the number of logs.",
            authScopes: { admin: true },
            type: "Int",
            args: {
                where: t.arg({ type: LogWhere }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _log, _args, _context, _info) => {
                subscriptions.register("Log");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.log.count({
                    where: args.where ?? undefined,
                });
            },
        }));
        builder.queryField("groupLogs", (t) => t.field({
            description: "Group a list of logs.",
            authScopes: { admin: true },
            type: ["LogGroupBy"],
            args: {
                by: t.arg({ type: [LogFields], required: true }),
                where: t.arg({ type: LogWhere }),
                aggregate: t.arg({ type: LogAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _log, _args, _context, _info) => {
                subscriptions.register("Log");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.log.groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                });
            },
        }));
    }
};
exports.LogQuery = LogQuery;
exports.LogQuery = LogQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, prisma_service_1.PrismaService, object_service_1.LogObject])
], LogQuery);
//# sourceMappingURL=query.service.js.map