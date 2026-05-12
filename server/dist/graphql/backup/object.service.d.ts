import { Prisma } from "@prisma/client";
import { SchemaBuilderService } from "../builder.service";
import { BackupDiscoveredEnvFile, BackupDiscoveredPath, BackupDiscoveredService, BackupDiscoveredVolume, BackupDiscovery } from "@/services/backup/backup-discovery.service";
import { BackupArchiveService } from "@/services/backup/backup-archive.service";
export declare class BackupObject {
    readonly BackupDestinationType: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "Local" | "S3", "Local" | "S3">;
    readonly BackupRunStatus: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "Queued" | "Running" | "Success" | "Failed" | "Cancelled", "Queued" | "Running" | "Success" | "Failed" | "Cancelled">;
    readonly BackupRunTrigger: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "Scheduled" | "Manual" | "Retry" | "Test", "Scheduled" | "Manual" | "Retry" | "Test">;
    readonly BackupComponentType: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "File" | "Postgres" | "MariaDB" | "Volume" | "Path", "File" | "Postgres" | "MariaDB" | "Volume" | "Path">;
    readonly BackupComponentStatus: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "Running" | "Success" | "Failed" | "Pending" | "Skipped", "Running" | "Success" | "Failed" | "Pending" | "Skipped">;
    readonly BackupKeyAlgorithm: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "Age" | "Gpg", "Age" | "Gpg">;
    readonly BackupArchiveAvailability: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "Available" | "Missing" | "Removed", "Available" | "Missing" | "Removed">;
    readonly BackupPolicyObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "BackupPolicy";
        Shape: import("@prisma/client").BackupPolicy;
        Include: Prisma.BackupPolicyInclude;
        Select: Prisma.BackupPolicySelect;
        OrderBy: Prisma.BackupPolicyOrderByWithRelationInput;
        WhereUnique: Prisma.BackupPolicyWhereUniqueInput;
        Where: Prisma.BackupPolicyWhereInput;
        Create: Prisma.BackupPolicyCreateInput;
        Update: Prisma.BackupPolicyUpdateInput;
        RelationName: "destinations" | "runs";
        ListRelations: "destinations" | "runs";
        Relations: {
            destinations: {
                Shape: import("@prisma/client").BackupDestination[];
                Name: "BackupDestination";
                Nullable: false;
            };
            runs: {
                Shape: import("@prisma/client").BackupRun[];
                Name: "BackupRun";
                Nullable: false;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        enabled: boolean;
        cron: string;
        retentionDays: number;
        excludeVolumes: string[];
        excludePaths: string[];
        excludeServices: string[];
        excludeEnvFiles: string[];
        extraEnvFiles: string[];
    }>;
    readonly BackupDestinationObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "BackupDestination";
        Shape: import("@prisma/client").BackupDestination;
        Include: Prisma.BackupDestinationInclude;
        Select: Prisma.BackupDestinationSelect;
        OrderBy: Prisma.BackupDestinationOrderByWithRelationInput;
        WhereUnique: Prisma.BackupDestinationWhereUniqueInput;
        Where: Prisma.BackupDestinationWhereInput;
        Create: Prisma.BackupDestinationCreateInput;
        Update: Prisma.BackupDestinationUpdateInput;
        RelationName: "policy" | "runs";
        ListRelations: "runs";
        Relations: {
            policy: {
                Shape: import("@prisma/client").BackupPolicy;
                Name: "BackupPolicy";
                Nullable: false;
            };
            runs: {
                Shape: import("@prisma/client").BackupRunDestination[];
                Name: "BackupRunDestination";
                Nullable: false;
            };
        };
    }, {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.BackupDestinationType;
        policyId: string;
        enabled: boolean;
        output: string | null;
        sseMode: string | null;
        sseKmsKeyId: string | null;
        order: number;
    }>;
    readonly BackupRunObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "BackupRun";
        Shape: import("@prisma/client").BackupRun;
        Include: Prisma.BackupRunInclude;
        Select: Prisma.BackupRunSelect;
        OrderBy: Prisma.BackupRunOrderByWithRelationInput;
        WhereUnique: Prisma.BackupRunWhereUniqueInput;
        Where: Prisma.BackupRunWhereInput;
        Create: Prisma.BackupRunCreateInput;
        Update: Prisma.BackupRunUpdateInput;
        RelationName: "policy" | "requestedBy" | "components" | "destinations";
        ListRelations: "components" | "destinations";
        Relations: {
            policy: {
                Shape: import("@prisma/client").BackupPolicy;
                Name: "BackupPolicy";
                Nullable: false;
            };
            requestedBy: {
                Shape: import("@prisma/client").User | null;
                Name: "User";
                Nullable: true;
            };
            components: {
                Shape: import("@prisma/client").BackupComponent[];
                Name: "BackupComponent";
                Nullable: false;
            };
            destinations: {
                Shape: import("@prisma/client").BackupRunDestination[];
                Name: "BackupRunDestination";
                Nullable: false;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.BackupRunStatus;
        policyId: string;
        trigger: import("@prisma/client").$Enums.BackupRunTrigger;
        requestedById: string | null;
        keyFingerprint: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        heartbeatAt: Date | null;
        archivePath: string | null;
        archiveBytes: bigint | null;
        archiveSha256: string | null;
        manifest: PrismaJson.BackupManifest | null;
        errorMessage: string | null;
        cancelRequested: boolean;
    }>;
    readonly BackupComponentObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "BackupComponent";
        Shape: import("@prisma/client").BackupComponent;
        Include: Prisma.BackupComponentInclude;
        Select: Prisma.BackupComponentSelect;
        OrderBy: Prisma.BackupComponentOrderByWithRelationInput;
        WhereUnique: Prisma.BackupComponentWhereUniqueInput;
        Where: Prisma.BackupComponentWhereInput;
        Create: Prisma.BackupComponentCreateInput;
        Update: Prisma.BackupComponentUpdateInput;
        RelationName: "run";
        ListRelations: never;
        Relations: {
            run: {
                Shape: import("@prisma/client").BackupRun;
                Name: "BackupRun";
                Nullable: false;
            };
        };
    }, {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        error: string | null;
        type: import("@prisma/client").$Enums.BackupComponentType;
        status: import("@prisma/client").$Enums.BackupComponentStatus;
        startedAt: Date | null;
        finishedAt: Date | null;
        runId: string;
        bytes: bigint | null;
        durationMs: number | null;
    }>;
    readonly BackupRunDestinationObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "BackupRunDestination";
        Shape: import("@prisma/client").BackupRunDestination;
        Include: Prisma.BackupRunDestinationInclude;
        Select: Prisma.BackupRunDestinationSelect;
        OrderBy: Prisma.BackupRunDestinationOrderByWithRelationInput;
        WhereUnique: Prisma.BackupRunDestinationWhereUniqueInput;
        Where: Prisma.BackupRunDestinationWhereInput;
        Create: Prisma.BackupRunDestinationCreateInput;
        Update: Prisma.BackupRunDestinationUpdateInput;
        RelationName: "run" | "destination";
        ListRelations: never;
        Relations: {
            run: {
                Shape: import("@prisma/client").BackupRun;
                Name: "BackupRun";
                Nullable: false;
            };
            destination: {
                Shape: import("@prisma/client").BackupDestination;
                Name: "BackupDestination";
                Nullable: false;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        error: string | null;
        status: import("@prisma/client").$Enums.BackupComponentStatus;
        startedAt: Date | null;
        finishedAt: Date | null;
        runId: string;
        destinationId: string;
        uploadedBytes: bigint | null;
        finalPath: string | null;
        archiveDeletedAt: Date | null;
    }>;
    readonly BackupKeyObject: import("@pothos/plugin-prisma").PrismaObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, import("@pothos/plugin-prisma").PrismaModelTypes & {
        Name: "BackupKey";
        Shape: import("@prisma/client").BackupKey;
        Include: Prisma.BackupKeyInclude;
        Select: Prisma.BackupKeySelect;
        OrderBy: Prisma.BackupKeyOrderByWithRelationInput;
        WhereUnique: Prisma.BackupKeyWhereUniqueInput;
        Where: Prisma.BackupKeyWhereInput;
        Create: Prisma.BackupKeyCreateInput;
        Update: Prisma.BackupKeyUpdateInput;
        RelationName: "acknowledgedBy";
        ListRelations: never;
        Relations: {
            acknowledgedBy: {
                Shape: import("@prisma/client").User | null;
                Name: "User";
                Nullable: true;
            };
        };
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        algorithm: import("@prisma/client").$Enums.BackupKeyAlgorithm;
        publicKey: string;
        privateKeyPath: string | null;
        fingerprint: string;
        active: boolean;
        acknowledged: boolean;
        acknowledgedAt: Date | null;
        acknowledgedById: string | null;
        rotatedAt: Date | null;
    }>;
    readonly BackupDiscoveredServiceObject: PothosSchemaTypes.ObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, BackupDiscoveredService, BackupDiscoveredService>;
    readonly BackupDiscoveredVolumeObject: PothosSchemaTypes.ObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, BackupDiscoveredVolume, BackupDiscoveredVolume>;
    readonly BackupDiscoveredPathObject: PothosSchemaTypes.ObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, BackupDiscoveredPath, BackupDiscoveredPath>;
    readonly BackupDiscoveredEnvFileObject: PothosSchemaTypes.ObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, BackupDiscoveredEnvFile, BackupDiscoveredEnvFile>;
    readonly BackupDiscoveryObject: PothosSchemaTypes.ObjectRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, BackupDiscovery, BackupDiscovery>;
    readonly BackupPolicyFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "enabled" | "cron" | "retentionDays" | "excludeVolumes" | "excludePaths" | "excludeServices" | "excludeEnvFiles" | "extraEnvFiles", "id" | "createdAt" | "updatedAt" | "enabled" | "cron" | "retentionDays" | "excludeVolumes" | "excludePaths" | "excludeServices" | "excludeEnvFiles" | "extraEnvFiles">;
    readonly BackupDestinationFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "name" | "id" | "createdAt" | "updatedAt" | "type" | "policyId" | "enabled" | "output" | "sseMode" | "sseKmsKeyId" | "order", "name" | "id" | "createdAt" | "updatedAt" | "type" | "policyId" | "enabled" | "output" | "sseMode" | "sseKmsKeyId" | "order">;
    readonly BackupRunFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "status" | "policyId" | "trigger" | "requestedById" | "keyFingerprint" | "startedAt" | "finishedAt" | "heartbeatAt" | "archivePath" | "archiveBytes" | "archiveSha256" | "manifest" | "errorMessage" | "cancelRequested", "id" | "createdAt" | "updatedAt" | "status" | "policyId" | "trigger" | "requestedById" | "keyFingerprint" | "startedAt" | "finishedAt" | "heartbeatAt" | "archivePath" | "archiveBytes" | "archiveSha256" | "manifest" | "errorMessage" | "cancelRequested">;
    readonly BackupComponentFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "name" | "id" | "createdAt" | "updatedAt" | "error" | "type" | "status" | "startedAt" | "finishedAt" | "runId" | "bytes" | "durationMs", "name" | "id" | "createdAt" | "updatedAt" | "error" | "type" | "status" | "startedAt" | "finishedAt" | "runId" | "bytes" | "durationMs">;
    readonly BackupRunDestinationFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "error" | "status" | "startedAt" | "finishedAt" | "runId" | "destinationId" | "uploadedBytes" | "finalPath" | "archiveDeletedAt", "id" | "createdAt" | "updatedAt" | "error" | "status" | "startedAt" | "finishedAt" | "runId" | "destinationId" | "uploadedBytes" | "finalPath" | "archiveDeletedAt">;
    readonly BackupKeyFields: PothosSchemaTypes.EnumRef<PothosSchemaTypes.ExtendDefaultTypes<{
        Context: import("..").Context;
        AuthScopes: import("../../auth").AuthRoles;
        PrismaTypes: import("@local/prisma/dist/pothos").default;
        Scalars: import("..").Scalars;
    }>, "id" | "createdAt" | "updatedAt" | "algorithm" | "publicKey" | "privateKeyPath" | "fingerprint" | "active" | "acknowledged" | "acknowledgedAt" | "acknowledgedById" | "rotatedAt", "id" | "createdAt" | "updatedAt" | "algorithm" | "publicKey" | "privateKeyPath" | "fingerprint" | "active" | "acknowledged" | "acknowledgedAt" | "acknowledgedById" | "rotatedAt">;
    constructor(builder: SchemaBuilderService, backupArchiveService: BackupArchiveService);
}
