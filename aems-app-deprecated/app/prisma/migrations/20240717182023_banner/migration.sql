/*
  Warnings:

  - The values [Banner] on the enum `enum_log` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `expiration` on the `Log` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "enum_log_new" AS ENUM ('Trace', 'Debug', 'Info', 'Warn', 'Error', 'Fatal');
ALTER TABLE "Log" ALTER COLUMN "type" TYPE "enum_log_new" USING ("type"::text::"enum_log_new");
ALTER TYPE "enum_log" RENAME TO "enum_log_old";
ALTER TYPE "enum_log_new" RENAME TO "enum_log";
DROP TYPE "enum_log_old";
COMMIT;

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "expiration";

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "message" VARCHAR(1024),
    "expiration" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BannerToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BannerToUser_AB_unique" ON "_BannerToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_BannerToUser_B_index" ON "_BannerToUser"("B");

-- AddForeignKey
ALTER TABLE "_BannerToUser" ADD CONSTRAINT "_BannerToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BannerToUser" ADD CONSTRAINT "_BannerToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
