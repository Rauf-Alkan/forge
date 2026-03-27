-- CreateTable
CREATE TABLE "Job" (
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "stepName" TEXT NOT NULL DEFAULT 'Initializing...',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "downloadUrl" TEXT,
    "title" TEXT,
    "hashtags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("jobId")
);
