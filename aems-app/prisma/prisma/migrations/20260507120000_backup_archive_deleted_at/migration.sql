-- Record operator-initiated archive deletions so the UI can distinguish
-- "Removed" (intentional cleanup) from "Missing" (aged off / lost).
ALTER TABLE "BackupRunDestination"
    ADD COLUMN "archiveDeletedAt" TIMESTAMPTZ(6);
