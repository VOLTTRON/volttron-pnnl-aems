-- CreateEnum
CREATE TYPE "enum_mutation" AS ENUM ('Create', 'Update', 'Delete', 'Upsert');

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_assigneeId_fkey";

-- CreateTable
CREATE TABLE "Change" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "table" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mutation" "enum_mutation" NOT NULL,
    "data" JSONB NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Change_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Change_table_idx" ON "Change"("table");

-- CreateIndex
CREATE INDEX "Change_key_idx" ON "Change"("key");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Change" ADD CONSTRAINT "Change_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
