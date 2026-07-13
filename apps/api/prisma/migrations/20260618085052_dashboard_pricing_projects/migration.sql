-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "addressText" TEXT,
ADD COLUMN     "availabilityDate" TEXT,
ADD COLUMN     "availabilityText" TEXT,
ADD COLUMN     "resumeUrl" VARCHAR(512),
ADD COLUMN     "tagline" TEXT;

-- CreateTable
CREATE TABLE "PricingItem" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "imageUrl" VARCHAR(512),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingItem_portfolioId_sortOrder_idx" ON "PricingItem"("portfolioId", "sortOrder");

-- CreateIndex
CREATE INDEX "Project_portfolioId_sortOrder_idx" ON "Project"("portfolioId", "sortOrder");

-- AddForeignKey
ALTER TABLE "PricingItem" ADD CONSTRAINT "PricingItem_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
