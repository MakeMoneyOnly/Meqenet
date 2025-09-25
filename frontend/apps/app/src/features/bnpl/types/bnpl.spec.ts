/**
 * BNPL Types Tests
 * Tests for type definitions and enum values
 */

import {
  BNPLProduct,
  PaymentStatus,
  ContractStatus,
  InstallmentStatus,
  PaymentMethod,
} from './bnpl';

describe('BNPL Types', () => {
  describe('BNPLProduct enum', () => {
    it('should have correct enum values', () => {
      expect(BNPLProduct.PAY_IN_4).toBe('PAY_IN_4');
      expect(BNPLProduct.PAY_IN_30).toBe('PAY_IN_30');
      expect(BNPLProduct.PAY_IN_FULL).toBe('PAY_IN_FULL');
      expect(BNPLProduct.FINANCING).toBe('FINANCING');
    });
  });

  describe('PaymentStatus enum', () => {
    it('should have correct payment status values', () => {
      expect(PaymentStatus.PENDING).toBe('PENDING');
      expect(PaymentStatus.PROCESSING).toBe('PROCESSING');
      expect(PaymentStatus.COMPLETED).toBe('COMPLETED');
      expect(PaymentStatus.FAILED).toBe('FAILED');
      expect(PaymentStatus.CANCELLED).toBe('CANCELLED');
      expect(PaymentStatus.REFUNDED).toBe('REFUNDED');
      expect(PaymentStatus.CHARGEBACK).toBe('CHARGEBACK');
    });
  });

  describe('ContractStatus enum', () => {
    it('should have correct contract status values', () => {
      expect(ContractStatus.DRAFT).toBe('DRAFT');
      expect(ContractStatus.ACTIVE).toBe('ACTIVE');
      expect(ContractStatus.COMPLETED).toBe('CONTRACT_COMPLETED');
      expect(ContractStatus.DEFAULTED).toBe('DEFAULTED');
      expect(ContractStatus.CANCELLED).toBe('CONTRACT_CANCELLED');
      expect(ContractStatus.SUSPENDED).toBe('SUSPENDED');
    });
  });

  describe('InstallmentStatus enum', () => {
    it('should have correct installment status values', () => {
      expect(InstallmentStatus.PENDING).toBe('INSTALLMENT_PENDING');
      expect(InstallmentStatus.DUE).toBe('DUE');
      expect(InstallmentStatus.OVERDUE).toBe('OVERDUE');
      expect(InstallmentStatus.PAID).toBe('PAID');
      expect(InstallmentStatus.SKIPPED).toBe('SKIPPED');
      expect(InstallmentStatus.WRITTEN_OFF).toBe('WRITTEN_OFF');
    });
  });

  describe('PaymentMethod enum', () => {
    it('should have correct payment method values', () => {
      expect(PaymentMethod.TELEBIRR).toBe('TELEBIRR');
      expect(PaymentMethod.HELLOCASH).toBe('HELLOCASH');
      expect(PaymentMethod.CBE_BIRR).toBe('CBE_BIRR');
      expect(PaymentMethod.DASHEN_BANK).toBe('DASHEN_BANK');
      expect(PaymentMethod.BANK_TRANSFER).toBe('BANK_TRANSFER');
      expect(PaymentMethod.MOBILE_MONEY).toBe('MOBILE_MONEY');
      expect(PaymentMethod.CARD).toBe('CARD');
    });
  });

  describe('Type exports', () => {
    it('should export all required types', () => {
      // Test that types can be imported (TypeScript compilation check)
      const product: BNPLProduct = BNPLProduct.PAY_IN_4;
      const status: PaymentStatus = PaymentStatus.PENDING;
      const contractStatus: ContractStatus = ContractStatus.ACTIVE;
      const installmentStatus: InstallmentStatus = InstallmentStatus.PENDING;
      const paymentMethod: PaymentMethod = PaymentMethod.TELEBIRR;

      expect(product).toBeDefined();
      expect(status).toBeDefined();
      expect(contractStatus).toBeDefined();
      expect(installmentStatus).toBeDefined();
      expect(paymentMethod).toBeDefined();
    });
  });
});
