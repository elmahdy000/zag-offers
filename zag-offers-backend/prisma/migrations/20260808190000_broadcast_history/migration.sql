CREATE TABLE "BroadcastLog" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "area" TEXT,
  "imageUrl" TEXT,
  "actionType" TEXT,
  "actionValue" TEXT,
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BroadcastLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BroadcastLog_createdAt_idx" ON "BroadcastLog"("createdAt");
CREATE INDEX "BroadcastLog_createdById_idx" ON "BroadcastLog"("createdById");
ALTER TABLE "BroadcastLog" ADD CONSTRAINT "BroadcastLog_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
