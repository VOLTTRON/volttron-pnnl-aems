-- Change Feedback.assignee onDelete from Cascade to SetNull, so deleting a
-- user who was assigned feedback leaves the feedback with a null assignee
-- rather than deleting the row.

ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_assigneeId_fkey";

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
