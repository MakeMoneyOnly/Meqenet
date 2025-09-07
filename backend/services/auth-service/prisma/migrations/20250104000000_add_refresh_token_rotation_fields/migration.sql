-- Migration: Add refresh token rotation fields for enhanced security
-- This implements the audit recommendation to add refresh token rotation

-- Add fields to track token rotation for security audit compliance
ALTER TABLE "OAuthRefreshToken" 
ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "rotatedAt" TIMESTAMP(3),
ADD COLUMN "rotatedToTokenId" TEXT;

-- Add index for performance on revoked tokens lookup
CREATE INDEX "OAuthRefreshToken_revokedAt_idx" ON "OAuthRefreshToken"("revokedAt");

-- Add index for rotation tracking
CREATE INDEX "OAuthRefreshToken_rotatedToTokenId_idx" ON "OAuthRefreshToken"("rotatedToTokenId");

-- Add foreign key constraint for rotated token reference (optional, for data integrity)
-- Note: This creates a self-referencing foreign key
ALTER TABLE "OAuthRefreshToken" 
ADD CONSTRAINT "OAuthRefreshToken_rotatedToTokenId_fkey" 
FOREIGN KEY ("rotatedToTokenId") REFERENCES "OAuthRefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
