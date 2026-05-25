-- CreateTable
CREATE TABLE "OfferBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "serviceId" TEXT,
    "categoryId" TEXT,
    "imageUrl" TEXT,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Book now',
    "offerPrice" INTEGER,
    "originalPrice" INTEGER,
    "discountText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferBanner_isActive_sortOrder_idx" ON "OfferBanner"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "OfferBanner_serviceId_idx" ON "OfferBanner"("serviceId");

-- CreateIndex
CREATE INDEX "OfferBanner_categoryId_idx" ON "OfferBanner"("categoryId");

-- CreateIndex
CREATE INDEX "OfferBanner_startsAt_endsAt_idx" ON "OfferBanner"("startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "OfferBanner" ADD CONSTRAINT "OfferBanner_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferBanner" ADD CONSTRAINT "OfferBanner_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
