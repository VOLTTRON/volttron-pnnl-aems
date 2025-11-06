-- CreateEnum
CREATE TYPE "ChangeMutation" AS ENUM ('Create', 'Update', 'Delete', 'Upsert');

-- CreateEnum
CREATE TYPE "ModelStage" AS ENUM ('Create', 'Read', 'Update', 'Delete', 'Process', 'Complete', 'Fail');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('Enabled', 'Disabled', 'Custom');

-- DropIndex
DROP INDEX "geography_geometry";

-- CreateTable
CREATE TABLE "Change" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "table" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mutation" "ChangeMutation" NOT NULL,
    "data" JSONB,
    "userId" TEXT,

    CONSTRAINT "Change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL,
    "stage" "ModelStage" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "setpointId" TEXT,
    "mondayScheduleId" TEXT,
    "tuesdayScheduleId" TEXT,
    "wednesdayScheduleId" TEXT,
    "thursdayScheduleId" TEXT,
    "fridayScheduleId" TEXT,
    "saturdayScheduleId" TEXT,
    "sundayScheduleId" TEXT,
    "holidayScheduleId" TEXT,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Control" (
    "id" TEXT NOT NULL,
    "stage" "ModelStage" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(1024) NOT NULL,
    "campus" VARCHAR(1024) NOT NULL DEFAULT '',
    "building" VARCHAR(1024) NOT NULL DEFAULT '',
    "label" VARCHAR(1024) NOT NULL,
    "peakLoadExclude" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "stage" "ModelStage" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "type" "HolidayType" NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "month" INTEGER,
    "day" INTEGER,
    "observance" TEXT,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(1024) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occupancy" (
    "id" TEXT NOT NULL,
    "stage" "ModelStage" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "scheduleId" TEXT,
    "configurationId" TEXT,

    CONSTRAINT "Occupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "stage" "ModelStage" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '08:00',
    "endTime" TEXT NOT NULL DEFAULT '18:00',
    "occupied" BOOLEAN NOT NULL DEFAULT true,
    "setpointId" TEXT,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setpoint" (
    "id" TEXT NOT NULL,
    "stage" "ModelStage" NOT NULL DEFAULT 'Create',
    "message" VARCHAR(1024),
    "correlation" VARCHAR(1024),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "label" VARCHAR(1024) NOT NULL,
    "setpoint" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "deadband" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "heating" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "cooling" DOUBLE PRECISION NOT NULL DEFAULT 80,

    CONSTRAINT "Setpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "stage" "ModelStage" NOT NULL DEFAULT 'Create',
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
    "heatPumpBackup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "economizer" BOOLEAN NOT NULL DEFAULT true,
    "heatPumpLockout" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "coolingPeakOffset" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "heatingPeakOffset" DOUBLE PRECISION NOT NULL DEFAULT -0.5,
    "peakLoadExclude" BOOLEAN NOT NULL DEFAULT false,
    "economizerSetpoint" DOUBLE PRECISION NOT NULL DEFAULT 45,
    "configurationId" TEXT,
    "controlId" TEXT,
    "locationId" TEXT,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConfigurationToHoliday" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ConfigurationToHoliday_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_Units_users" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Units_users_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Change_table_idx" ON "Change"("table");

-- CreateIndex
CREATE INDEX "Change_key_idx" ON "Change"("key");

-- CreateIndex
CREATE INDEX "Configuration_label_idx" ON "Configuration"("label");

-- CreateIndex
CREATE INDEX "Configuration_stage_idx" ON "Configuration"("stage");

-- CreateIndex
CREATE INDEX "Control_label_idx" ON "Control"("label");

-- CreateIndex
CREATE INDEX "Control_stage_idx" ON "Control"("stage");

-- CreateIndex
CREATE INDEX "Holiday_label_idx" ON "Holiday"("label");

-- CreateIndex
CREATE INDEX "Holiday_stage_idx" ON "Holiday"("stage");

-- CreateIndex
CREATE INDEX "Occupancy_date_idx" ON "Occupancy"("date");

-- CreateIndex
CREATE INDEX "Occupancy_stage_idx" ON "Occupancy"("stage");

-- CreateIndex
CREATE INDEX "Schedule_label_idx" ON "Schedule"("label");

-- CreateIndex
CREATE INDEX "Schedule_stage_idx" ON "Schedule"("stage");

-- CreateIndex
CREATE INDEX "Setpoint_label_idx" ON "Setpoint"("label");

-- CreateIndex
CREATE INDEX "Setpoint_stage_idx" ON "Setpoint"("stage");

-- CreateIndex
CREATE INDEX "Unit_label_idx" ON "Unit"("label");

-- CreateIndex
CREATE INDEX "Unit_stage_idx" ON "Unit"("stage");

-- CreateIndex
CREATE INDEX "_ConfigurationToHoliday_B_index" ON "_ConfigurationToHoliday"("B");

-- CreateIndex
CREATE INDEX "_Units_users_B_index" ON "_Units_users"("B");

-- CreateIndex
CREATE INDEX "geography_geometry" ON "Geography"("geometry");

-- AddForeignKey
ALTER TABLE "Change" ADD CONSTRAINT "Change_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_setpointId_fkey" FOREIGN KEY ("setpointId") REFERENCES "Setpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_mondayScheduleId_fkey" FOREIGN KEY ("mondayScheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_tuesdayScheduleId_fkey" FOREIGN KEY ("tuesdayScheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_wednesdayScheduleId_fkey" FOREIGN KEY ("wednesdayScheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_thursdayScheduleId_fkey" FOREIGN KEY ("thursdayScheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_fridayScheduleId_fkey" FOREIGN KEY ("fridayScheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_saturdayScheduleId_fkey" FOREIGN KEY ("saturdayScheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_sundayScheduleId_fkey" FOREIGN KEY ("sundayScheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_holidayScheduleId_fkey" FOREIGN KEY ("holidayScheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_setpointId_fkey" FOREIGN KEY ("setpointId") REFERENCES "Setpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConfigurationToHoliday" ADD CONSTRAINT "_ConfigurationToHoliday_A_fkey" FOREIGN KEY ("A") REFERENCES "Configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConfigurationToHoliday" ADD CONSTRAINT "_ConfigurationToHoliday_B_fkey" FOREIGN KEY ("B") REFERENCES "Holiday"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Units_users" ADD CONSTRAINT "_Units_users_A_fkey" FOREIGN KEY ("A") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Units_users" ADD CONSTRAINT "_Units_users_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
