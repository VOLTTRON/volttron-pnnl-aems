
-- CreateIndex
CREATE INDEX "accounts_createdAt" ON "Account"("createdAt");

-- CreateIndex
CREATE INDEX "accounts_updatedAt" ON "Account"("updatedAt");

-- CreateIndex
CREATE INDEX "accounts_userId" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Banner_expiration_idx" ON "Banner"("expiration");

-- CreateIndex
CREATE INDEX "Banner_createdAt_idx" ON "Banner"("createdAt");

-- CreateIndex
CREATE INDEX "Banner_updatedAt_idx" ON "Banner"("updatedAt");

-- CreateIndex
CREATE INDEX "events_topic" ON "Event"("topic");

-- CreateIndex
CREATE INDEX "events_createdAt" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "events_updatedAt" ON "Event"("updatedAt");

-- CreateIndex
CREATE INDEX "feedback_status" ON "Feedback"("status");

-- CreateIndex
CREATE INDEX "feedback_createdAt" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "feedback_updatedAt" ON "Feedback"("updatedAt");

-- CreateIndex
CREATE INDEX "feedback_userId" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "feedback_assigneeId" ON "Feedback"("assigneeId");

-- CreateIndex
CREATE INDEX "files_mimeType" ON "File"("mimeType");

-- CreateIndex
CREATE INDEX "files_createdAt" ON "File"("createdAt");

-- CreateIndex
CREATE INDEX "files_updatedAt" ON "File"("updatedAt");

-- CreateIndex
CREATE INDEX "files_userId" ON "File"("userId");

-- CreateIndex
CREATE INDEX "files_feedbackId" ON "File"("feedbackId");

-- CreateIndex
CREATE INDEX "geography_createdAt" ON "Geography"("createdAt");

-- CreateIndex
CREATE INDEX "geography_updatedAt" ON "Geography"("updatedAt");

-- CreateIndex
CREATE INDEX "logs_type" ON "Log"("type");

-- CreateIndex
CREATE INDEX "logs_createdAt" ON "Log"("createdAt");

-- CreateIndex
CREATE INDEX "logs_updatedAt" ON "Log"("updatedAt");

-- CreateIndex
CREATE INDEX "seed_filename" ON "Seed"("filename");

-- CreateIndex
CREATE INDEX "seed_timestamp" ON "Seed"("timestamp");

-- CreateIndex
CREATE INDEX "seed_createdAt" ON "Seed"("createdAt");

-- CreateIndex
CREATE INDEX "seed_updatedAt" ON "Seed"("updatedAt");

-- CreateIndex
CREATE INDEX "sessions_expires" ON "Session"("expires");

-- CreateIndex
CREATE INDEX "sessions_sessionToken" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_createdAt" ON "Session"("createdAt");

-- CreateIndex
CREATE INDEX "sessions_updatedAt" ON "Session"("updatedAt");

-- CreateIndex
CREATE INDEX "sessions_userId" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "users_createdAt" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "users_updatedAt" ON "User"("updatedAt");

-- CreateIndex
CREATE INDEX "verification_tokens_expiresAt" ON "VerificationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "verification_tokens_createdAt" ON "VerificationToken"("createdAt");

-- CreateIndex
CREATE INDEX "verification_tokens_updatedAt" ON "VerificationToken"("updatedAt");

-- CreateIndex
CREATE INDEX "verification_tokens_userId" ON "VerificationToken"("userId");
