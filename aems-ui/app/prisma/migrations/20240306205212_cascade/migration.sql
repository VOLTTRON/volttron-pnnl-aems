-- DropForeignKey
ALTER TABLE "Units" DROP CONSTRAINT "Units_configurationId_fkey";

-- DropForeignKey
ALTER TABLE "Units" DROP CONSTRAINT "Units_controlId_fkey";

-- AddForeignKey
ALTER TABLE "Units" ADD CONSTRAINT "Units_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Units" ADD CONSTRAINT "Units_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Controls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
