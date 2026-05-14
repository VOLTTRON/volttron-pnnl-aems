import { SchemaBuilderService } from "../builder.service";
import { BackupObject } from "./object.service";
import { UserQuery } from "../user/query.service";
import { PrismaService } from "@/prisma/prisma.service";
import { BackupDiscoveryService } from "@/services/backup/backup-discovery.service";
import { Scalars } from "..";
export declare class BackupQuery {
    readonly BackupPolicyWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@prisma/client").Prisma.BackupPolicyWhereUniqueInput>;
    readonly BackupPolicyWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import("@prisma/client").Prisma.BackupPolicyWhereInput, {
        OR: true;
        AND: true;
        NOT: true;
        id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        enabled: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<boolean>, "not" | "equals">>;
        cron: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        retentionDays: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<number>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt">>;
        createdAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
        updatedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
    }>>;
    readonly BackupPolicyOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@prisma/client").Prisma.BackupPolicyOrderByWithRelationInput>;
    readonly BackupPolicyAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, {
        count?: ("id" | "createdAt" | "updatedAt" | "enabled" | "cron" | "retentionDays" | "excludeVolumes" | "excludePaths" | "excludeServices" | "excludeEnvFiles" | "extraEnvFiles")[] | null | undefined;
        sum?: ("id" | "createdAt" | "updatedAt" | "enabled" | "cron" | "retentionDays" | "excludeVolumes" | "excludePaths" | "excludeServices" | "excludeEnvFiles" | "extraEnvFiles")[] | null | undefined;
        maximum?: ("id" | "createdAt" | "updatedAt" | "enabled" | "cron" | "retentionDays" | "excludeVolumes" | "excludePaths" | "excludeServices" | "excludeEnvFiles" | "extraEnvFiles")[] | null | undefined;
        minimum?: ("id" | "createdAt" | "updatedAt" | "enabled" | "cron" | "retentionDays" | "excludeVolumes" | "excludePaths" | "excludeServices" | "excludeEnvFiles" | "extraEnvFiles")[] | null | undefined;
        average?: ("id" | "createdAt" | "updatedAt" | "enabled" | "cron" | "retentionDays" | "excludeVolumes" | "excludePaths" | "excludeServices" | "excludeEnvFiles" | "extraEnvFiles")[] | null | undefined;
    }>;
    readonly BackupDestinationWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@prisma/client").Prisma.BackupDestinationWhereUniqueInput>;
    readonly BackupDestinationWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import("@prisma/client").Prisma.BackupDestinationWhereInput, {
        OR: true;
        AND: true;
        NOT: true;
        id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        name: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        output: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        enabled: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<boolean>, "not" | "equals">>;
        policyId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        createdAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
        updatedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
    }>>;
    readonly BackupDestinationOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@prisma/client").Prisma.BackupDestinationOrderByWithRelationInput>;
    readonly BackupDestinationAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, {
        count?: ("name" | "id" | "createdAt" | "updatedAt" | "type" | "policyId" | "enabled" | "output" | "sseMode" | "sseKmsKeyId" | "order")[] | null | undefined;
        sum?: ("name" | "id" | "createdAt" | "updatedAt" | "type" | "policyId" | "enabled" | "output" | "sseMode" | "sseKmsKeyId" | "order")[] | null | undefined;
        maximum?: ("name" | "id" | "createdAt" | "updatedAt" | "type" | "policyId" | "enabled" | "output" | "sseMode" | "sseKmsKeyId" | "order")[] | null | undefined;
        minimum?: ("name" | "id" | "createdAt" | "updatedAt" | "type" | "policyId" | "enabled" | "output" | "sseMode" | "sseKmsKeyId" | "order")[] | null | undefined;
        average?: ("name" | "id" | "createdAt" | "updatedAt" | "type" | "policyId" | "enabled" | "output" | "sseMode" | "sseKmsKeyId" | "order")[] | null | undefined;
    }>;
    readonly BackupRunWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@prisma/client").Prisma.BackupRunWhereUniqueInput>;
    readonly BackupRunWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import("@prisma/client").Prisma.BackupRunWhereInput, {
        OR: true;
        AND: true;
        NOT: true;
        id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        keyFingerprint: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        policyId: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        requestedById: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        cancelRequested: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<boolean>, "not" | "equals">>;
        startedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
        finishedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
        createdAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
        updatedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
        requestedBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, import("@prisma/client").Prisma.UserWhereUniqueInput>;
    }>>;
    readonly BackupRunOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@prisma/client").Prisma.BackupRunOrderByWithRelationInput>;
    readonly BackupRunAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, {
        count?: ("id" | "createdAt" | "updatedAt" | "status" | "policyId" | "trigger" | "requestedById" | "keyFingerprint" | "startedAt" | "finishedAt" | "heartbeatAt" | "archivePath" | "archiveBytes" | "archiveSha256" | "manifest" | "errorMessage" | "cancelRequested")[] | null | undefined;
        sum?: ("id" | "createdAt" | "updatedAt" | "status" | "policyId" | "trigger" | "requestedById" | "keyFingerprint" | "startedAt" | "finishedAt" | "heartbeatAt" | "archivePath" | "archiveBytes" | "archiveSha256" | "manifest" | "errorMessage" | "cancelRequested")[] | null | undefined;
        maximum?: ("id" | "createdAt" | "updatedAt" | "status" | "policyId" | "trigger" | "requestedById" | "keyFingerprint" | "startedAt" | "finishedAt" | "heartbeatAt" | "archivePath" | "archiveBytes" | "archiveSha256" | "manifest" | "errorMessage" | "cancelRequested")[] | null | undefined;
        minimum?: ("id" | "createdAt" | "updatedAt" | "status" | "policyId" | "trigger" | "requestedById" | "keyFingerprint" | "startedAt" | "finishedAt" | "heartbeatAt" | "archivePath" | "archiveBytes" | "archiveSha256" | "manifest" | "errorMessage" | "cancelRequested")[] | null | undefined;
        average?: ("id" | "createdAt" | "updatedAt" | "status" | "policyId" | "trigger" | "requestedById" | "keyFingerprint" | "startedAt" | "finishedAt" | "heartbeatAt" | "archivePath" | "archiveBytes" | "archiveSha256" | "manifest" | "errorMessage" | "cancelRequested")[] | null | undefined;
    }>;
    readonly BackupKeyWhereUnique: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@prisma/client").Prisma.BackupKeyWhereUniqueInput>;
    readonly BackupKeyWhere: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@pothos/plugin-prisma-utils").PickFields<import("@prisma/client").Prisma.BackupKeyWhereInput, {
        OR: true;
        AND: true;
        NOT: true;
        id: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        fingerprint: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<string>, "endsWith" | "startsWith" | "not" | "in" | "equals" | "contains" | "mode">>;
        active: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<boolean>, "not" | "equals">>;
        acknowledged: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<boolean>, "not" | "equals">>;
        createdAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
        updatedAt: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
            Context: import("..").Context;
            AuthScopes: import("../../auth").AuthRoles;
            PrismaTypes: import("@local/prisma/dist/pothos").default;
            Scalars: Scalars;
        }>, Pick<import("@pothos/plugin-prisma-utils").FilterShape<Date>, "not" | "lt" | "in" | "gte" | "equals" | "lte" | "gt" | "contains" | "mode">>;
    }>>;
    readonly BackupKeyOrderBy: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, import("@prisma/client").Prisma.BackupKeyOrderByWithRelationInput>;
    readonly BackupKeyAggregate: PothosSchemaTypes.InputObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: Scalars;
    }>, {
        count?: ("id" | "createdAt" | "updatedAt" | "algorithm" | "publicKey" | "privateKeyPath" | "fingerprint" | "active" | "acknowledged" | "acknowledgedAt" | "acknowledgedById" | "rotatedAt")[] | null | undefined;
        sum?: ("id" | "createdAt" | "updatedAt" | "algorithm" | "publicKey" | "privateKeyPath" | "fingerprint" | "active" | "acknowledged" | "acknowledgedAt" | "acknowledgedById" | "rotatedAt")[] | null | undefined;
        maximum?: ("id" | "createdAt" | "updatedAt" | "algorithm" | "publicKey" | "privateKeyPath" | "fingerprint" | "active" | "acknowledged" | "acknowledgedAt" | "acknowledgedById" | "rotatedAt")[] | null | undefined;
        minimum?: ("id" | "createdAt" | "updatedAt" | "algorithm" | "publicKey" | "privateKeyPath" | "fingerprint" | "active" | "acknowledged" | "acknowledgedAt" | "acknowledgedById" | "rotatedAt")[] | null | undefined;
        average?: ("id" | "createdAt" | "updatedAt" | "algorithm" | "publicKey" | "privateKeyPath" | "fingerprint" | "active" | "acknowledged" | "acknowledgedAt" | "acknowledgedById" | "rotatedAt")[] | null | undefined;
    }>;
    constructor(builder: SchemaBuilderService, prismaService: PrismaService, backupObject: BackupObject, userQuery: UserQuery, backupDiscoveryService: BackupDiscoveryService);
}
