# Frontend Integration Guide

This document provides guidelines for integrating the Meqenet API with frontend applications.

## Authentication Flow

### Registration and Login

1. **User Registration**:
   - Collect user information (email, phone, password, name)
   - Call the registration endpoint
   - Redirect to verification page

2. **Email/Phone Verification**:
   - Send verification code to user's email or phone
   - Collect verification code from user
   - Verify the code
   - Redirect to login page

3. **Login**:
   - Collect user credentials (email/phone and password)
   - Call the login endpoint
   - Store tokens securely (access token and refresh token)
   - Redirect to dashboard

4. **Token Management**:
   - Store access token in memory or secure storage
   - Store refresh token in secure HTTP-only cookie or secure storage
   - Implement token refresh mechanism
   - Handle token expiration and logout

### Token Refresh Flow

1. When access token expires, use refresh token to get a new access token
2. If refresh token is invalid or expired, redirect to login page
3. Update stored access token with new token

## API Integration

### HTTP Client Setup

Example using Axios:

```javascript
import axios from 'axios';

const API_URL = 'https://api.meqenet.et/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from secure storage
        const refreshToken = localStorage.getItem('refresh_token');
        
        // Call refresh token endpoint
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });
        
        // Update access token
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (error) {
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### API Service Example

```javascript
// auth.service.js
import api from './api';

export const AuthService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', {}, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  }),
  sendEmailVerification: () => api.post('/auth/verification/email/send'),
  verifyEmail: (code) => api.post('/auth/verification/email/verify', { code }),
  sendPhoneVerification: () => api.post('/auth/verification/phone/send'),
  verifyPhone: (code) => api.post('/auth/verification/phone/verify', { code }),
  getProfile: () => api.get('/auth/profile'),
};

// credit.service.js
import api from './api';

export const CreditService = {
  getCreditLimit: () => api.get('/credit/limit'),
  getCreditLimitHistory: () => api.get('/credit/limit/history'),
  submitCreditAssessment: (data) => api.post('/credit/assessment/submit', data),
};

// payment.service.js
import api from './api';

export const PaymentService = {
  initiatePayment: (data) => api.post('/payment-gateways/initiate', data),
  checkPaymentStatus: (reference) => api.get(`/payment-gateways/status/${reference}`),
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransactionDetails: (id) => api.get(`/transactions/${id}`),
};
```

## User Interface Components

### Authentication Components

1. **Registration Form**:
   - Email/Phone input with validation
   - Password input with strength indicator
   - Name inputs
   - Submit button
   - Link to login page

2. **Verification Form**:
   - Code input (preferably with auto-focus)
   - Resend code button with countdown
   - Verify button

3. **Login Form**:
   - Email/Phone input
   - Password input
   - Remember me checkbox
   - Forgot password link
   - Submit button
   - Link to registration page

### Credit Assessment Components

1. **Credit Assessment Form**:
   - Income and expense inputs
   - Employment status selection
   - Additional income sources
   - Submit button

2. **Credit Limit Display**:
   - Credit limit amount
   - Available credit
   - Used credit
   - Progress bar visualization

### Payment Components

1. **Payment Method Selection**:
   - List of available payment methods
   - Method details and logos
   - Select button

2. **Payment Confirmation**:
   - Amount and details
   - Terms and conditions
   - Confirm button

3. **Payment Status**:
   - Loading indicator
   - Success/failure message
   - Transaction reference
   - Return to dashboard button

## Error Handling

1. **Form Validation Errors**:
   - Display validation errors below each field
   - Highlight invalid fields
   - Show error summary if needed

2. **API Errors**:
   - Display error messages from API
   - Provide user-friendly error messages
   - Implement retry mechanism for network errors

3. **Authentication Errors**:
   - Handle invalid credentials
   - Handle expired tokens
   - Redirect to login page when needed

## State Management

### Using React Context API

```javascript
// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthService } from '../services/auth.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const response = await AuthService.getProfile();
          setUser(response.data);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AuthService.login(credentials);
      const { access_token, refresh_token, user_id } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Get user profile
      const userResponse = await AuthService.getProfile();
      setUser(userResponse.data);
      
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.register(userData);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
```

### Using Redux

```javascript
// auth.slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthService } from '../services/auth.service';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      const { access_token, refresh_token } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Get user profile
      const userResponse = await AuthService.getProfile();
      return userResponse.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Login failed' });
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
      
      // Clear tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Logout failed' });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
```

## Protected Routes

### Using React Router

```javascript
// ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;

// App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreditAssessment from './pages/CreditAssessment';
import Transactions from './pages/Transactions';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/credit-assessment" element={<CreditAssessment />} />
            <Route path="/transactions" element={<Transactions />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
```

## Payment Flow Integration

### Initiating a Payment

```javascript
import React, { useState } from 'react';
import { PaymentService } from '../services/payment.service';

const PaymentForm = () => {
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('TELEBIRR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await PaymentService.initiatePayment({
        amount: parseFloat(amount),
        provider,
        description: 'Payment for Meqenet services',
        returnUrl: `${window.location.origin}/payment/complete`,
      });
      
      if (response.data.success && response.data.paymentUrl) {
        setPaymentUrl(response.data.paymentUrl);
        // Redirect to payment URL
        window.location.href = response.data.paymentUrl;
      } else {
        setError('Failed to initiate payment');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h2>Make a Payment</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Amount (ETB)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="provider">Payment Method</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            required
          >
            <option value="TELEBIRR">Telebirr</option>
            <option value="HELLOCASH">HelloCash</option>
            <option value="CHAPA">Chapa</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
```

### Handling Payment Completion

```javascript
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PaymentService } from '../services/payment.service';

const PaymentComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [transaction, setTransaction] = useState(null);
  
  useEffect(() => {
    const checkPayment = async () => {
      try {
        const reference = searchParams.get('reference');
        
        if (!reference) {
          setStatus('error');
          return;
        }
        
        const response = await PaymentService.checkPaymentStatus(reference);
        
        if (response.data.status === 'COMPLETED') {
          setStatus('success');
          setTransaction(response.data);
        } else if (response.data.status === 'PENDING') {
          setStatus('pending');
          setTransaction(response.data);
          
          // Check again after 5 seconds
          setTimeout(checkPayment, 5000);
        } else {
          setStatus('failed');
          setTransaction(response.data);
        }
      } catch (error) {
        console.error('Payment check error:', error);
        setStatus('error');
      }
    };
    
    checkPayment();
  }, [searchParams]);
  
  const handleReturn = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="payment-complete">
      <h2>Payment Status</h2>
      
      {status === 'loading' && (
        <div className="loading">
          <p>Checking payment status...</p>
          <div className="spinner"></div>
        </div>
      )}
      
      {status === 'success' && (
        <div className="success">
          <h3>Payment Successful!</h3>
          <p>Your payment of {transaction?.amount} ETB has been completed.</p>
          <p>Transaction Reference: {transaction?.reference}</p>
          <button onClick={handleReturn}>Return to Dashboard</button>
        </div>
      )}
      
      {status === 'pending' && (
        <div className="pending">
          <h3>Payment Pending</h3>
          <p>Your payment is being processed. Please wait...</p>
          <div className="spinner"></div>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="failed">
          <h3>Payment Failed</h3>
          <p>Your payment could not be processed.</p>
          <p>Reason: {transaction?.message || 'Unknown error'}</p>
          <button onClick={handleReturn}>Return to Dashboard</button>
        </div>
      )}
      
      {status === 'error' && (
        <div className="error">
          <h3>Error</h3>
          <p>An error occurred while checking your payment status.</p>
          <button onClick={handleReturn}>Return to Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default PaymentComplete;
```

## Best Practices

1. **Security**:
   - Never store sensitive information in local storage
   - Use HTTP-only cookies for refresh tokens
   - Implement CSRF protection
   - Validate all user inputs
   - Use HTTPS for all API calls

2. **Performance**:
   - Implement caching for API responses
   - Use pagination for large data sets
   - Optimize bundle size
   - Implement lazy loading for components

3. **User Experience**:
   - Show loading indicators for async operations
   - Provide clear error messages
   - Implement form validation with immediate feedback
   - Save form data to prevent loss on page refresh
   - Implement responsive design for mobile users

4. **Accessibility**:
   - Use semantic HTML
   - Add ARIA attributes where needed
   - Ensure keyboard navigation
   - Maintain sufficient color contrast
   - Test with screen readers

## Troubleshooting

### Common Issues

1. **Authentication Issues**:
   - Check if tokens are stored correctly
   - Verify token expiration
   - Check for CORS issues
   - Ensure API URL is correct

2. **Payment Issues**:
   - Verify payment provider is available
   - Check amount format (use correct decimal places)
   - Verify return URL is correctly configured
   - Check network connectivity

3. **Form Submission Issues**:
   - Validate all required fields
   - Check for format validation errors
   - Verify CSRF token if applicable
   - Check for network connectivity

### Debugging Tools

1. **Browser Developer Tools**:
   - Network tab for API calls
   - Console for JavaScript errors
   - Application tab for storage inspection
   - React/Redux DevTools for state inspection

2. **API Testing Tools**:
   - Postman for API testing
   - Swagger UI for API documentation
   - Network proxies for request inspection

## Support

For additional support, contact:

- **Email**: developers@meqenet.et
- **Documentation**: https://meqenet.et/docs
- **API Status**: https://status.meqenet.et
