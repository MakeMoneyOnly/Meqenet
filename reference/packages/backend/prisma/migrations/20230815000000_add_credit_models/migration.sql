-- CreateTable
CREATE TABLE "credit_limit_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "previousLimit" DOUBLE PRECISION NOT NULL,
    "newLimit" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "assessmentScore" DOUBLE PRECISION,
   