-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "override" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overridePostEndTime" TEXT NOT NULL DEFAULT '24:00',
ADD COLUMN     "overridePostStartTime" TEXT NOT NULL DEFAULT '24:00',
ADD COLUMN     "overridePreEndTime" TEXT NOT NULL DEFAULT '00:00',
ADD COLUMN     "overridePreStartTime" TEXT NOT NULL DEFAULT '00:00';

-- AlterTable
ALTER TABLE "Setpoint" ADD COLUMN     "overrideDeadband" DOUBLE PRECISION NOT NULL DEFAULT 4,
ADD COLUMN     "overrideSetpoint" DOUBLE PRECISION NOT NULL DEFAULT 70;
