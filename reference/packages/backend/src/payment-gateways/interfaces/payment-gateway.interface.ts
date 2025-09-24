export interface PaymentInitiationRequest {
  amount: number;
  currency: string; // Default 'ETB'
  description: string;
  callbackUrl: string;
  returnUrl: string;
  reference: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
  paymentId?: string;
  transactionId?: string;
  status?: string;
  error?: any;
}

export interface PaymentVerificationRequest {
  paymentId: string;
  transactionId?: string;
  reference?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount?: number;
  currency?: string;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  error?: any;
}

export interface PaymentGateway {
  initiate(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse>;
  verify(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse>;
  handleCallback(payload: any, signature?: string): Promise<PaymentVerificationResponse>;
}