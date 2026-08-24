-- CreateTable
CREATE TABLE "LoanGiven" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "principal" DOUBLE PRECISION NOT NULL,
    "interestRatePercent" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanGiven_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanGiven_userId_idx" ON "LoanGiven"("userId");

-- AddForeignKey
ALTER TABLE "LoanGiven" ADD CONSTRAINT "LoanGiven_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
