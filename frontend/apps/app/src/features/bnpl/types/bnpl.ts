// BNPL Types for Meqenet Mobile App

export enum BNPLProduct {
  PAY_IN_4 = 'PAY_IN_4',
  PAY_IN_30 = 'PAY_IN_30',
  PAY_IN_FULL = 'PAY_IN_FULL',
  FINANCING = 'FINANCING',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  CHARGEBACK = 'CHARGEBACK',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'CONTRACT_COMPLETED',
  DEFAULTED = 'DEFAULTED',
  CANCELLED = 'CONTRACT_CANCELLED',
  SUSPENDED = 'SUSPENDED',
}

export enum InstallmentStatus {
  PENDING = 'INSTALLMENT_PENDING',
  DUE = 'DUE',
  OVERDUE = 'OVERDUE',
  PAID = 'PAID',
  SKIPPED = 'SKIPPED',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

export enum PaymentMethod {
  TELEBIRR = 'TELEBIRR',
  HELLOCASH = 'HELLOCASH',
  CBE_BIRR = 'CBE_BIRR',
  DASHEN_BANK = 'DASHEN_BANK',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
}

export interface Contract {
  id: string;
  contractNumber: string;
  customerId: string;
  merchantId: string;
  merchantName: string;
  product: BNPLProduct;
  status: ContractStatus;
  currency: string;
  principalAmount: number;
  totalAmount: number;
  outstandingBalance: number;
  apr: number | null;
  termMonths: number | null;
  paymentFrequency: string;
  firstPaymentDate: Date | null;
  maturityDate: Date | null;
  description: string | null;
  merchantReference: string | null;
  createdAt: Date;
  activatedAt: Date | null;
  installments: Installment[];
}

export interface Installment {
  id: string;
  contractId: string;
  installmentNumber: number;
  status: InstallmentStatus;
  scheduledAmount: number;
  principalAmount: number;
  interestAmount: number;
  feeAmount: number;
  dueDate: Date;
  paidAt: Date | null;
  paidAmount: number | null;
  paymentId: string | null;
}

export interface Payment {
  id: string;
  paymentReference: string;
  contractId: string | null;
  customerId: string;
  merchantId: string | null;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  processingFee: number;
  currency: string;
  externalReference: string | null;
  failureReason: string | null;
  failureCode: string | null;
  initiatedAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
}

export interface CreateContractRequest {
  customerId: string;
  merchantId: string;
  product: BNPLProduct;
  amount: number;
  description?: string;
  merchantReference?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface ProcessPaymentRequest {
  contractId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency?: string;
  idempotencyKey?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface BNPLProductOption {
  product: BNPLProduct;
  name: string;
  description: string;
  interestRate: number;
  term: string;
  minAmount: number;
  maxAmount: number;
  popular?: boolean;
}

export interface Merchant {
  id: string;
  businessName: string;
  category: string;
  logo?: string;
  cashbackRate: number;
  commissionRate: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  merchant: Merchant;
}

export interface BNPLCheckoutData {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  merchantId: string;
  merchantName: string;
}
