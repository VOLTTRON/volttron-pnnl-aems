import {
  Prisma,
  BackupDestinationType,
  BackupRunStatus,
  BackupRunTrigger,
  BackupComponentType,
  BackupComponentStatus,
  BackupKeyAlgorithm,
} from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";
import {
  BackupDiscoveredEnvFile,
  BackupDiscoveredPath,
  BackupDiscoveredService,
  BackupDiscoveredVolume,
  BackupDiscovery,
} from "@/services/backup/backup-discovery.service";
import {
  BackupArchiveService,
  BackupArchiveAvailabilityValues,
} from "@/services/backup/backup-archive.service";

@Injectable()
@PothosObject()
export class BackupObject {
  readonly BackupDestinationType;
  readonly BackupRunStatus;
  readonly BackupRunTrigger;
  readonly BackupComponentType;
  readonly BackupComponentStatus;
  readonly BackupKeyAlgorithm;
  readonly BackupArchiveAvailability;

  readonly BackupPolicyObject;
  readonly BackupDestinationObject;
  readonly BackupRunObject;
  readonly BackupComponentObject;
  readonly BackupRunDestinationObject;
  readonly BackupKeyObject;

  readonly BackupDiscoveredServiceObject;
  readonly BackupDiscoveredVolumeObject;
  readonly BackupDiscoveredPathObject;
  readonly BackupDiscoveredEnvFileObject;
  readonly BackupDiscoveryObject;

  readonly BackupPolicyFields;
  readonly BackupDestinationFields;
  readonly BackupRunFields;
  readonly BackupComponentFields;
  readonly BackupRunDestinationFields;
  readonly BackupKeyFields;

  constructor(builder: SchemaBuilderService, backupArchiveService: BackupArchiveService) {
    this.BackupDestinationType = builder.enumType("BackupDestinationType", {
      values: Object.values(BackupDestinationType),
    });
    this.BackupRunStatus = builder.enumType("BackupRunStatus", {
      values: Object.values(BackupRunStatus),
    });
    this.BackupRunTrigger = builder.enumType("BackupRunTrigger", {
      values: Object.values(BackupRunTrigger),
    });
    this.BackupComponentType = builder.enumType("BackupComponentType", {
      values: Object.values(BackupComponentType),
    });
    this.BackupComponentStatus = builder.enumType("BackupComponentStatus", {
      values: Object.values(BackupComponentStatus),
    });
    this.BackupKeyAlgorithm = builder.enumType("BackupKeyAlgorithm", {
      values: Object.values(BackupKeyAlgorithm),
    });
    this.BackupArchiveAvailability = builder.enumType("BackupArchiveAvailability", {
      values: [...BackupArchiveAvailabilityValues],
    });

    this.BackupPolicyObject = builder.prismaObject("BackupPolicy", {
      authScopes: { admin: true },
      subscribe: (subscriptions, policy, _context, _info) => {
        subscriptions.register(`BackupPolicy/${policy.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        enabled: t.exposeBoolean("enabled"),
        cron: t.exposeString("cron"),
        retentionDays: t.exposeInt("retentionDays"),
        excludeVolumes: t.exposeStringList("excludeVolumes"),
        excludePaths: t.exposeStringList("excludePaths"),
        excludeServices: t.exposeStringList("excludeServices"),
        excludeEnvFiles: t.exposeStringList("excludeEnvFiles"),
        extraEnvFiles: t.exposeStringList("extraEnvFiles"),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // indirect relations
        destinations: t.relation("destinations", { nullable: true }),
        runs: t.relation("runs", { nullable: true }),
      }),
    });
    this.BackupPolicyFields = builder.enumType("BackupPolicyFields", {
      values: Object.values(Prisma.BackupPolicyScalarFieldEnum),
    });

    this.BackupDestinationObject = builder.prismaObject("BackupDestination", {
      authScopes: { admin: true },
      subscribe: (subscriptions, destination, _context, _info) => {
        subscriptions.register(`BackupDestination/${destination.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        name: t.exposeString("name"),
        type: t.expose("type", { type: this.BackupDestinationType }),
        output: t.exposeString("output", { nullable: true }),
        enabled: t.exposeBoolean("enabled"),
        sseMode: t.exposeString("sseMode", { nullable: true }),
        sseKmsKeyId: t.exposeString("sseKmsKeyId", { nullable: true }),
        order: t.exposeInt("order"),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // foreign keys
        policyId: t.exposeString("policyId"),
        // direct relations
        policy: t.relation("policy"),
        // indirect relations
        runs: t.relation("runs", { nullable: true }),
      }),
    });
    this.BackupDestinationFields = builder.enumType("BackupDestinationFields", {
      values: Object.values(Prisma.BackupDestinationScalarFieldEnum),
    });

    this.BackupRunObject = builder.prismaObject("BackupRun", {
      authScopes: { admin: true },
      subscribe: (subscriptions, run, _context, _info) => {
        subscriptions.register(`BackupRun/${run.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        status: t.expose("status", { type: this.BackupRunStatus }),
        trigger: t.expose("trigger", { type: this.BackupRunTrigger }),
        keyFingerprint: t.exposeString("keyFingerprint", { nullable: true }),
        startedAt: t.expose("startedAt", { type: builder.DateTime, nullable: true }),
        finishedAt: t.expose("finishedAt", { type: builder.DateTime, nullable: true }),
        heartbeatAt: t.expose("heartbeatAt", { type: builder.DateTime, nullable: true }),
        archivePath: t.exposeString("archivePath", { nullable: true }),
        // BigInt byte counts are surfaced as Strings (to avoid a bespoke scalar)
        // using a typed resolver with a Pick on the row shape.
        archiveBytes: t.string({
          nullable: true,
          resolve: (run: Pick<Prisma.BackupRunGetPayload<object>, "archiveBytes">) =>
            run.archiveBytes == null ? null : run.archiveBytes.toString(),
        }),
        archiveSha256: t.exposeString("archiveSha256", { nullable: true }),
        manifest: t.expose("manifest", { type: builder.Json, nullable: true }),
        errorMessage: t.exposeString("errorMessage", { nullable: true }),
        cancelRequested: t.exposeBoolean("cancelRequested"),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // foreign keys
        policyId: t.exposeString("policyId"),
        requestedById: t.exposeString("requestedById", { nullable: true }),
        // direct relations
        policy: t.relation("policy"),
        requestedBy: t.relation("requestedBy", { nullable: true }),
        // indirect relations
        components: t.relation("components", { nullable: true }),
        destinations: t.relation("destinations", { nullable: true }),
        // Aggregate archive availability across every destination for this
        // run: Available if any destination still has the file, Removed if
        // every destination was intentionally cleaned up, Missing otherwise
        // (including runs with no destinations).
        archiveAvailability: t.field({
          type: this.BackupArchiveAvailability,
          nullable: false,
          resolve: (run: Pick<Prisma.BackupRunGetPayload<object>, "id">) =>
            backupArchiveService.getRunAvailability(run.id),
        }),
      }),
    });
    this.BackupRunFields = builder.enumType("BackupRunFields", {
      values: Object.values(Prisma.BackupRunScalarFieldEnum),
    });

    this.BackupComponentObject = builder.prismaObject("BackupComponent", {
      authScopes: { admin: true },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        type: t.expose("type", { type: this.BackupComponentType }),
        name: t.exposeString("name"),
        status: t.expose("status", { type: this.BackupComponentStatus }),
        bytes: t.string({
          nullable: true,
          resolve: (c: Pick<Prisma.BackupComponentGetPayload<object>, "bytes">) =>
            c.bytes == null ? null : c.bytes.toString(),
        }),
        durationMs: t.exposeInt("durationMs", { nullable: true }),
        error: t.exposeString("error", { nullable: true }),
        startedAt: t.expose("startedAt", { type: builder.DateTime, nullable: true }),
        finishedAt: t.expose("finishedAt", { type: builder.DateTime, nullable: true }),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // foreign keys
        runId: t.exposeString("runId"),
        // direct relations
        run: t.relation("run"),
      }),
    });
    this.BackupComponentFields = builder.enumType("BackupComponentFields", {
      values: Object.values(Prisma.BackupComponentScalarFieldEnum),
    });

    this.BackupRunDestinationObject = builder.prismaObject("BackupRunDestination", {
      authScopes: { admin: true },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        status: t.expose("status", { type: this.BackupComponentStatus }),
        uploadedBytes: t.string({
          nullable: true,
          resolve: (rd: Pick<Prisma.BackupRunDestinationGetPayload<object>, "uploadedBytes">) =>
            rd.uploadedBytes == null ? null : rd.uploadedBytes.toString(),
        }),
        finalPath: t.exposeString("finalPath", { nullable: true }),
        // Set when an operator deleted the archive through the admin UI;
        // null for archives that are still there or have gone missing on
        // their own. Used together with `availability` to distinguish
        // Removed from Missing.
        archiveDeletedAt: t.expose("archiveDeletedAt", { type: builder.DateTime, nullable: true }),
        error: t.exposeString("error", { nullable: true }),
        // Tri-state availability resolved on demand by BackupArchiveService:
        //   Removed   - archiveDeletedAt is set (operator cleanup).
        //   Missing   - file not found at destination (aged off or lost).
        //   Available - file confirmed present via fs.access / S3 HeadObject.
        availability: t.field({
          type: this.BackupArchiveAvailability,
          nullable: false,
          resolve: (rd: Pick<Prisma.BackupRunDestinationGetPayload<object>, "id">) =>
            backupArchiveService.getAvailability(rd.id),
        }),
        startedAt: t.expose("startedAt", { type: builder.DateTime, nullable: true }),
        finishedAt: t.expose("finishedAt", { type: builder.DateTime, nullable: true }),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // foreign keys
        runId: t.exposeString("runId"),
        destinationId: t.exposeString("destinationId"),
        // direct relations
        run: t.relation("run"),
        destination: t.relation("destination"),
      }),
    });
    this.BackupRunDestinationFields = builder.enumType("BackupRunDestinationFields", {
      values: Object.values(Prisma.BackupRunDestinationScalarFieldEnum),
    });

    this.BackupKeyObject = builder.prismaObject("BackupKey", {
      authScopes: { admin: true },
      subscribe: (subscriptions, key, _context, _info) => {
        subscriptions.register(`BackupKey/${key.id}`);
      },
      fields: (t) => ({
        // key
        id: t.exposeString("id"),
        // fields
        algorithm: t.expose("algorithm", { type: this.BackupKeyAlgorithm }),
        publicKey: t.exposeString("publicKey"),
        fingerprint: t.exposeString("fingerprint"),
        active: t.exposeBoolean("active"),
        acknowledged: t.exposeBoolean("acknowledged"),
        acknowledgedAt: t.expose("acknowledgedAt", { type: builder.DateTime, nullable: true }),
        rotatedAt: t.expose("rotatedAt", { type: builder.DateTime, nullable: true }),
        // metadata
        createdAt: t.expose("createdAt", { type: builder.DateTime }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
        // foreign keys
        acknowledgedById: t.exposeString("acknowledgedById", { nullable: true }),
        // direct relations
        acknowledgedBy: t.relation("acknowledgedBy", { nullable: true }),
      }),
    });
    this.BackupKeyFields = builder.enumType("BackupKeyFields", {
      values: Object.values(Prisma.BackupKeyScalarFieldEnum),
    });

    // --- Discovery types (non-Prisma) ---------------------------------
    const discoveredServiceRef = builder.objectRef<BackupDiscoveredService>("BackupDiscoveredService");
    this.BackupDiscoveredServiceObject = discoveredServiceRef.implement({
      authScopes: { admin: true },
      fields: (t) => ({
        name: t.exposeString("name"),
        hasVolume: t.exposeBoolean("hasVolume"),
        image: t.exposeString("image", { nullable: true }),
        engine: t.expose("engine", { type: this.BackupComponentType, nullable: true }),
        imageFamily: t.exposeString("imageFamily", { nullable: true }),
        backupStrategy: t.exposeString("backupStrategy", { nullable: true }),
        autoExclude: t.exposeBoolean("autoExclude"),
        autoExcludeReason: t.exposeString("autoExcludeReason", { nullable: true }),
      }),
    });

    const discoveredVolumeRef = builder.objectRef<BackupDiscoveredVolume>("BackupDiscoveredVolume");
    this.BackupDiscoveredVolumeObject = discoveredVolumeRef.implement({
      authScopes: { admin: true },
      fields: (t) => ({
        name: t.exposeString("name"),
        services: t.exposeStringList("services"),
        autoExclude: t.exposeBoolean("autoExclude"),
        autoExcludeReason: t.exposeString("autoExcludeReason", { nullable: true }),
      }),
    });

    const discoveredPathRef = builder.objectRef<BackupDiscoveredPath>("BackupDiscoveredPath");
    this.BackupDiscoveredPathObject = discoveredPathRef.implement({
      authScopes: { admin: true },
      fields: (t) => ({
        path: t.exposeString("path"),
        type: t.exposeString("type"),
        services: t.exposeStringList("services"),
        autoExclude: t.exposeBoolean("autoExclude"),
        autoExcludeReason: t.exposeString("autoExcludeReason", { nullable: true }),
      }),
    });

    const discoveredEnvFileRef = builder.objectRef<BackupDiscoveredEnvFile>("BackupDiscoveredEnvFile");
    this.BackupDiscoveredEnvFileObject = discoveredEnvFileRef.implement({
      authScopes: { admin: true },
      fields: (t) => ({
        path: t.exposeString("path"),
        exists: t.exposeBoolean("exists"),
        source: t.exposeString("source"),
        autoExclude: t.exposeBoolean("autoExclude"),
        autoExcludeReason: t.exposeString("autoExcludeReason", { nullable: true }),
      }),
    });

    const discoveryRef = builder.objectRef<BackupDiscovery>("BackupDiscovery");
    this.BackupDiscoveryObject = discoveryRef.implement({
      authScopes: { admin: true },
      fields: (t) => ({
        services: t.field({ type: [discoveredServiceRef], resolve: (d) => d.services }),
        volumes: t.field({ type: [discoveredVolumeRef], resolve: (d) => d.volumes }),
        paths: t.field({ type: [discoveredPathRef], resolve: (d) => d.paths }),
        envFiles: t.field({ type: [discoveredEnvFileRef], resolve: (d) => d.envFiles }),
      }),
    });
  }
}
