/*
  Warnings:

  - You are about to drop the column `scope` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "scope",
ADD COLUMN     "role" VARCHAR(512);
