-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "description" TEXT,
    "instagramUrl" VARCHAR(512),
    "tiktokUrl" VARCHAR(512),
    "youtubeUrl" VARCHAR(512),
    "instagramFollowers" INTEGER,
    "tiktokFollowers" INTEGER,
    "youtubeSubscribers" INTEGER,
    "headline" TEXT,
    "biography" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "brandSummary" TEXT,
    "slug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "showDob" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" TEXT,
    "year" TEXT,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'all',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "provider" TEXT NOT NULL DEFAULT 'groq',
    "inputSnapshot" JSONB,
    "output" JSONB,
    "error" TEXT,
    "tokensUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_userId_key" ON "Portfolio"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_slug_key" ON "Portfolio"("slug");

-- CreateIndex
CREATE INDEX "Portfolio_status_idx" ON "Portfolio"("status");

-- CreateIndex
CREATE INDEX "Photo_portfolioId_sortOrder_idx" ON "Photo"("portfolioId", "sortOrder");

-- CreateIndex
CREATE INDEX "Experience_portfolioId_sortOrder_idx" ON "Experience"("portfolioId", "sortOrder");

-- CreateIndex
CREATE INDEX "GenerationJob_portfolioId_createdAt_idx" ON "GenerationJob"("portfolioId", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_status_idx" ON "GenerationJob"("status");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
