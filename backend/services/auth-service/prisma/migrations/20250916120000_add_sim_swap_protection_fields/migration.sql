-- Add SIM-swap protection fields to User table
-- Migration: 20250916120000_add_sim_swap_protection_fields

-- Add phoneChangeCoolingPeriodEnd field for SIM-swap protection
ALTER TABLE "User" ADD COLUMN "phoneChangeCoolingPeriodEnd" TIMESTAMP(3);

-- Add comment for security classification
COMMENT ON COLUMN "User"."phoneChangeCoolingPeriodEnd" IS '@classification: Sensitive @encrypted';

-- Create index for efficient querying of cooling period end times
CREATE INDEX "User_phoneChangeCoolingPeriodEnd_idx" ON "User"("phoneChangeCoolingPeriodEnd");

-- Add comment for audit trail
COMMENT ON COLUMN "User"."phoneUpdatedAt" IS 'Tracks when phone number was last updated for SIM-swap protection';
