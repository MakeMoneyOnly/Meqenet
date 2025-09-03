#!/usr/bin/env python3
"""
Meqenet API - Authentication Examples

This module demonstrates user authentication flows including:
- User registration with Fayda ID verification
- Login with email/password
- Token refresh
- Password reset flow
- Session management
"""

import os
import json
import time
import uuid
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry


class AuthenticationClient:
    """Client for Meqenet authentication API"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize authentication client
        
        Args:
            config: Configuration dictionary with base_url, language, etc.
        """
        config = config or {}
        self.base_url = config.get('base_url', 'https://api.meqenet.et/v1')
        self.language = config.get('language', 'en')  # 'en' or 'am' for Amharic
        self.timeout = config.get('timeout', 30)
        
        # Authentication state
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user: Optional[Dict[str, Any]] = None
        
        # Setup session with retry strategy
        self.session = self._create_session()
        
    def _create_session(self) -> requests.Session:
        """Create HTTP session with retry strategy"""
        session = requests.Session()
        
        # Configure retries for resilience
        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "PUT", "DELETE", "OPTIONS", "TRACE"],
            backoff_factor=1
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Set default headers
        session.headers.update({
            'Content-Type': 'application/json',
            'Accept-Language': self.language,
            'User-Agent': 'Meqenet-Python-Client/1.0.0'
        })
        
        return session
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID for NBE compliance"""
        return f"{int(time.time())}-{uuid.uuid4().hex[:8]}"
    
    def _make_request(self, method: str, endpoint: str, 
                     data: Optional[Dict] = None, 
                     headers: Optional[Dict] = None) -> requests.Response:
        """
        Make HTTP request with authentication and error handling
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            data: Request body data
            headers: Additional headers
            
        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        
        # Prepare headers
        request_headers = {
            'X-Request-ID': self._generate_request_id()
        }
        
        if self.access_token:
            request_headers['Authorization'] = f'Bearer {self.access_token}'
        
        if headers:
            request_headers.update(headers)
        
        # Make request
        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                headers=request_headers,
                timeout=self.timeout
            )
            
            # Handle token refresh for 401
            if response.status_code == 401 and self.refresh_token:
                self._refresh_access_token()
                # Retry request with new token
                request_headers['Authorization'] = f'Bearer {self.access_token}'
                response = self.session.request(
                    method=method,
                    url=url,
                    json=data,
                    headers=request_headers,
                    timeout=self.timeout
                )
            
            response.raise_for_status()
            return response
            
        except requests.exceptions.HTTPError as e:
            self._handle_error(e.response)
            raise
        except requests.exceptions.ConnectionError:
            print("❌ Connection error - Unable to reach server")
            raise
        except requests.exceptions.Timeout:
            print("❌ Request timeout - Server took too long to respond")
            raise
    
    def register(self, user_data: Dict[str, str]) -> Dict[str, Any]:
        """
        Register a new user
        
        Args:
            user_data: Dictionary containing registration details
                - phone: Ethiopian phone number (+251XXXXXXXXX)
                - password: Secure password (min 12 chars)
                - fayda_id: 12-digit Fayda National ID
                - email: User email
                - first_name: First name
                - last_name: Last name
                
        Returns:
            Registration response with tokens and user profile
        """
        payload = {
            'phone': user_data['phone'],
            'password': user_data['password'],
            'faydaId': user_data['fayda_id'],
            'email': user_data['email'],
            'firstName': user_data.get('first_name'),
            'lastName': user_data.get('last_name')
        }
        
        response = self._make_request('POST', '/auth/register', data=payload)
        result = response.json()
        
        # Store tokens
        self.access_token = result.get('accessToken')
        self.refresh_token = result.get('refreshToken')
        self.user = result.get('user')
        
        print("✅ Registration successful")
        print(f"User ID: {self.user.get('id')}")
        print(f"Phone: {self.user.get('phone')}")
        
        return result
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Login with email and password
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Authentication response with tokens
        """
        payload = {
            'email': email,
            'password': password
        }
        
        response = self._make_request('POST', '/auth/login', data=payload)
        result = response.json()
        
        # Store tokens
        self.access_token = result.get('accessToken')
        self.refresh_token = result.get('refreshToken')
        self.user = result.get('user')
        
        print("✅ Login successful")
        if self.user:
            print(f"Welcome back, {self.user.get('phone', 'User')}")
        
        return result
    
    def _refresh_access_token(self) -> str:
        """
        Refresh access token using refresh token
        
        Returns:
            New access token
        """
        if not self.refresh_token:
            raise ValueError("No refresh token available")
        
        payload = {'refreshToken': self.refresh_token}
        response = self._make_request('POST', '/auth/token/refresh', data=payload)
        result = response.json()
        
        self.access_token = result.get('accessToken')
        print("✅ Token refreshed successfully")
        
        return self.access_token
    
    def request_password_reset(self, email: str) -> None:
        """
        Request password reset token
        
        Args:
            email: User email address
        """
        payload = {'email': email}
        self._make_request('POST', '/auth/password-reset-request', data=payload)
        
        print("✅ Password reset email sent")
        print("Please check your email for reset instructions")
    
    def confirm_password_reset(self, token: str, new_password: str) -> None:
        """
        Confirm password reset with token
        
        Args:
            token: Reset token from email
            new_password: New password
        """
        payload = {
            'token': token,
            'newPassword': new_password
        }
        
        self._make_request('POST', '/auth/password-reset-confirm', data=payload)
        
        print("✅ Password reset successful")
        print("You can now login with your new password")
    
    def get_current_user(self) -> Dict[str, Any]:
        """
        Get current authenticated user profile
        
        Returns:
            User profile data
        """
        response = self._make_request('GET', '/users/me')
        profile = response.json()
        
        print("✅ Profile retrieved")
        print(f"User: {profile.get('phone')}")
        print(f"Roles: {', '.join(profile.get('roles', []))}")
        print(f"Created: {profile.get('createdAt')}")
        
        return profile
    
    def logout(self) -> None:
        """Logout and clear tokens"""
        self.access_token = None
        self.refresh_token = None
        self.user = None
        print("✅ Logged out successfully")
    
    def _handle_error(self, response: Optional[requests.Response]) -> None:
        """
        Handle API errors with bilingual message support
        
        Args:
            response: Error response object
        """
        if not response:
            return
        
        try:
            error_data = response.json()
        except json.JSONDecodeError:
            error_data = {}
        
        print(f"❌ Request failed")
        print(f"Status: {response.status_code}")
        
        # Extract error details
        error = error_data.get('error', {})
        
        # Check for error code
        if error.get('code'):
            print(f"Code: {error['code']}")
        
        # Handle bilingual messages
        message = error.get('message', error_data.get('message', 'Unknown error'))
        if isinstance(message, dict):
            # Bilingual message
            print(f"Error (EN): {message.get('en', 'Unknown error')}")
            print(f"Error (AM): {message.get('am', 'የማይታወቅ ስህተት')}")
        else:
            print(f"Error: {message}")
        
        # NBE compliance - log request ID
        request_id = error_data.get('requestId')
        if request_id:
            print(f"Request ID for support: {request_id}")


def run_examples():
    """Run authentication examples"""
    
    # Initialize client
    client = AuthenticationClient({
        'base_url': os.getenv('API_BASE_URL', 'http://localhost:3000/api/v1'),
        'language': os.getenv('API_LANGUAGE', 'en')
    })
    
    try:
        # Example 1: Register new user
        print("\n=== User Registration ===")
        registration_data = {
            'phone': '+251911234567',
            'password': 'SecurePass@2024!',
            'fayda_id': '123456789012',
            'email': f'test_{uuid.uuid4().hex[:8]}@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        # Uncomment to test registration
        # result = client.register(registration_data)
        
        # Example 2: Login
        print("\n=== User Login ===")
        client.login('test@example.com', 'SecurePass@2024!')
        
        # Example 3: Get user profile
        print("\n=== Get Profile ===")
        profile = client.get_current_user()
        
        # Example 4: Password reset flow
        print("\n=== Password Reset ===")
        # client.request_password_reset('test@example.com')
        # client.confirm_password_reset('reset-token', 'NewPass@2024!')
        
        # Example 5: Logout
        print("\n=== Logout ===")
        client.logout()
        
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    # Load environment variables if available
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
    
    run_examples()
