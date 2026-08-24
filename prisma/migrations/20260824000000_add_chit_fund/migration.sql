-- CreateTable
CREATE TABLE "ChitFund" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChitFund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChitFund_userId_idx" ON "ChitFund"("userId");

-- CreateIndex
CREATE INDEX "ChitFund_date_idx" ON "ChitFund"("date");

-- AddForeignKey
ALTER TABLE "ChitFund" ADD CONSTRAINT "ChitFund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
