CREATE TABLE "City" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");
CREATE INDEX "City_isActive_priority_idx" ON "City"("isActive", "priority");
CREATE TABLE "Area" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "cityId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "priority" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Area_cityId_name_key" ON "Area"("cityId", "name");
CREATE INDEX "Area_cityId_isActive_idx" ON "Area"("cityId", "isActive");
CREATE TABLE "StoreBranch" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "address" TEXT NOT NULL, "phone" TEXT,
  "whatsapp" TEXT, "lat" DOUBLE PRECISION, "lng" DOUBLE PRECISION, "locationUrl" TEXT,
  "workingHours" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "storeId" TEXT NOT NULL,
  "cityId" TEXT, "areaId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StoreBranch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StoreBranch_storeId_idx" ON "StoreBranch"("storeId");
CREATE INDEX "StoreBranch_cityId_idx" ON "StoreBranch"("cityId");
CREATE INDEX "StoreBranch_areaId_idx" ON "StoreBranch"("areaId");
CREATE INDEX "StoreBranch_isActive_idx" ON "StoreBranch"("isActive");
ALTER TABLE "Store" ADD COLUMN "cityId" TEXT, ADD COLUMN "areaId" TEXT;
CREATE INDEX "Store_cityId_idx" ON "Store"("cityId");
CREATE INDEX "Store_areaId_idx" ON "Store"("areaId");
ALTER TABLE "Area" ADD CONSTRAINT "Area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreBranch" ADD CONSTRAINT "StoreBranch_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreBranch" ADD CONSTRAINT "StoreBranch_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoreBranch" ADD CONSTRAINT "StoreBranch_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Store" ADD CONSTRAINT "Store_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Store" ADD CONSTRAINT "Store_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
