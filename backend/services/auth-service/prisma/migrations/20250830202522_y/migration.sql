-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'PENDING', 'DELETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'MERCHANT', 'ADMIN', 'COMPLIANCE', 'SUPPORT', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "location" TEXT,
    "deviceFingerprint" TEXT,
    "eventData" JSONB,
    "previousValues" JSONB,
    "newValues" JSONB,
    "riskScore" DOUBLE PRECISION,
    "complianceFlags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "firstName" VARCHAR(50),
    "lastName" VARCHAR(50),
    "displayName" VARCHAR(100),
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerifiedAt" TIMESTAMP(3),
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "kycCompletedAt" TIMESTAMP(3),
    "fayda_id_hash" TEXT,
    "kycDocuments" JSONB,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "riskScore" DOUBLE PRECISION,
    "riskAssessedAt" TIMESTAMP(3),
    "dataClassification" TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
    "retentionPolicy" TEXT NOT NULL DEFAULT 'ACTIVE_USER',
    "gdprConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "deviceId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSecure" BOOLEAN NOT NULL DEFAULT true,
    "riskFlags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_eventType_createdAt_idx" ON "audit_logs"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_eventType_idx" ON "audit_logs"("userId", "eventType");

-- CreateIndex
CREATE INDEX "audit_logs_ipAddress_createdAt_idx" ON "audit_logs"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_fayda_id_hash_key" ON "users"("fayda_id_hash");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_kycStatus_status_idx" ON "users"("kycStatus", "status");

-- CreateIndex
CREATE INDEX "users_status_role_idx" ON "users"("status", "role");

-- CreateIndex
CREATE INDEX "users_riskLevel_kycStatus_idx" ON "users"("riskLevel", "kycStatus");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "user_sessions_userId_isActive_idx" ON "user_sessions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "user_sessions_token_idx" ON "user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "user_sessions_ipAddress_createdAt_idx" ON "user_sessions"("ipAddress", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_userId_isUsed_idx" ON "password_resets"("userId", "isUsed");

-- CreateIndex
CREATE INDEX "password_resets_expiresAt_idx" ON "password_resets"("expiresAt");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
