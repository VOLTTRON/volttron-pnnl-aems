-- CreateEnum
CREATE TYPE "BackupDestinationType" AS ENUM ('Local', 'Share', 'S3');

-- CreateEnum
CREATE TYPE "BackupRunStatus" AS ENUM ('Queued', 'Running', 'Success', 'Failed', 'Cancelled');

-- CreateEnum
CREATE TYPE "BackupRunTrigger" AS ENUM ('Scheduled', 'Manual', 'Retry', 'Test');

-- CreateEnum
CREATE TYPE "BackupComponentType" AS ENUM ('Postgres', 'MariaDB', 'Volume', 'Path', 'File');

-- CreateEnum
CREATE TYPE "BackupComponentStatus" AS ENUM ('Pending', 'Running', 'Success', 'Failed', 'Skipped');

-- CreateEnum
CREATE TYPE "BackupKeyAlgorithm" AS ENUM ('Age', 'Gpg');

-- CreateTable
CREATE TABLE "BackupPolicy" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "cron" TEXT NOT NULL DEFAULT '0 2 * * *',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "excludeVolumes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludePaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludeServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludeEnvFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extraEnvFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BackupPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupDestination" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BackupDestinationType" NOT NULL,
    "output" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sseMode" TEXT,
    "sseKmsKeyId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BackupDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRun" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "status" "BackupRunStatus" NOT NULL DEFAULT 'Queued',
    "trigger" "BackupRunTrigger" NOT NULL,
    "requestedById" TEXT,
    "keyFingerprint" TEXT,
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),
    "heartbeatAt" TIMESTAMPTZ(6),
    "archivePath" TEXT,
    "archiveBytes" BIGINT,
    "archiveSha256" TEXT,
    "manifest" JSONB,
    "errorMessage" TEXT,
    "cancelRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BackupRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupComponent" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "type" "BackupComponentType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "BackupComponentStatus" NOT NULL DEFAULT 'Pending',
    "bytes" BIGINT,
    "durationMs" INTEGER,
    "error" TEXT,
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BackupComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRunDestination" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "status" "BackupComponentStatus" NOT NULL DEFAULT 'Pending',
    "uploadedBytes" BIGINT,
    "finalPath" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BackupRunDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupKey" (
    "id" TEXT NOT NULL,
    "algorithm" "BackupKeyAlgorithm" NOT NULL DEFAULT 'Age',
    "publicKey" TEXT NOT NULL,
    "privateKeyPath" TEXT,
    "fingerprint" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMPTZ(6),
    "acknowledgedById" TEXT,
    "rotatedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BackupKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupDestination_policyId_idx" ON "BackupDestination"("policyId");

-- CreateIndex
CREATE INDEX "BackupDestination_type_idx" ON "BackupDestination"("type");

-- CreateIndex
CREATE INDEX "BackupRun_status_idx" ON "BackupRun"("status");

-- CreateIndex
CREATE INDEX "BackupRun_policyId_idx" ON "BackupRun"("policyId");

-- CreateIndex
CREATE INDEX "BackupRun_createdAt_idx" ON "BackupRun"("createdAt");

-- CreateIndex
CREATE INDEX "BackupRun_finishedAt_idx" ON "BackupRun"("finishedAt");

-- CreateIndex
CREATE INDEX "BackupComponent_runId_idx" ON "BackupComponent"("runId");

-- CreateIndex
CREATE INDEX "BackupComponent_status_idx" ON "BackupComponent"("status");

-- CreateIndex
CREATE INDEX "BackupRunDestination_runId_idx" ON "BackupRunDestination"("runId");

-- CreateIndex
CREATE INDEX "BackupRunDestination_destinationId_idx" ON "BackupRunDestination"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "BackupKey_fingerprint_key" ON "BackupKey"("fingerprint");

-- CreateIndex
CREATE INDEX "BackupKey_active_idx" ON "BackupKey"("active");

-- CreateIndex
CREATE INDEX "BackupKey_acknowledged_idx" ON "BackupKey"("acknowledged");

-- AddForeignKey
ALTER TABLE "BackupDestination" ADD CONSTRAINT "BackupDestination_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "BackupPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRun" ADD CONSTRAINT "BackupRun_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "BackupPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRun" ADD CONSTRAINT "BackupRun_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupComponent" ADD CONSTRAINT "BackupComponent_runId_fkey" FOREIGN KEY ("runId") REFERENCES "BackupRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRunDestination" ADD CONSTRAINT "BackupRunDestination_runId_fkey" FOREIGN KEY ("runId") REFERENCES "BackupRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRunDestination" ADD CONSTRAINT "BackupRunDestination_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "BackupDestination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupKey" ADD CONSTRAINT "BackupKey_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
