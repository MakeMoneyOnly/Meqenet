#!/usr/bin/env python3
"""
Meqenet API - Complete Python Client Library

A comprehensive Python client for the Meqenet API
Supporting all major features with Ethiopian market optimizations
"""

import os
import time
import json
import uuid
import hmac
import hashlib
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, timedelta
from enum import Enum
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry


class PaymentMethod(Enum):
    """Supported payment methods"""
    TELEBIRR = "TELEBIRR"
    MPESA = "MPESA"
    CBE_BIRR = "CBE_BIRR"
    CHAPA = "CHAPA"
    SANTIMPAY = "SANTIMPAY"
    ARIFPAY = "ARIFPAY"


class PaymentPlan(Enum):
    """BNPL payment plans"""
    PAY_IN_4 = "PAY_IN_4"
    PAY_IN_3 = "PAY_IN_3"
    PAY_IN_2 = "PAY_IN_2"
    PAY_LATER = "PAY_LATER"


class MeqenetAPIClient:
    """Complete Meqenet API client"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize Meqenet API client
        
        Args:
            config: Configuration dictionary
                - base_url: API base URL
                - language: Language preference ('en' or 'am')
                - timeout: Request timeout in seconds
                - retry_attempts: Number of retry attempts
                - retry_delay: Delay between retries
        """
        config = config or {}
        
        # Configuration
        self.base_url = config.get('base_url', 'https://api.meqenet.et/v1')
        self.language = config.get('language', 'en')
        self.timeout = config.get('timeout', 30)
        self.retry_attempts = config.get('retry_attempts', 3)
        self.retry_delay = config.get('retry_delay', 1)
        
        # Authentication state
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user: Optional[Dict[str, Any]] = None
        
        # Setup session
        self.session = self._create_session()
    
    def _create_session(self) -> requests.Session:
        """Create configured HTTP session"""
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=self.retry_attempts,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "PUT", "DELETE", "OPTIONS", "TRACE", "POST"],
            backoff_factor=self.retry_delay
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Default headers
        session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': self.language,
            'User-Agent': 'Meqenet-Python-Client/1.0.0',
            'X-Client-Platform': 'Python'
        })
        
        return session
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID for NBE compliance"""
        return f"req_{int(time.time())}_{uuid.uuid4().hex[:8]}"
    
    def _generate_idempotency_key(self, data: Dict) -> str:
        """Generate idempotency key for payment requests"""
        data_str = json.dumps(data, sort_keys=True) + str(time.time())
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def _make_request(self, method: str, endpoint: str, 
                     data: Optional[Dict] = None,
                     params: Optional[Dict] = None,
                     headers: Optional[Dict] = None,
                     retry_on_401: bool = True) -> requests.Response:
        """
        Make authenticated HTTP request
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            data: Request body
            params: Query parameters
            headers: Additional headers
            retry_on_401: Whether to retry with refreshed token
            
        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        
        # Prepare headers
        request_headers = {
            'X-Request-ID': self._generate_request_id(),
            'X-Request-Timestamp': datetime.utcnow().isoformat()
        }
        
        if self.access_token:
            request_headers['Authorization'] = f'Bearer {self.access_token}'
        
        if headers:
            request_headers.update(headers)
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params,
                headers=request_headers,
                timeout=self.timeout
            )
            
            # Handle token refresh
            if response.status_code == 401 and retry_on_401 and self.refresh_token:
                self.refresh_access_token()
                request_headers['Authorization'] = f'Bearer {self.access_token}'
                response = self.session.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    headers=request_headers,
                    timeout=self.timeout
                )
            
            response.raise_for_status()
            return response
            
        except requests.exceptions.RequestException as e:
            self._handle_error(e)
            raise
    
    def _handle_error(self, error: Union[requests.exceptions.RequestException, Exception]) -> Dict[str, Any]:
        """
        Handle API errors with bilingual support
        
        Args:
            error: Exception object
            
        Returns:
            Error information dictionary
        """
        if isinstance(error, requests.exceptions.HTTPError) and error.response:
            response = error.response
            try:
                data = response.json()
            except json.JSONDecodeError:
                data = {'message': response.text}
            
            error_info = {
                'status': response.status_code,
                'code': data.get('error', {}).get('code', 'UNKNOWN'),
                'message': data.get('error', {}).get('message', data.get('message', 'Unknown error')),
                'request_id': data.get('requestId'),
                'timestamp': data.get('timestamp')
            }
            
            # Handle bilingual messages
            if isinstance(error_info['message'], dict):
                error_info['message_en'] = error_info['message'].get('en')
                error_info['message_am'] = error_info['message'].get('am')
                error_info['message'] = error_info['message'].get(self.language, error_info['message'].get('en'))
            
            return error_info
        
        # Network or other errors
        return {
            'code': 'NETWORK_ERROR',
            'message': str(error)
        }
    
    # ==================== Authentication ====================
    
    def register(self, phone: str, password: str, fayda_id: str, 
                email: str, first_name: str = None, last_name: str = None) -> Dict[str, Any]:
        """Register a new user"""
        data = {
            'phone': phone,
            'password': password,
            'faydaId': fayda_id,
            'email': email,
            'firstName': first_name,
            'lastName': last_name
        }
        
        response = self._make_request('POST', '/auth/register', data=data)
        result = response.json()
        
        self.access_token = result.get('accessToken')
        self.refresh_token = result.get('refreshToken')
        self.user = result.get('user')
        
        return result
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Login user"""
        data = {'email': email, 'password': password}
        response = self._make_request('POST', '/auth/login', data=data)
        result = response.json()
        
        self.access_token = result.get('accessToken')
        self.refresh_token = result.get('refreshToken')
        self.user = result.get('user')
        
        return result
    
    def refresh_access_token(self) -> str:
        """Refresh access token"""
        if not self.refresh_token:
            raise ValueError("No refresh token available")
        
        data = {'refreshToken': self.refresh_token}
        response = self._make_request('POST', '/auth/token/refresh', data=data, retry_on_401=False)
        result = response.json()
        
        self.access_token = result.get('accessToken')
        return self.access_token
    
    def logout(self) -> None:
        """Clear authentication state"""
        self.access_token = None
        self.refresh_token = None
        self.user = None
    
    def get_current_user(self) -> Dict[str, Any]:
        """Get current user profile"""
        response = self._make_request('GET', '/users/me')
        return response.json()
    
    # ==================== Payments ====================
    
    def initiate_payment(self, amount: float, payment_method: Union[str, PaymentMethod],
                         merchant_id: str, order_reference: str,
                         description: str = None, customer_info: Dict = None,
                         metadata: Dict = None) -> Dict[str, Any]:
        """Initiate payment transaction"""
        if isinstance(payment_method, PaymentMethod):
            payment_method = payment_method.value
        
        data = {
            'amount': amount,
            'currency': 'ETB',
            'paymentMethod': payment_method,
            'merchantId': merchant_id,
            'orderReference': order_reference,
            'description': description,
            'customerInfo': customer_info,
            'metadata': metadata or {}
        }
        
        headers = {
            'Idempotency-Key': self._generate_idempotency_key(data)
        }
        
        response = self._make_request('POST', '/payments/initiate', data=data, headers=headers)
        return response.json()
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Get payment status"""
        response = self._make_request('GET', f'/payments/{payment_id}/status')
        return response.json()
    
    def get_transactions(self, page: int = 1, limit: int = 20,
                        start_date: str = None, end_date: str = None,
                        status: str = None, payment_method: str = None) -> Dict[str, Any]:
        """Get transaction history"""
        params = {
            'page': page,
            'limit': limit,
            'startDate': start_date,
            'endDate': end_date,
            'status': status,
            'paymentMethod': payment_method
        }
        
        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}
        
        response = self._make_request('GET', '/transactions', params=params)
        return response.json()
    
    def process_refund(self, payment_id: str, amount: float,
                       reason: str, metadata: Dict = None) -> Dict[str, Any]:
        """Process payment refund"""
        data = {
            'amount': amount,
            'reason': reason,
            'metadata': metadata or {}
        }
        
        headers = {
            'Idempotency-Key': self._generate_idempotency_key({'paymentId': payment_id, **data})
        }
        
        response = self._make_request('POST', f'/payments/{payment_id}/refund', 
                                    data=data, headers=headers)
        return response.json()
    
    # ==================== BNPL ====================
    
    def apply_for_loan(self, amount: float, payment_plan: Union[str, PaymentPlan],
                       merchant_id: str, product_details: Dict) -> Dict[str, Any]:
        """Apply for BNPL loan"""
        if isinstance(payment_plan, PaymentPlan):
            payment_plan = payment_plan.value
        
        data = {
            'amount': amount,
            'paymentPlan': payment_plan,
            'merchantId': merchant_id,
            'productDetails': product_details
        }
        
        response = self._make_request('POST', '/loans/apply', data=data)
        return response.json()
    
    def get_loan(self, loan_id: str) -> Dict[str, Any]:
        """Get loan details"""
        response = self._make_request('GET', f'/loans/{loan_id}')
        return response.json()
    
    def get_loan_schedule(self, loan_id: str) -> Dict[str, Any]:
        """Get loan payment schedule"""
        response = self._make_request('GET', f'/loans/{loan_id}/schedule')
        return response.json()
    
    def pay_installment(self, loan_id: str, installment_id: str,
                       amount: float, payment_method: str) -> Dict[str, Any]:
        """Make installment payment"""
        data = {
            'installmentId': installment_id,
            'amount': amount,
            'paymentMethod': payment_method
        }
        
        headers = {
            'Idempotency-Key': self._generate_idempotency_key(data)
        }
        
        response = self._make_request('POST', f'/loans/{loan_id}/installments/pay',
                                    data=data, headers=headers)
        return response.json()
    
    def get_user_loans(self, page: int = 1, limit: int = 20,
                       status: str = None) -> Dict[str, Any]:
        """Get user's loans"""
        params = {'page': page, 'limit': limit}
        if status:
            params['status'] = status
        
        response = self._make_request('GET', '/loans', params=params)
        return response.json()
    
    # ==================== Merchants ====================
    
    def apply_as_merchant(self, business_data: Dict) -> Dict[str, Any]:
        """Apply to become a merchant"""
        response = self._make_request('POST', '/merchants/apply', data=business_data)
        return response.json()
    
    def get_merchant_profile(self) -> Dict[str, Any]:
        """Get merchant profile"""
        response = self._make_request('GET', '/merchants/profile')
        return response.json()
    
    def generate_api_key(self, key_name: str, permissions: List[str]) -> Dict[str, Any]:
        """Generate merchant API key"""
        data = {
            'keyName': key_name,
            'permissions': permissions
        }
        
        response = self._make_request('POST', '/merchants/api-keys', data=data)
        return response.json()
    
    def get_merchant_transactions(self, page: int = 1, limit: int = 20,
                                 start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Get merchant transactions"""
        params = {
            'page': page,
            'limit': limit,
            'startDate': start_date,
            'endDate': end_date
        }
        
        params = {k: v for k, v in params.items() if v is not None}
        
        response = self._make_request('GET', '/merchants/transactions', params=params)
        return response.json()
    
    def get_settlements(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get merchant settlements"""
        params = {'page': page, 'limit': limit}
        response = self._make_request('GET', '/merchants/settlements', params=params)
        return response.json()
    
    # ==================== Marketplace ====================
    
    def search_products(self, query: str, category: str = None,
                       min_price: float = None, max_price: float = None,
                       page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Search marketplace products"""
        params = {
            'q': query,
            'category': category,
            'minPrice': min_price,
            'maxPrice': max_price,
            'page': page,
            'limit': limit
        }
        
        params = {k: v for k, v in params.items() if v is not None}
        
        response = self._make_request('GET', '/marketplace/products/search', params=params)
        return response.json()
    
    def get_product(self, product_id: str) -> Dict[str, Any]:
        """Get product details"""
        response = self._make_request('GET', f'/marketplace/products/{product_id}')
        return response.json()
    
    def get_categories(self) -> List[Dict[str, Any]]:
        """Get product categories"""
        response = self._make_request('GET', '/marketplace/categories')
        return response.json()
    
    # ==================== Rewards ====================
    
    def get_rewards_balance(self) -> Dict[str, Any]:
        """Get rewards balance"""
        response = self._make_request('GET', '/rewards/balance')
        return response.json()
    
    def get_rewards_history(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get rewards history"""
        params = {'page': page, 'limit': limit}
        response = self._make_request('GET', '/rewards/history', params=params)
        return response.json()
    
    def redeem_rewards(self, amount: float, redemption_type: str) -> Dict[str, Any]:
        """Redeem rewards"""
        data = {
            'amount': amount,
            'redemptionType': redemption_type
        }
        
        response = self._make_request('POST', '/rewards/redeem', data=data)
        return response.json()
    
    # ==================== Utilities ====================
    
    def check_health(self) -> Dict[str, Any]:
        """Check API health"""
        response = self._make_request('GET', '/health')
        return response.json()
    
    @staticmethod
    def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
        """
        Verify webhook signature
        
        Args:
            payload: Raw webhook payload
            signature: Webhook signature from headers
            secret: Webhook secret
            
        Returns:
            True if signature is valid
        """
        expected_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)


def example_usage():
    """Example usage of the Meqenet API client"""
    
    # Initialize client
    client = MeqenetAPIClient({
        'base_url': os.getenv('API_BASE_URL', 'http://localhost:3000/api/v1'),
        'language': 'en'
    })
    
    try:
        # Check health
        health = client.check_health()
        print(f"API Status: {health.get('status')}")
        
        # Authenticate
        client.login('test@example.com', 'SecurePassword123!')
        print("✅ Logged in successfully")
        
        # Get user profile
        profile = client.get_current_user()
        print(f"User: {profile.get('phone')}")
        
        # Initiate payment
        payment = client.initiate_payment(
            amount=500.00,
            payment_method=PaymentMethod.TELEBIRR,
            merchant_id='merchant-123',
            order_reference=f'ORD-{int(time.time())}',
            description='Test payment',
            customer_info={
                'phone': '+251911234567',
                'email': 'customer@example.com'
            }
        )
        print(f"Payment initiated: {payment.get('paymentId')}")
        
        # Apply for loan
        loan = client.apply_for_loan(
            amount=5000.00,
            payment_plan=PaymentPlan.PAY_IN_4,
            merchant_id='merchant-123',
            product_details={
                'name': 'Test Product',
                'category': 'Electronics',
                'price': 5000.00
            }
        )
        print(f"Loan application: {loan.get('loanId')}")
        
    except requests.exceptions.RequestException as e:
        error_info = client._handle_error(e)
        print(f"Error: {error_info}")
    
    finally:
        client.logout()
        print("✅ Logged out")


if __name__ == "__main__":
    # Load environment variables if available
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
    
    example_usage()