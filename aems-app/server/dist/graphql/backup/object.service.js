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
exports.BackupObject = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const backup_archive_service_1 = require("../../services/backup/backup-archive.service");
let BackupObject = class BackupObject {
    constructor(builder, backupArchiveService) {
        this.BackupDestinationType = builder.enumType("BackupDestinationType", {
            values: Object.values(client_1.BackupDestinationType),
        });
        this.BackupRunStatus = builder.enumType("BackupRunStatus", {
            values: Object.values(client_1.BackupRunStatus),
        });
        this.BackupRunTrigger = builder.enumType("BackupRunTrigger", {
            values: Object.values(client_1.BackupRunTrigger),
        });
        this.BackupComponentType = builder.enumType("BackupComponentType", {
            values: Object.values(client_1.BackupComponentType),
        });
        this.BackupComponentStatus = builder.enumType("BackupComponentStatus", {
            values: Object.values(client_1.BackupComponentStatus),
        });
        this.BackupKeyAlgorithm = builder.enumType("BackupKeyAlgorithm", {
            values: Object.values(client_1.BackupKeyAlgorithm),
        });
        this.BackupArchiveAvailability = builder.enumType("BackupArchiveAvailability", {
            values: [...backup_archive_service_1.BackupArchiveAvailabilityValues],
        });
        this.BackupPolicyObject = builder.prismaObject("BackupPolicy", {
            authScopes: { admin: true },
            subscribe: (subscriptions, policy, _context, _info) => {
                subscriptions.register(`BackupPolicy/${policy.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                enabled: t.exposeBoolean("enabled"),
                cron: t.exposeString("cron"),
                retentionDays: t.exposeInt("retentionDays"),
                excludeVolumes: t.exposeStringList("excludeVolumes"),
                excludePaths: t.exposeStringList("excludePaths"),
                excludeServices: t.exposeStringList("excludeServices"),
                excludeEnvFiles: t.exposeStringList("excludeEnvFiles"),
                extraEnvFiles: t.exposeStringList("extraEnvFiles"),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                destinations: t.relation("destinations", { nullable: true }),
                runs: t.relation("runs", { nullable: true }),
            }),
        });
        this.BackupPolicyFields = builder.enumType("BackupPolicyFields", {
            values: Object.values(client_1.Prisma.BackupPolicyScalarFieldEnum),
        });
        this.BackupDestinationObject = builder.prismaObject("BackupDestination", {
            authScopes: { admin: true },
            subscribe: (subscriptions, destination, _context, _info) => {
                subscriptions.register(`BackupDestination/${destination.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                name: t.exposeString("name"),
                type: t.expose("type", { type: this.BackupDestinationType }),
                output: t.exposeString("output", { nullable: true }),
                enabled: t.exposeBoolean("enabled"),
                sseMode: t.exposeString("sseMode", { nullable: true }),
                sseKmsKeyId: t.exposeString("sseKmsKeyId", { nullable: true }),
                order: t.exposeInt("order"),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                policyId: t.exposeString("policyId"),
                policy: t.relation("policy"),
                runs: t.relation("runs", { nullable: true }),
            }),
        });
        this.BackupDestinationFields = builder.enumType("BackupDestinationFields", {
            values: Object.values(client_1.Prisma.BackupDestinationScalarFieldEnum),
        });
        this.BackupRunObject = builder.prismaObject("BackupRun", {
            authScopes: { admin: true },
            subscribe: (subscriptions, run, _context, _info) => {
                subscriptions.register(`BackupRun/${run.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                status: t.expose("status", { type: this.BackupRunStatus }),
                trigger: t.expose("trigger", { type: this.BackupRunTrigger }),
                keyFingerprint: t.exposeString("keyFingerprint", { nullable: true }),
                startedAt: t.expose("startedAt", { type: builder.DateTime, nullable: true }),
                finishedAt: t.expose("finishedAt", { type: builder.DateTime, nullable: true }),
                heartbeatAt: t.expose("heartbeatAt", { type: builder.DateTime, nullable: true }),
                archivePath: t.exposeString("archivePath", { nullable: true }),
                archiveBytes: t.string({
                    nullable: true,
                    resolve: (run) => run.archiveBytes == null ? null : run.archiveBytes.toString(),
                }),
                archiveSha256: t.exposeString("archiveSha256", { nullable: true }),
                manifest: t.expose("manifest", { type: builder.Json, nullable: true }),
                errorMessage: t.exposeString("errorMessage", { nullable: true }),
                cancelRequested: t.exposeBoolean("cancelRequested"),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                policyId: t.exposeString("policyId"),
                requestedById: t.exposeString("requestedById", { nullable: true }),
                policy: t.relation("policy"),
                requestedBy: t.relation("requestedBy", { nullable: true }),
                components: t.relation("components", { nullable: true }),
                destinations: t.relation("destinations", { nullable: true }),
                archiveAvailability: t.field({
                    type: this.BackupArchiveAvailability,
                    nullable: false,
                    resolve: (run) => backupArchiveService.getRunAvailability(run.id),
                }),
            }),
        });
        this.BackupRunFields = builder.enumType("BackupRunFields", {
            values: Object.values(client_1.Prisma.BackupRunScalarFieldEnum),
        });
        this.BackupComponentObject = builder.prismaObject("BackupComponent", {
            authScopes: { admin: true },
            fields: (t) => ({
                id: t.exposeString("id"),
                type: t.expose("type", { type: this.BackupComponentType }),
                name: t.exposeString("name"),
                status: t.expose("status", { type: this.BackupComponentStatus }),
                bytes: t.string({
                    nullable: true,
                    resolve: (c) => c.bytes == null ? null : c.bytes.toString(),
                }),
                durationMs: t.exposeInt("durationMs", { nullable: true }),
                error: t.exposeString("error", { nullable: true }),
                startedAt: t.expose("startedAt", { type: builder.DateTime, nullable: true }),
                finishedAt: t.expose("finishedAt", { type: builder.DateTime, nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                runId: t.exposeString("runId"),
                run: t.relation("run"),
            }),
        });
        this.BackupComponentFields = builder.enumType("BackupComponentFields", {
            values: Object.values(client_1.Prisma.BackupComponentScalarFieldEnum),
        });
        this.BackupRunDestinationObject = builder.prismaObject("BackupRunDestination", {
            authScopes: { admin: true },
            fields: (t) => ({
                id: t.exposeString("id"),
                status: t.expose("status", { type: this.BackupComponentStatus }),
                uploadedBytes: t.string({
                    nullable: true,
                    resolve: (rd) => rd.uploadedBytes == null ? null : rd.uploadedBytes.toString(),
                }),
                finalPath: t.exposeString("finalPath", { nullable: true }),
                archiveDeletedAt: t.expose("archiveDeletedAt", { type: builder.DateTime, nullable: true }),
                error: t.exposeString("error", { nullable: true }),
                availability: t.field({
                    type: this.BackupArchiveAvailability,
                    nullable: false,
                    resolve: (rd) => backupArchiveService.getAvailability(rd.id),
                }),
                startedAt: t.expose("startedAt", { type: builder.DateTime, nullable: true }),
                finishedAt: t.expose("finishedAt", { type: builder.DateTime, nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                runId: t.exposeString("runId"),
                destinationId: t.exposeString("destinationId"),
                run: t.relation("run"),
                destination: t.relation("destination"),
            }),
        });
        this.BackupRunDestinationFields = builder.enumType("BackupRunDestinationFields", {
            values: Object.values(client_1.Prisma.BackupRunDestinationScalarFieldEnum),
        });
        this.BackupKeyObject = builder.prismaObject("BackupKey", {
            authScopes: { admin: true },
            subscribe: (subscriptions, key, _context, _info) => {
                subscriptions.register(`BackupKey/${key.id}`);
            },
            fields: (t) => ({
                id: t.exposeString("id"),
                algorithm: t.expose("algorithm", { type: this.BackupKeyAlgorithm }),
                publicKey: t.exposeString("publicKey"),
                fingerprint: t.exposeString("fingerprint"),
                active: t.exposeBoolean("active"),
                acknowledged: t.exposeBoolean("acknowledged"),
                acknowledgedAt: t.expose("acknowledgedAt", { type: builder.DateTime, nullable: true }),
                rotatedAt: t.expose("rotatedAt", { type: builder.DateTime, nullable: true }),
                createdAt: t.expose("createdAt", { type: builder.DateTime }),
                updatedAt: t.expose("updatedAt", { type: builder.DateTime }),
                acknowledgedById: t.exposeString("acknowledgedById", { nullable: true }),
                acknowledgedBy: t.relation("acknowledgedBy", { nullable: true }),
            }),
        });
        this.BackupKeyFields = builder.enumType("BackupKeyFields", {
            values: Object.values(client_1.Prisma.BackupKeyScalarFieldEnum),
        });
        const discoveredServiceRef = builder.objectRef("BackupDiscoveredService");
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
        const discoveredVolumeRef = builder.objectRef("BackupDiscoveredVolume");
        this.BackupDiscoveredVolumeObject = discoveredVolumeRef.implement({
            authScopes: { admin: true },
            fields: (t) => ({
                name: t.exposeString("name"),
                services: t.exposeStringList("services"),
                autoExclude: t.exposeBoolean("autoExclude"),
                autoExcludeReason: t.exposeString("autoExcludeReason", { nullable: true }),
            }),
        });
        const discoveredPathRef = builder.objectRef("BackupDiscoveredPath");
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
        const discoveredEnvFileRef = builder.objectRef("BackupDiscoveredEnvFile");
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
        const discoveryRef = builder.objectRef("BackupDiscovery");
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
};
exports.BackupObject = BackupObject;
exports.BackupObject = BackupObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService, backup_archive_service_1.BackupArchiveService])
], BackupObject);
//# sourceMappingURL=object.service.js.map