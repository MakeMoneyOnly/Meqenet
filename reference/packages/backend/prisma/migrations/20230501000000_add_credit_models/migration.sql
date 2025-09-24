-- CreateTable
CREATE TABLE "credit_limit_history" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "previousLimit" DOUBLE PRECISION NOT NULL,
    "newLimit" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_limit_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "credit_limit_history" ADD CONSTRAINT "credit_limit_history_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;