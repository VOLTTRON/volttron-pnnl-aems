import { Injectable } from "@nestjs/common";
import { GraphQLScalarType } from "graphql";
import { SchemaBuilderService } from "../builder.service";
import { BackupObject } from "./object.service";
import { UserQuery } from "../user/query.service";
import { PothosQuery } from "../pothos.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
import { Scalars } from "..";

/**
 * BackupQuery - read-only GraphQL queries for the backup subsystem.
 *
 * Each of the four top-level entities (BackupPolicy, BackupDestination,
 * BackupRun, BackupKey) exposes the same read surface used elsewhere in
 * the project:
 *
 *   - `prismaWhereUnique` / `prismaWhere` / `prismaOrderBy` builder inputs
 *   - an `Aggregate` input and a `GroupBy` scalar
 *   - five queries: `pageX`, `readX`, `readXs`, `countXs`, `groupXs`
 *
 * BackupComponent and BackupRunDestination are child rows accessed via
 * their parent BackupRun and are deliberately not given their own query
 * surface; admins observe them through the parent relation.
 *
 * All queries are `admin: true` scoped. Smart subscriptions are registered
 * so the Settings Backup panel receives live updates from the sidecar
 * worker.
 */
@Injectable()
@PothosQuery()
export class BackupQuery {
  readonly BackupPolicyWhereUnique;
  readonly BackupPolicyWhere;
  readonly BackupPolicyOrderBy;
  readonly BackupPolicyAggregate;

  readonly BackupDestinationWhereUnique;
  readonly BackupDestinationWhere;
  readonly BackupDestinationOrderBy;
  readonly BackupDestinationAggregate;

  readonly BackupRunWhereUnique;
  readonly BackupRunWhere;
  readonly BackupRunOrderBy;
  readonly BackupRunAggregate;

  readonly BackupKeyWhereUnique;
  readonly BackupKeyWhere;
  readonly BackupKeyOrderBy;
  readonly BackupKeyAggregate;

  constructor(
    builder: SchemaBuilderService,
    prismaService: PrismaService,
    backupObject: BackupObject,
    userQuery: UserQuery,
    backupDiscoveryService: BackupDiscoveryService,
  ) {
    const { PagingInput, DateTimeFilter, StringFilter, IntFilter, BooleanFilter } = builder;
    const {
      BackupPolicyFields,
      BackupDestinationFields,
      BackupRunFields,
      BackupKeyFields,
      BackupDestinationType,
      BackupRunStatus,
      BackupRunTrigger,
      BackupKeyAlgorithm,
    } = backupObject;
    const { UserWhereUnique } = userQuery;

    // ================================================================
    // BackupPolicy
    // ================================================================
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
    builder.addScalarType(
      "BackupPolicyGroupBy",
      new GraphQLScalarType<Scalars["BackupPolicyGroupBy"]["Input"], Scalars["BackupPolicyGroupBy"]["Output"]>({
        name: "BackupPolicyGroupBy",
      }),
    );

    // ================================================================
    // BackupDestination
    // ================================================================
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
    builder.addScalarType(
      "BackupDestinationGroupBy",
      new GraphQLScalarType<
        Scalars["BackupDestinationGroupBy"]["Input"],
        Scalars["BackupDestinationGroupBy"]["Output"]
      >({ name: "BackupDestinationGroupBy" }),
    );

    // ================================================================
    // BackupRun
    // ================================================================
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
    builder.addScalarType(
      "BackupRunGroupBy",
      new GraphQLScalarType<Scalars["BackupRunGroupBy"]["Input"], Scalars["BackupRunGroupBy"]["Output"]>({
        name: "BackupRunGroupBy",
      }),
    );

    // ================================================================
    // BackupKey
    // ================================================================
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
    builder.addScalarType(
      "BackupKeyGroupBy",
      new GraphQLScalarType<Scalars["BackupKeyGroupBy"]["Input"], Scalars["BackupKeyGroupBy"]["Output"]>({
        name: "BackupKeyGroupBy",
      }),
    );

    // ================================================================
    // Query fields
    // ================================================================
    const {
      BackupPolicyWhereUnique,
      BackupPolicyWhere,
      BackupPolicyOrderBy,
      BackupPolicyAggregate,
      BackupDestinationWhereUnique,
      BackupDestinationWhere,
      BackupDestinationOrderBy,
      BackupDestinationAggregate,
      BackupRunWhereUnique,
      BackupRunWhere,
      BackupRunOrderBy,
      BackupRunAggregate,
      BackupKeyWhereUnique,
      BackupKeyWhere,
      BackupKeyOrderBy,
      BackupKeyAggregate,
    } = this;

    // ---- BackupPolicy ------------------------------------------------
    builder.queryField("pageBackupPolicy", (t) =>
      t.prismaConnection({
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
      }),
    );

    builder.queryField("readBackupPolicy", (t) =>
      t.prismaField({
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
      }),
    );

    builder.queryField("readBackupPolicies", (t) =>
      t.prismaField({
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
      }),
    );

    builder.queryField("countBackupPolicies", (t) =>
      t.field({
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
      }),
    );

    builder.queryField("groupBackupPolicies", (t) =>
      t.field({
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
              ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
              where: args.where ?? {},
            })
            .then((result) => result as PrismaJson.BackupPolicyGroupBy[]);
        },
      }),
    );

    // ---- BackupDestination -------------------------------------------
    builder.queryField("pageBackupDestination", (t) =>
      t.prismaConnection({
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
      }),
    );

    builder.queryField("readBackupDestination", (t) =>
      t.prismaField({
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
      }),
    );

    builder.queryField("readBackupDestinations", (t) =>
      t.prismaField({
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
      }),
    );

    builder.queryField("countBackupDestinations", (t) =>
      t.field({
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
      }),
    );

    builder.queryField("groupBackupDestinations", (t) =>
      t.field({
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
              ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
              where: args.where ?? {},
            })
            .then((result) => result as PrismaJson.BackupDestinationGroupBy[]);
        },
      }),
    );

    // ---- BackupRun ---------------------------------------------------
    builder.queryField("pageBackupRun", (t) =>
      t.prismaConnection({
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
      }),
    );

    builder.queryField("readBackupRun", (t) =>
      t.prismaField({
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
      }),
    );

    builder.queryField("readBackupRuns", (t) =>
      t.prismaField({
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
      }),
    );

    builder.queryField("countBackupRuns", (t) =>
      t.field({
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
      }),
    );

    builder.queryField("groupBackupRuns", (t) =>
      t.field({
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
              ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
              where: args.where ?? {},
            })
            .then((result) => result as PrismaJson.BackupRunGroupBy[]);
        },
      }),
    );

    // ---- BackupKey ---------------------------------------------------
    builder.queryField("pageBackupKey", (t) =>
      t.prismaConnection({
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
      }),
    );

    builder.queryField("readBackupKey", (t) =>
      t.prismaField({
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
      }),
    );

    builder.queryField("readBackupKeys", (t) =>
      t.prismaField({
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
      }),
    );

    builder.queryField("countBackupKeys", (t) =>
      t.field({
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
      }),
    );

    builder.queryField("groupBackupKeys", (t) =>
      t.field({
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
              ...SchemaBuilderService.aggregateToGroupBy(args.aggregate),
              where: args.where ?? {},
            })
            .then((result) => result as PrismaJson.BackupKeyGroupBy[]);
        },
      }),
    );

    // ================================================================
    // BackupDiscovery - not a Prisma model, no subscription target.
    // Reads compose + scans env files via BackupDiscoveryService.
    // ================================================================
    builder.queryField("discoverBackupSources", (t) =>
      t.field({
        description: "Enumerate backup-capable services, volumes, bind paths, and env files from the live workspace.",
        authScopes: { admin: true },
        type: backupObject.BackupDiscoveryObject,
        resolve: () => backupDiscoveryService.discover(),
      }),
    );

    // Reference the unused-by-query-fields imports so tslint doesn't complain
    // about them (they are exported from BackupObject for use elsewhere).
    void BackupDestinationType;
    void BackupRunStatus;
    void BackupRunTrigger;
    void BackupKeyAlgorithm;
  }
}
