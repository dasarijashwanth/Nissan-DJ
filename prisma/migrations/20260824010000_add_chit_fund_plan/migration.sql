-- CreateTable
CREATE TABLE "ChitFundPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "periodMonths" INTEGER NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "monthsPosted" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCreated" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChitFundPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChitFundPlan_userId_idx" ON "ChitFundPlan"("userId");

-- AddForeignKey
ALTER TABLE "ChitFundPlan" ADD CONSTRAINT "ChitFundPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
