-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "topic" VARCHAR(1024) NOT NULL,
    "payload" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
