/*
  Warnings:

  - You are about to drop the column `setpointPeakOffset` on the `Units` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Units" DROP COLUMN "setpointPeakOffset",
ADD COLUMN     "coolingPeakOffset" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "heatingPeakOffset" DOUBLE PRECISION NOT NULL DEFAULT -0.5;
