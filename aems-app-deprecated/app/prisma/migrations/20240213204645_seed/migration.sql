-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "enum_log" ADD VALUE 'Trace';
ALTER TYPE "enum_log" ADD VALUE 'Debug';
ALTER TYPE "enum_log" ADD VALUE 'Fatal';

-- CreateTable
CREATE TABLE "Seed" (
    "filename" VARCHAR(1024) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Seed_filename_key" ON "Seed"("filename");
