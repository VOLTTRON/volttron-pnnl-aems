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
exports.BackupQuery = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("graphql");
const builder_service_1 = require("../builder.service");
const object_service_1 = require("./object.service");
const query_service_1 = require("../user/query.service");
const pothos_decorator_1 = require("../pothos.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const backup_discovery_service_1 = require("../../services/backup/backup-discovery.service");
let BackupQuery = class BackupQuery {
    constructor(builder, prismaService, backupObject, userQuery, backupDiscoveryService) {
        const { PagingInput, DateTimeFilter, StringFilter, IntFilter, BooleanFilter } = builder;
        const { BackupPolicyFields, BackupDestinationFields, BackupRunFields, BackupKeyFields, BackupDestinationType, BackupRunStatus, BackupRunTrigger, BackupKeyAlgorithm, } = backupObject;
        const { UserWhereUnique } = userQuery;
        this.BackupPolicyWhereUnique = builder.prismaWhereUnique("BackupPolicy", {
            fields: { id: "String" },
        });
        this.BackupPolicyWhere = builder.prismaWhere("BackupPolicy", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                enabled: BooleanFilter,
                cron: StringFilter,
                retentionDays: IntFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.BackupPolicyOrderBy = builder.prismaOrderBy("BackupPolicy", {
            fields: {
                id: true,
                enabled: true,
                cron: true,
                retentionDays: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        this.BackupPolicyAggregate = builder.inputType("BackupPolicyAggregate", {
            fields: (t) => ({
                average: t.field({ type: [BackupPolicyFields] }),
                count: t.field({ type: [BackupPolicyFields] }),
                maximum: t.field({ type: [BackupPolicyFields] }),
                minimum: t.field({ type: [BackupPolicyFields] }),
                sum: t.field({ type: [BackupPolicyFields] }),
            }),
        });
        builder.addScalarType("BackupPolicyGroupBy", new graphql_1.GraphQLScalarType({
            name: "BackupPolicyGroupBy",
        }));
        this.BackupDestinationWhereUnique = builder.prismaWhereUnique("BackupDestination", {
            fields: { id: "String" },
        });
        this.BackupDestinationWhere = builder.prismaWhere("BackupDestination", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                name: StringFilter,
                output: StringFilter,
                enabled: BooleanFilter,
                policyId: StringFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.BackupDestinationOrderBy = builder.prismaOrderBy("BackupDestination", {
            fields: {
                id: true,
                name: true,
                output: true,
                enabled: true,
                order: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        this.BackupDestinationAggregate = builder.inputType("BackupDestinationAggregate", {
            fields: (t) => ({
                average: t.field({ type: [BackupDestinationFields] }),
                count: t.field({ type: [BackupDestinationFields] }),
                maximum: t.field({ type: [BackupDestinationFields] }),
                minimum: t.field({ type: [BackupDestinationFields] }),
                sum: t.field({ type: [BackupDestinationFields] }),
            }),
        });
        builder.addScalarType("BackupDestinationGroupBy", new graphql_1.GraphQLScalarType({ name: "BackupDestinationGroupBy" }));
        this.BackupRunWhereUnique = builder.prismaWhereUnique("BackupRun", {
            fields: { id: "String" },
        });
        this.BackupRunWhere = builder.prismaWhere("BackupRun", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                keyFingerprint: StringFilter,
                policyId: StringFilter,
                requestedById: StringFilter,
                cancelRequested: BooleanFilter,
                startedAt: DateTimeFilter,
                finishedAt: DateTimeFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
                requestedBy: UserWhereUnique,
            },
        });
        this.BackupRunOrderBy = builder.prismaOrderBy("BackupRun", {
            fields: {
                id: true,
                startedAt: true,
                finishedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        this.BackupRunAggregate = builder.inputType("BackupRunAggregate", {
            fields: (t) => ({
                average: t.field({ type: [BackupRunFields] }),
                count: t.field({ type: [BackupRunFields] }),
                maximum: t.field({ type: [BackupRunFields] }),
                minimum: t.field({ type: [BackupRunFields] }),
                sum: t.field({ type: [BackupRunFields] }),
            }),
        });
        builder.addScalarType("BackupRunGroupBy", new graphql_1.GraphQLScalarType({
            name: "BackupRunGroupBy",
        }));
        this.BackupKeyWhereUnique = builder.prismaWhereUnique("BackupKey", {
            fields: { id: "String" },
        });
        this.BackupKeyWhere = builder.prismaWhere("BackupKey", {
            fields: {
                OR: true,
                AND: true,
                NOT: true,
                id: StringFilter,
                fingerprint: StringFilter,
                active: BooleanFilter,
                acknowledged: BooleanFilter,
                createdAt: DateTimeFilter,
                updatedAt: DateTimeFilter,
            },
        });
        this.BackupKeyOrderBy = builder.prismaOrderBy("BackupKey", {
            fields: {
                id: true,
                active: true,
                acknowledged: true,
                acknowledgedAt: true,
                rotatedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        this.BackupKeyAggregate = builder.inputType("BackupKeyAggregate", {
            fields: (t) => ({
                average: t.field({ type: [BackupKeyFields] }),
                count: t.field({ type: [BackupKeyFields] }),
                maximum: t.field({ type: [BackupKeyFields] }),
                minimum: t.field({ type: [BackupKeyFields] }),
                sum: t.field({ type: [BackupKeyFields] }),
            }),
        });
        builder.addScalarType("BackupKeyGroupBy", new graphql_1.GraphQLScalarType({
            name: "BackupKeyGroupBy",
        }));
        const { BackupPolicyWhereUnique, BackupPolicyWhere, BackupPolicyOrderBy, BackupPolicyAggregate, BackupDestinationWhereUnique, BackupDestinationWhere, BackupDestinationOrderBy, BackupDestinationAggregate, BackupRunWhereUnique, BackupRunWhere, BackupRunOrderBy, BackupRunAggregate, BackupKeyWhereUnique, BackupKeyWhere, BackupKeyOrderBy, BackupKeyAggregate, } = this;
        builder.queryField("pageBackupPolicy", (t) => t.prismaConnection({
            description: "Paginate through backup policies.",
            authScopes: { admin: true },
            type: "BackupPolicy",
            cursor: "id",
            args: { where: t.arg({ type: BackupPolicyWhere }) },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.backupPolicy.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readBackupPolicy", (t) => t.prismaField({
            description: "Read a unique backup policy.",
            authScopes: { admin: true },
            type: "BackupPolicy",
            args: { where: t.arg({ type: BackupPolicyWhereUnique, required: true }) },
            smartSubscription: true,
            subscribe: (subscriptions, _root, args, _context, _info) => {
                subscriptions.register(`BackupPolicy/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.backupPolicy.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readBackupPolicies", (t) => t.prismaField({
            description: "Read a list of backup policies.",
            authScopes: { admin: true },
            type: ["BackupPolicy"],
            args: {
                where: t.arg({ type: BackupPolicyWhere }),
                distinct: t.arg({ type: [BackupPolicyFields] }),
                orderBy: t.arg({ type: [BackupPolicyOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupPolicy");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.backupPolicy.findMany({
                    ...query,
                    where: args.where ?? undefined,
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? { createdAt: "asc" },
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countBackupPolicies", (t) => t.field({
            description: "Count the number of backup policies.",
            authScopes: { admin: true },
            type: "Int",
            args: { where: t.arg({ type: BackupPolicyWhere }) },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupPolicy");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.backupPolicy.count({
                    where: args.where ?? undefined,
                });
            },
        }));
        builder.queryField("groupBackupPolicies", (t) => t.field({
            description: "Group a list of backup policies.",
            authScopes: { admin: true },
            type: ["BackupPolicyGroupBy"],
            args: {
                by: t.arg({ type: [BackupPolicyFields], required: true }),
                where: t.arg({ type: BackupPolicyWhere }),
                aggregate: t.arg({ type: BackupPolicyAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupPolicy");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.backupPolicy
                    .groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                })
                    .then((result) => result);
            },
        }));
        builder.queryField("pageBackupDestination", (t) => t.prismaConnection({
            description: "Paginate through backup destinations.",
            authScopes: { admin: true },
            type: "BackupDestination",
            cursor: "id",
            args: { where: t.arg({ type: BackupDestinationWhere }) },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.backupDestination.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readBackupDestination", (t) => t.prismaField({
            description: "Read a unique backup destination.",
            authScopes: { admin: true },
            type: "BackupDestination",
            args: { where: t.arg({ type: BackupDestinationWhereUnique, required: true }) },
            smartSubscription: true,
            subscribe: (subscriptions, _root, args, _context, _info) => {
                subscriptions.register(`BackupDestination/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.backupDestination.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readBackupDestinations", (t) => t.prismaField({
            description: "Read a list of backup destinations.",
            authScopes: { admin: true },
            type: ["BackupDestination"],
            args: {
                where: t.arg({ type: BackupDestinationWhere }),
                distinct: t.arg({ type: [BackupDestinationFields] }),
                orderBy: t.arg({ type: [BackupDestinationOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupDestination");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.backupDestination.findMany({
                    ...query,
                    where: args.where ?? undefined,
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? { order: "asc" },
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countBackupDestinations", (t) => t.field({
            description: "Count the number of backup destinations.",
            authScopes: { admin: true },
            type: "Int",
            args: { where: t.arg({ type: BackupDestinationWhere }) },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupDestination");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.backupDestination.count({
                    where: args.where ?? undefined,
                });
            },
        }));
        builder.queryField("groupBackupDestinations", (t) => t.field({
            description: "Group a list of backup destinations.",
            authScopes: { admin: true },
            type: ["BackupDestinationGroupBy"],
            args: {
                by: t.arg({ type: [BackupDestinationFields], required: true }),
                where: t.arg({ type: BackupDestinationWhere }),
                aggregate: t.arg({ type: BackupDestinationAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupDestination");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.backupDestination
                    .groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                })
                    .then((result) => result);
            },
        }));
        builder.queryField("pageBackupRun", (t) => t.prismaConnection({
            description: "Paginate through backup runs.",
            authScopes: { admin: true },
            type: "BackupRun",
            cursor: "id",
            args: { where: t.arg({ type: BackupRunWhere }) },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.backupRun.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readBackupRun", (t) => t.prismaField({
            description: "Read a unique backup run.",
            authScopes: { admin: true },
            type: "BackupRun",
            args: { where: t.arg({ type: BackupRunWhereUnique, required: true }) },
            smartSubscription: true,
            subscribe: (subscriptions, _root, args, _context, _info) => {
                subscriptions.register(`BackupRun/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.backupRun.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readBackupRuns", (t) => t.prismaField({
            description: "Read a list of backup runs.",
            authScopes: { admin: true },
            type: ["BackupRun"],
            args: {
                where: t.arg({ type: BackupRunWhere }),
                distinct: t.arg({ type: [BackupRunFields] }),
                orderBy: t.arg({ type: [BackupRunOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupRun");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.backupRun.findMany({
                    ...query,
                    where: args.where ?? undefined,
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? { createdAt: "desc" },
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countBackupRuns", (t) => t.field({
            description: "Count the number of backup runs.",
            authScopes: { admin: true },
            type: "Int",
            args: { where: t.arg({ type: BackupRunWhere }) },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupRun");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.backupRun.count({
                    where: args.where ?? undefined,
                });
            },
        }));
        builder.queryField("groupBackupRuns", (t) => t.field({
            description: "Group a list of backup runs.",
            authScopes: { admin: true },
            type: ["BackupRunGroupBy"],
            args: {
                by: t.arg({ type: [BackupRunFields], required: true }),
                where: t.arg({ type: BackupRunWhere }),
                aggregate: t.arg({ type: BackupRunAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupRun");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.backupRun
                    .groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                })
                    .then((result) => result);
            },
        }));
        builder.queryField("pageBackupKey", (t) => t.prismaConnection({
            description: "Paginate through backup keys.",
            authScopes: { admin: true },
            type: "BackupKey",
            cursor: "id",
            args: { where: t.arg({ type: BackupKeyWhere }) },
            resolve: async (query, _parent, args, _ctx, _info) => {
                return prismaService.prisma.backupKey.findMany({
                    ...query,
                    where: args.where ?? {},
                });
            },
        }));
        builder.queryField("readBackupKey", (t) => t.prismaField({
            description: "Read a unique backup key.",
            authScopes: { admin: true },
            type: "BackupKey",
            args: { where: t.arg({ type: BackupKeyWhereUnique, required: true }) },
            smartSubscription: true,
            subscribe: (subscriptions, _root, args, _context, _info) => {
                subscriptions.register(`BackupKey/${args.where.id}`);
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.backupKey.findUniqueOrThrow({
                    ...query,
                    where: args.where,
                });
            },
        }));
        builder.queryField("readBackupKeys", (t) => t.prismaField({
            description: "Read a list of backup keys (active and historical).",
            authScopes: { admin: true },
            type: ["BackupKey"],
            args: {
                where: t.arg({ type: BackupKeyWhere }),
                distinct: t.arg({ type: [BackupKeyFields] }),
                orderBy: t.arg({ type: [BackupKeyOrderBy] }),
                paging: t.arg({ type: PagingInput }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupKey");
            },
            resolve: async (query, _root, args, _ctx, _info) => {
                return prismaService.prisma.backupKey.findMany({
                    ...query,
                    where: args.where ?? undefined,
                    distinct: args.distinct ?? undefined,
                    orderBy: args.orderBy ?? { createdAt: "desc" },
                    ...(args.paging ?? {}),
                });
            },
        }));
        builder.queryField("countBackupKeys", (t) => t.field({
            description: "Count the number of backup keys.",
            authScopes: { admin: true },
            type: "Int",
            args: { where: t.arg({ type: BackupKeyWhere }) },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupKey");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.backupKey.count({
                    where: args.where ?? undefined,
                });
            },
        }));
        builder.queryField("groupBackupKeys", (t) => t.field({
            description: "Group a list of backup keys.",
            authScopes: { admin: true },
            type: ["BackupKeyGroupBy"],
            args: {
                by: t.arg({ type: [BackupKeyFields], required: true }),
                where: t.arg({ type: BackupKeyWhere }),
                aggregate: t.arg({ type: BackupKeyAggregate }),
            },
            smartSubscription: true,
            subscribe: (subscriptions, _root, _args, _context, _info) => {
                subscriptions.register("BackupKey");
            },
            resolve: async (_root, args, _ctx, _info) => {
                return prismaService.prisma.backupKey
                    .groupBy({
                    by: args.by ?? [],
                    ...builder_service_1.SchemaBuilderService.aggregateToGroupBy(args.aggregate),
                    where: args.where ?? {},
                })
                    .then((result) => result);
            },
        }));
        builder.queryField("discoverBackupSources", (t) => t.field({
            description: "Enumerate backup-capable services, volumes, bind paths, and env files from the live workspace.",
            authScopes: { admin: true },
            type: backupObject.BackupDiscoveryObject,
            resolve: () => backupDiscoveryService.discover(),
        }));
        void BackupDestinationType;
        void BackupRunStatus;
        void BackupRunTrigger;
        void BackupKeyAlgorithm;
    }
};
exports.BackupQuery = BackupQuery;
exports.BackupQuery = BackupQuery = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosQuery)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService,
        prisma_service_1.PrismaService,
        object_service_1.BackupObject,
        query_service_1.UserQuery,
        backup_discovery_service_1.BackupDiscoveryService])
], BackupQuery);
//# sourceMappingURL=query.service.js.map