-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "autopayEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autopayPaymentMethodId" TEXT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_autopayPaymentMethodId_fkey" FOREIGN KEY ("autopayPaymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
