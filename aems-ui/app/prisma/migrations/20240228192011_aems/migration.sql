/*
  Warnings:

  - The `type` column on the `Log` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Log_type" AS ENUM ('Banner', 'Trace', 'Debug', 'Info', 'Warn', 'Error', 'Fatal');

-- CreateEnum
CREATE TYPE "Stage_type" AS ENUM ('Create', 'Read', 'Update', 'Delete', 'Process', 'Complete', 'Fail');

-- CreateEnum
CREATE TYPE "Holiday_type" AS ENUM ('Enabled', 'Disabled', 'Custom');

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "type",
ADD COLUMN     "type" "Log_type";

-- DropEnum
DROP TYPE "enum_log";

-- CreateTable
CREATE TABLE "Units" (
    "id" SERIAL NOT NULL,
    "stage" "Stage_type" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(1024) NOT NULL,
    "campus" VARCHAR(1024) NOT NULL DEFAULT '',
    "building" VARCHAR(1024) NOT NULL DEFAULT '',
    "system" VARCHAR(1024) NOT NULL DEFAULT '',
    "timezone" VARCHAR(1024) NOT NULL DEFAULT 'local',
    "label" VARCHAR(1024) NOT NULL,
    "coolingCapacity" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "compressors" INTEGER NOT NULL DEFAULT 1,
    "coolingLockout" DOUBLE PRECISION NOT NULL DEFAULT 45,
    "optimalStartLockout" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "optimalStartDeviation" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "earliestStart" INTEGER NOT NULL DEFAULT 60,
    "latestStart" INTEGER NOT NULL DEFAULT 0,
    "zoneLocation" TEXT NOT NULL DEFAULT 'exterior',
    "zoneMass" TEXT NOT NULL DEFAULT 'medium',
    "zoneOrientation" TEXT NOT NULL DEFAULT 'north',
    "zoneBuilding" TEXT NOT NULL DEFAULT 'office',
    "heatPump" BOOLEAN NOT NULL DEFAULT true,
    "heatPumpBackup" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "economizer" BOOLEAN NOT NULL DEFAULT true,
    "heatPumpLockout" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "setpointPeakOffset" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "peakLoadExclude" BOOLEAN NOT NULL DEFAULT false,
    "economizerSetpoint" DOUBLE PRECISION NOT NULL DEFAULT 45,
    "configurationId" INTEGER,
    "controlId" INTEGER,

    CONSTRAINT "Units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configurations" (
    "id" SERIAL NOT NULL,
    "stage" "Stage_type" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "setpointId" INTEGER,
    "mondayScheduleId" INTEGER,
    "tuesdayScheduleId" INTEGER,
    "wednesdayScheduleId" INTEGER,
    "thursdayScheduleId" INTEGER,
    "fridayScheduleId" INTEGER,
    "saturdayScheduleId" INTEGER,
    "sundayScheduleId" INTEGER,
    "holidayScheduleId" INTEGER,

    CONSTRAINT "Configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occupancies" (
    "id" SERIAL NOT NULL,
    "stage" "Stage_type" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "scheduleId" INTEGER,
    "configurationId" INTEGER,

    CONSTRAINT "Occupancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedules" (
    "id" SERIAL NOT NULL,
    "stage" "Stage_type" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '08:00',
    "endTime" TEXT NOT NULL DEFAULT '18:00',
    "occupied" BOOLEAN NOT NULL DEFAULT true,
    "setpointId" INTEGER,

    CONSTRAINT "Schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setpoints" (
    "id" SERIAL NOT NULL,
    "stage" "Stage_type" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "setpoint" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "deadband" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "heating" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "cooling" DOUBLE PRECISION NOT NULL DEFAULT 80,

    CONSTRAINT "Setpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holidays" (
    "id" SERIAL NOT NULL,
    "stage" "Stage_type" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "type" "Holiday_type" NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "month" INTEGER,
    "day" INTEGER,
    "observance" TEXT,

    CONSTRAINT "Holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Controls" (
    "id" SERIAL NOT NULL,
    "stage" "Stage_type" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(1024) NOT NULL,
    "campus" VARCHAR(1024) NOT NULL DEFAULT '',
    "building" VARCHAR(1024) NOT NULL DEFAULT '',
    "label" VARCHAR(1024) NOT NULL,
    "peakLoadExclude" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConfigurationsToHolidays" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "Units_label_idx" ON "Units"("label");

-- CreateIndex
CREATE INDEX "Units_stage_idx" ON "Units"("stage");

-- CreateIndex
CREATE INDEX "Configurations_label_idx" ON "Configurations"("label");

-- CreateIndex
CREATE INDEX "Configurations_stage_idx" ON "Configurations"("stage");

-- CreateIndex
CREATE INDEX "Occupancies_date_idx" ON "Occupancies"("date");

-- CreateIndex
CREATE INDEX "Occupancies_stage_idx" ON "Occupancies"("stage");

-- CreateIndex
CREATE INDEX "Schedules_label_idx" ON "Schedules"("label");

-- CreateIndex
CREATE INDEX "Schedules_stage_idx" ON "Schedules"("stage");

-- CreateIndex
CREATE INDEX "Setpoints_label_idx" ON "Setpoints"("label");

-- CreateIndex
CREATE INDEX "Setpoints_stage_idx" ON "Setpoints"("stage");

-- CreateIndex
CREATE INDEX "Holidays_label_idx" ON "Holidays"("label");

-- CreateIndex
CREATE INDEX "Holidays_stage_idx" ON "Holidays"("stage");

-- CreateIndex
CREATE INDEX "Controls_label_idx" ON "Controls"("label");

-- CreateIndex
CREATE INDEX "Controls_stage_idx" ON "Controls"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "_ConfigurationsToHolidays_AB_unique" ON "_ConfigurationsToHolidays"("A", "B");

-- CreateIndex
CREATE INDEX "_ConfigurationsToHolidays_B_index" ON "_ConfigurationsToHolidays"("B");

-- AddForeignKey
ALTER TABLE "Units" ADD CONSTRAINT "Units_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Units" ADD CONSTRAINT "Units_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurations" ADD CONSTRAINT "Configurations_setpointId_fkey" FOREIGN KEY ("setpointId") REFERENCES "Setpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurations" ADD CONSTRAINT "Configurations_mondayScheduleId_fkey" FOREIGN KEY ("mondayScheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurations" ADD CONSTRAINT "Configurations_tuesdayScheduleId_fkey" FOREIGN KEY ("tuesdayScheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurations" ADD CONSTRAINT "Configurations_wednesdayScheduleId_fkey" FOREIGN KEY ("wednesdayScheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurations" ADD CONSTRAINT "Configurations_thursdayScheduleId_fkey" FOREIGN KEY ("thursdayScheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurations" ADD CONSTRAINT "Configurations_fridayScheduleId_fkey" FOREIGN KEY ("fridayScheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurations" ADD CONSTRAINT "Configurations_saturdayScheduleId_fkey" FOREIGN KEY ("saturdayScheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurations" ADD CONSTRAINT "Configurations_sundayScheduleId_fkey" FOREIGN KEY ("sundayScheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurations" ADD CONSTRAINT "Configurations_holidayScheduleId_fkey" FOREIGN KEY ("holidayScheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occupancies" ADD CONSTRAINT "Occupancies_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occupancies" ADD CONSTRAINT "Occupancies_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedules" ADD CONSTRAINT "Schedules_setpointId_fkey" FOREIGN KEY ("setpointId") REFERENCES "Setpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConfigurationsToHolidays" ADD CONSTRAINT "_ConfigurationsToHolidays_A_fkey" FOREIGN KEY ("A") REFERENCES "Configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConfigurationsToHolidays" ADD CONSTRAINT "_ConfigurationsToHolidays_B_fkey" FOREIGN KEY ("B") REFERENCES "Holidays"("id") ON DELETE CASCADE ON UPDATE CASCADE;
