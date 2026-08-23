-- CreateTable
CREATE TABLE "IndiaTransfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "recipient" TEXT NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndiaTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndiaTransfer_userId_idx" ON "IndiaTransfer"("userId");

-- CreateIndex
CREATE INDEX "IndiaTransfer_date_idx" ON "IndiaTransfer"("date");

-- AddForeignKey
ALTER TABLE "IndiaTransfer" ADD CONSTRAINT "IndiaTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
