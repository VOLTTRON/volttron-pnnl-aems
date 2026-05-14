-- Drop BackupRunDestination rows that reference Share destinations. The FK is
-- ON DELETE RESTRICT, so these must go first.
DELETE FROM "BackupRunDestination"
WHERE "destinationId" IN (
    SELECT "id" FROM "BackupDestination" WHERE "type" = 'Share'
);

-- Remove the Share destinations themselves.
DELETE FROM "BackupDestination" WHERE "type" = 'Share';

-- Drop the Share value from the enum by rename-swap (Postgres has no
-- `ALTER TYPE ... DROP VALUE`).
ALTER TYPE "BackupDestinationType" RENAME TO "BackupDestinationType_old";
CREATE TYPE "BackupDestinationType" AS ENUM ('Local', 'S3');
ALTER TABLE "BackupDestination"
    ALTER COLUMN "type" TYPE "BackupDestinationType"
    USING "type"::text::"BackupDestinationType";
DROP TYPE "BackupDestinationType_old";

-- Local destinations target the default `backup-archives` docker volume and
-- no longer carry an operator-configured path.
ALTER TABLE "BackupDestination" ALTER COLUMN "output" DROP NOT NULL;
