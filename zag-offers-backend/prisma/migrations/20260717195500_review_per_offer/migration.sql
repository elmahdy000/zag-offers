DROP INDEX IF EXISTS "Review_storeId_customerId_key";
CREATE UNIQUE INDEX "Review_offerId_customerId_key" ON "Review"("offerId", "customerId");
