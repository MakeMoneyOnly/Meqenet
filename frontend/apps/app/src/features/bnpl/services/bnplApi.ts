import axios from 'axios';
import {
  BNPLProduct,
  CreateContractRequest,
  ProcessPaymentRequest,
  Contract,
  Payment,
} from '../types/bnpl';

// Configure axios instance for BNPL API
const bnplApiClient = axios.create({
  // eslint-disable-next-line internal/no-process-env-outside-config
  baseURL: process.env.EXPO_PUBLIC_BNPL_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to add authentication
bnplApiClient.interceptors.request.use(
  (config) => {
    // Add auth token from secure storage
    const token = 'user-auth-token'; // This would come from auth context/storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
bnplApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      // Log handled in auth interceptor
    } else if (error.response?.status >= 500) {
      // Handle server errors
      // Log handled in error interceptor
    }
    return Promise.reject(error);
  },
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

class BnplApiService {
  /**
   * Create a new BNPL contract
   */
  async createContract(request: CreateContractRequest): Promise<
    ApiResponse<{
      contractId: string;
      contractNumber: string;
      status: string;
      amount: number;
      totalAmount: number;
      outstandingBalance: number;
      createdAt: string;
    }>
  > {
    const response = await bnplApiClient.post('/bnpl/contracts', request);
    return response.data;
  }

  /**
   * Process a payment for an existing contract
   */
  async processPayment(request: ProcessPaymentRequest): Promise<
    ApiResponse<{
      paymentId: string;
      paymentReference: string;
      status: string;
      amount: number;
      currency: string;
      createdAt: string;
    }>
  > {
    const response = await bnplApiClient.post('/bnpl/payments', request);
    return response.data;
  }

  /**
   * Get contract details with installment schedule
   */
  async getContractDetails(contractId: string): Promise<
    ApiResponse<{
      contractId: string;
      contractNumber: string;
      customerId: string;
      merchantId: string;
      merchantName: string;
      product: BNPLProduct;
      status: string;
      principalAmount: number;
      totalAmount: number;
      outstandingBalance: number;
      apr: number | null;
      termMonths: number | null;
      paymentFrequency: string;
      firstPaymentDate: string | null;
      maturityDate: string | null;
      installments: Array<{
        installmentNumber: number;
        status: string;
        scheduledAmount: number;
        principalAmount: number;
        interestAmount: number;
        feeAmount: number;
        dueDate: string;
        paidAt: string | null;
        paidAmount: number | null;
      }>;
      createdAt: string;
      activatedAt: string | null;
    }>
  > {
    const response = await bnplApiClient.get(`/bnpl/contracts/${contractId}`);
    return response.data;
  }

  /**
   * Get available BNPL products and terms
   */
  async getAvailableProducts(): Promise<
    ApiResponse<{
      products: Array<{
        product: BNPLProduct;
        name: string;
        description: string;
        interestRate: number;
        term: string;
        minAmount: number;
        maxAmount: number;
        popular?: boolean;
      }>;
      currency: string;
      timezone: string;
    }>
  > {
    const response = await bnplApiClient.get('/bnpl/products');
    return response.data;
  }

  /**
   * Get customer's active contracts
   */
  async getCustomerContracts(
    customerId: string,
  ): Promise<ApiResponse<Contract[]>> {
    const response = await bnplApiClient.get(
      `/customers/${customerId}/contracts`,
    );
    return response.data;
  }

  /**
   * Get customer's payment history
   */
  async getCustomerPayments(
    customerId: string,
  ): Promise<ApiResponse<Payment[]>> {
    const response = await bnplApiClient.get(
      `/customers/${customerId}/payments`,
    );
    return response.data;
  }

  /**
   * Get merchant details for BNPL checkout
   */
  async getMerchantDetails(merchantId: string): Promise<
    ApiResponse<{
      id: string;
      businessName: string;
      category: string;
      bnplEnabled: boolean;
      cashbackRate: number;
      commissionRate: number;
      minContractAmount: number;
      maxContractAmount: number;
    }>
  > {
    const response = await bnplApiClient.get(`/merchants/${merchantId}`);
    return response.data;
  }

  /**
   * Check if customer is eligible for BNPL
   */
  async checkEligibility(
    customerId: string,
    amount: number,
  ): Promise<
    ApiResponse<{
      eligible: boolean;
      maxAmount: number;
      reason?: string;
      riskLevel: string;
    }>
  > {
    const response = await bnplApiClient.post('/bnpl/eligibility/check', {
      customerId,
      amount,
    });
    return response.data;
  }

  /**
   * Get customer's cashback balance and history
   */
  async getCashbackBalance(customerId: string): Promise<
    ApiResponse<{
      balance: number;
      currency: string;
      totalEarned: number;
      totalRedeemed: number;
      transactions: Array<{
        id: string;
        amount: number;
        type: 'earned' | 'redeemed';
        description: string;
        createdAt: string;
      }>;
    }>
  > {
    const response = await bnplApiClient.get(
      `/customers/${customerId}/cashback`,
    );
    return response.data;
  }
}

// Export singleton instance
export const bnplApi = new BnplApiService();
export default bnplApi;
