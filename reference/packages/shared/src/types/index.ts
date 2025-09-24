// User types
export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'telebirr' | 'chapa' | 'hellocash' | 'bank';
  name: string;
  isDefault: boolean;
}

// BNPL types
export interface PaymentPlan {
  id: string;
  type: 'pay_now' | 'pay_later' | 'pay_in_4' | 'pay_over_time';
  amount: number;
  installments: number;
  interestRate?: number;
  dueDate: Date;
}

// Transaction types
export interface Transaction {
  id: string;
  userId: string;
  merchantId: string;
  amount: number;
  currency: 'ETB';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentPlan: PaymentPlan;
  createdAt: Date;
}

// Merchant types
export interface Merchant {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  commissionRate: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 