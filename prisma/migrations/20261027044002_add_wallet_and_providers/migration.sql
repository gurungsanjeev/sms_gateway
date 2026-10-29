/*
 Warnings:
 
 - Added the required column `providerId` to the `SmsAttempt` table without a default value. This is not possible if the table is not empty.
 
 */
-- AlterTable
ALTER TABLE
    "SmsAttempt"
ADD
    COLUMN "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE
    "SmsMessage"
ADD
    COLUMN "cost" INTEGER NOT NULL DEFAULT 0,
ADD
    COLUMN "parts" INTEGER NOT NULL DEFAULT 1,
ADD
    COLUMN "refundedAt" TIMESTAMP(3),
ADD
    COLUMN "selectedProviderId" TEXT;

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 1000,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 10000,
    "failureRate" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE INDEX "SmsAttempt_smsMessageId_attemptedAt_idx" ON "SmsAttempt"("smsMessageId", "attemptedAt");

-- CreateIndex
CREATE INDEX "SmsAttempt_providerId_attemptedAt_idx" ON "SmsAttempt"("providerId", "attemptedAt");

-- CreateIndex
CREATE INDEX "SmsMessage_userId_createdAt_idx" ON "SmsMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsMessage_status_createdAt_idx" ON "SmsMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SmsMessage_recipient_idx" ON "SmsMessage"("recipient");

-- AddForeignKey
ALTER TABLE
    "Wallet"
ADD
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "SmsMessage"
ADD
    CONSTRAINT "SmsMessage_selectedProviderId_fkey" FOREIGN KEY ("selectedProviderId") REFERENCES "Provider"("id") ON DELETE
SET
    NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "SmsAttempt"
ADD
    CONSTRAINT "SmsAttempt_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;