CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

ALTER TABLE "Review"
ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "moderationNote" TEXT;

CREATE INDEX "Review_status_idx" ON "Review"("status");

CREATE TABLE "ContentReport" (
  "id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "reporterId" TEXT,
  "resolvedById" TEXT,
  "resolutionNote" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentReport_status_idx" ON "ContentReport"("status");
CREATE INDEX "ContentReport_entityType_entityId_idx" ON "ContentReport"("entityType", "entityId");
CREATE INDEX "ContentReport_createdAt_idx" ON "ContentReport"("createdAt");
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_resolvedById_fkey"
FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
