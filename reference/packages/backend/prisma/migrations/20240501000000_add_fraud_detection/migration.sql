-- CreateTable
CREATE TABLE "fraud_checks" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "action" TEXT NOT NULL,
    "flaggedRules" TEXT[],
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,

    CONSTRAINT "fraud_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "parameters" JSONB,

    CONSTRAINT "fraud_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fraud_rules_name_key" ON "fraud_rules"("name");

-- AddForeignKey
ALTER TABLE "fraud_checks" ADD CONSTRAINT "fraud_checks_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default fraud rules
INSERT INTO "fraud_rules" ("id", "name", "description", "riskScore", "isActive", "createdAt", "updatedAt", "createdBy", "parameters")
VALUES
  (gen_random_uuid(), 'unusual_transaction_amount', 'Transaction amount is unusually high for the user', 70, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, '{"threshold_multiplier": 3}'),
  (gen_random_uuid(), 'high_transaction_frequency', 'User is making transactions too frequently', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, '{"max_transactions_per_hour": 3}'),
  (gen_random_uuid(), 'high_risk_merchant', 'Merchant has a high risk rating', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, '{"new_merchant_risk": 30}'),
  (gen_random_uuid(), 'unusual_location', 'Transaction location is unusual for the user', 80, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, '{}'),
  (gen_random_uuid(), 'unusual_transaction_time', 'Transaction time is unusual for the user', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, '{"late_night_start": 1, "late_night_end": 5}'),
  (gen_random_uuid(), 'multiple_merchants', 'User is making transactions with multiple merchants in a short time', 70, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, '{"max_merchants_per_2hours": 3}');
