CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED', 'CANCELLED', 'SUSPENDED');
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED', 'REFUNDED');

CREATE TABLE "SubscriptionPlan" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'EGP', "durationDays" INTEGER NOT NULL, "maxStores" INTEGER,
  "maxActiveOffers" INTEGER, "maxBranches" INTEGER, "maxCouponsPerMonth" INTEGER,
  "features" TEXT[] DEFAULT ARRAY[]::TEXT[], "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPublic" BOOLEAN NOT NULL DEFAULT true, "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SubscriptionPlan_isActive_isPublic_priority_idx" ON "SubscriptionPlan"("isActive", "isPublic", "priority");

CREATE TABLE "StoreSubscription" (
  "id" TEXT NOT NULL, "storeId" TEXT NOT NULL, "planId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING', "startsAt" TIMESTAMP(3), "endsAt" TIMESTAMP(3),
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "reviewedAt" TIMESTAMP(3), "expiryReminderSentAt" TIMESTAMP(3),
  "reviewedById" TEXT, "reviewNote" TEXT, "merchantNote" TEXT, "priceSnapshot" DOUBLE PRECISION NOT NULL,
  "currencySnapshot" TEXT NOT NULL, "durationDaysSnapshot" INTEGER NOT NULL, "maxStoresSnapshot" INTEGER,
  "maxActiveOffersSnapshot" INTEGER, "maxBranchesSnapshot" INTEGER, "maxCouponsSnapshot" INTEGER,
  "featuresSnapshot" TEXT[] DEFAULT ARRAY[]::TEXT[], "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StoreSubscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StoreSubscription_storeId_status_idx" ON "StoreSubscription"("storeId", "status");
CREATE INDEX "StoreSubscription_status_requestedAt_idx" ON "StoreSubscription"("status", "requestedAt");
CREATE INDEX "StoreSubscription_endsAt_idx" ON "StoreSubscription"("endsAt");

CREATE TABLE "SubscriptionPayment" (
  "id" TEXT NOT NULL, "subscriptionId" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EGP', "method" TEXT NOT NULL DEFAULT 'MANUAL', "reference" TEXT,
  "proofUrl" TEXT, "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING', "merchantNote" TEXT,
  "reviewNote" TEXT, "reviewedAt" TIMESTAMP(3), "reviewedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");
CREATE INDEX "SubscriptionPayment_status_createdAt_idx" ON "SubscriptionPayment"("status", "createdAt");

CREATE TABLE "SubscriptionSettings" (
  "id" TEXT NOT NULL DEFAULT 'default', "enforcementEnabled" BOOLEAN NOT NULL DEFAULT false,
  "allowManualRequests" BOOLEAN NOT NULL DEFAULT true, "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
  "expiryReminderDays" INTEGER NOT NULL DEFAULT 3, "paymentInstructions" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SubscriptionSettings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "SubscriptionSettings" ("id", "updatedAt") VALUES ('default', CURRENT_TIMESTAMP);

ALTER TABLE "StoreSubscription" ADD CONSTRAINT "StoreSubscription_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreSubscription" ADD CONSTRAINT "StoreSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreSubscription" ADD CONSTRAINT "StoreSubscription_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "StoreSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
