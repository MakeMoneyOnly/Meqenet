import { z } from 'zod';
import { VALIDATION_RULES, PAYMENT_PLAN_TYPES, PAYMENT_GATEWAYS, KYC_STATUS, TRANSACTION_STATUS } from '../constants';

// User validation schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().regex(/^(\+251)?[79]\d{8}$/, 'Invalid Ethiopian phone number'),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  kycStatus: z.enum([KYC_STATUS.PENDING, KYC_STATUS.VERIFIED, KYC_STATUS.REJECTED]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true });

// Payment validation schemas
export const PaymentMethodSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([PAYMENT_GATEWAYS.TELEBIRR, PAYMENT_GATEWAYS.CHAPA, PAYMENT_GATEWAYS.HELLOCASH, PAYMENT_GATEWAYS.BANK]),
  name: z.string().min(1).max(100),
  isDefault: z.boolean(),
});

export const PaymentPlanSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([PAYMENT_PLAN_TYPES.PAY_NOW, PAYMENT_PLAN_TYPES.PAY_LATER, PAYMENT_PLAN_TYPES.PAY_IN_4, PAYMENT_PLAN_TYPES.PAY_OVER_TIME]),
  amount: z.number().min(VALIDATION_RULES.MIN_TRANSACTION_AMOUNT).max(VALIDATION_RULES.MAX_TRANSACTION_AMOUNT),
  installments: z.number().min(1).max(24),
  interestRate: z.number().min(0).max(1).optional(),
  dueDate: z.date(),
});

// Transaction validation schemas
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  merchantId: z.string().uuid(),
  amount: z.number().min(VALIDATION_RULES.MIN_TRANSACTION_AMOUNT).max(VALIDATION_RULES.MAX_TRANSACTION_AMOUNT),
  currency: z.literal('ETB'),
  status: z.enum([TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.FAILED, TRANSACTION_STATUS.CANCELLED]),
  paymentPlan: PaymentPlanSchema,
  createdAt: z.date(),
});

export const CreateTransactionSchema = TransactionSchema.omit({ id: true, createdAt: true, status: true });

// Authentication validation schemas
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(VALIDATION_RULES.PASSWORD_MIN_LENGTH),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(VALIDATION_RULES.PASSWORD_MIN_LENGTH),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().regex(/^(\+251)?[79]\d{8}$/, 'Invalid Ethiopian phone number'),
});

export const PinSchema = z.object({
  pin: z.string().length(VALIDATION_RULES.PIN_LENGTH).regex(/^\d+$/, 'PIN must contain only digits'),
});

// KYC validation schemas
export const KycDocumentSchema = z.object({
  type: z.literal('fayda_national_id'),
  documentNumber: z.string().min(10).max(20),
  frontImage: z.string().url(),
  backImage: z.string().url(),
  selfieImage: z.string().url(),
});

// Merchant validation schemas
export const MerchantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  verified: z.boolean(),
  commissionRate: z.number().min(0).max(0.1), // Max 10% commission
});

// API response validation schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Environment validation schema
export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_BASE_URL: z.string().url(),
  TELEBIRR_API_KEY: z.string().optional(),
  CHAPA_API_KEY: z.string().optional(),
  HELLOCASH_API_KEY: z.string().optional(),
}); 