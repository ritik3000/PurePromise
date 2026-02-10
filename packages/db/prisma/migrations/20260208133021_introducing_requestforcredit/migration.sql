-- CreateTable
CREATE TABLE "CreditRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditRequest_userId_idx" ON "CreditRequest"("userId");

-- CreateIndex
CREATE INDEX "CreditRequest_createdAt_idx" ON "CreditRequest"("createdAt");
