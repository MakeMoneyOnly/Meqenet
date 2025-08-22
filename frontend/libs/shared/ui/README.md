# Meqenet Shared UI Components

A collection of reusable UI components and utilities for Meqenet frontend applications.

## Components

### ErrorBoundary

A sophisticated error boundary component with Sentry integration and user-friendly error handling.

#### Basic Usage

```tsx
import ErrorBoundary from '@frontend/ui';

function App() {
  return (
    <ErrorBoundary>
      <YourAppComponents />
    </ErrorBoundary>
  );
}
```

#### With Custom Fallback

```tsx
import ErrorBoundary from '@frontend/ui';

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="custom-error">
          <h2>Something went wrong!</h2>
          <p>Please refresh the page or contact support.</p>
        </div>
      }
    >
      <YourAppComponents />
    </ErrorBoundary>
  );
}
```

#### With Error Details (Development Only)

```tsx
import ErrorBoundary from '@frontend/ui';

function App() {
  return (
    <ErrorBoundary
      showErrorDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Custom error handling
        console.log('Custom error handler:', error, errorInfo);
      }}
    >
      <YourAppComponents />
    </ErrorBoundary>
  );
}
```

#### With Sentry Integration

```tsx
import ErrorBoundary, { withSentryErrorBoundary } from '@frontend/ui';
import { initSentry } from '@frontend/ui';

// Initialize Sentry first
initSentry({
  dsn: 'your-sentry-dsn',
  environment: 'production'
});

// Use with HOC
const SentryProtectedComponent = withSentryErrorBoundary(YourComponent);

// Or use the enhanced ErrorBoundary
function App() {
  return (
    <ErrorBoundary>
      <YourAppComponents />
    </ErrorBoundary>
  );
}
```

### ErrorBoundary Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | The child components to wrap |
| `fallback` | `ReactNode` | - | Custom fallback UI component |
| `onError` | `(error, errorInfo) => void` | - | Custom error handler callback |
| `showErrorDetails` | `boolean` | `false` | Show detailed error information |

### ErrorBoundary Methods

#### Manual Error Reporting

```tsx
import { safeCaptureException } from '@frontend/ui';

// Safely capture and report errors
try {
  riskyOperation();
} catch (error) {
  safeCaptureException(error, {
    tags: { component: 'RiskyComponent' },
    extra: { userId: user.id }
  });
}
```

#### Error Context Management

```tsx
import { setErrorContext, setErrorTag } from '@frontend/ui';

// Set context for better error tracking
setErrorContext('user', { id: userId, role: userRole });
setErrorTag('feature', 'payment-processing');
```

## API Client

Enhanced HTTP client with interceptors, retry logic, and error handling.

### Basic Usage

```tsx
import apiClient from '@frontend/api-client';

// Simple GET request
const users = await apiClient.get('/users');

// POST request with data
const newUser = await apiClient.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
await apiClient.put('/users/123', {
  name: 'Updated Name'
});

// DELETE request
await apiClient.delete('/users/123');
```

### Advanced Usage

```tsx
import { ApiClient } from '@frontend/api-client';

// Create custom instance
const customClient = new ApiClient();

// Configure retry policy
customClient.setRetryPolicy(5, 2000); // 5 retries, 2 second delay

// Use custom client
const data = await customClient.get('/api/data');
```

### Error Handling

```tsx
import apiClient from '@frontend/api-client';

try {
  const response = await apiClient.get('/users');
  console.log(response.data);
} catch (error) {
  if (error.status === 401) {
    // Handle authentication error
    redirectToLogin();
  } else if (error.status === 429) {
    // Handle rate limiting
    showRateLimitMessage();
  } else {
    // Handle other errors
    showErrorMessage(error.message);
  }
}
```

### Request Configuration

```tsx
import apiClient from '@frontend/api-client';

// Custom headers
const response = await apiClient.get('/protected-endpoint', {
  headers: {
    'X-Custom-Header': 'custom-value'
  }
});

// Timeout override
const response = await apiClient.post('/slow-endpoint', data, {
  timeout: 10000 // 10 seconds
});

// Query parameters
const response = await apiClient.get('/search', {
  params: {
    q: 'search term',
    limit: 20
  }
});
```

### Response Interceptors

```tsx
import apiClient from '@frontend/api-client';

// Access response metadata
const response = await apiClient.get('/data');

// Response time is automatically calculated
console.log(`Request took ${response.responseTime}ms`);

// Response includes enhanced metadata
console.log('Response metadata:', response.config.metadata);
```

## Configuration

### API Configuration

```tsx
// frontend/libs/shared/config/src/lib/api.config.ts
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

export class ApiConfigService {
  private config: ApiConfig;

  constructor() {
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  getBaseURL(): string {
    return this.config.baseURL;
  }

  getTimeout(): number {
    return this.config.timeout;
  }

  getHeaders(): Record<string, string> {
    return this.config.headers;
  }
}
```

## Sentry Integration

### Setup

```tsx
// In your app entry point (e.g., _app.tsx for Next.js)
import { initSentry } from '@frontend/ui';

initSentry({
  dsn: 'your-sentry-dsn-here',
  environment: process.env.NODE_ENV,
  release: `meqenet@${process.env.npm_package_version}`,
  sampleRate: 1.0,
  tracesSampleRate: 0.1,
});
```

### Error Boundary with Sentry

```tsx
import ErrorBoundary from '@frontend/ui';

function App({ Component, pageProps }) {
  return (
    <ErrorBoundary
      showErrorDetails={process.env.NODE_ENV === 'development'}
    >
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
```

## Best Practices

### 1. Error Boundary Usage

```tsx
// ✅ Good: Wrap entire app
function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}

// ✅ Good: Wrap route components
function Dashboard() {
  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <DashboardContent />
    </ErrorBoundary>
  );
}

// ❌ Bad: Too granular (performance impact)
function Button({ onClick }) {
  return (
    <ErrorBoundary>
      <button onClick={onClick}>Click me</button>
    </ErrorBoundary>
  );
}
```

### 2. API Client Error Handling

```tsx
// ✅ Good: Centralized error handling
import apiClient from '@frontend/api-client';

const apiService = {
  async getUser(id: string) {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      // Handle specific error types
      if (error.status === 404) {
        throw new UserNotFoundError(id);
      }
      if (error.status === 403) {
        throw new AccessDeniedError();
      }
      throw new ApiError(error.message);
    }
  }
};

// ✅ Good: React hooks with error handling
function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, data, execute };
}
```

### 3. Sentry Configuration

```tsx
// ✅ Good: Environment-specific configuration
const sentryConfig = {
  development: {
    dsn: 'your-dev-dsn',
    environment: 'development',
    debug: true,
    sampleRate: 1.0,
  },
  staging: {
    dsn: 'your-staging-dsn',
    environment: 'staging',
    sampleRate: 0.5,
  },
  production: {
    dsn: 'your-prod-dsn',
    environment: 'production',
    sampleRate: 0.1,
  }
};

initSentry(sentryConfig[process.env.NODE_ENV] || sentryConfig.development);
```

## Examples

### Complete App Setup

```tsx
// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@frontend/ui';
import { initSentry } from '@frontend/ui';

// Initialize Sentry
initSentry({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

function App() {
  return (
    <ErrorBoundary
      showErrorDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Custom error logging
        console.error('App Error:', error, errorInfo);
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
```

### API Service with Error Handling

```tsx
// services/userService.ts
import apiClient from '@frontend/api-client';

export interface User {
  id: string;
  name: string;
  email: string;
}

export class UserServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export class UserService {
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch (error) {
      if (error.status === 401) {
        throw new UserServiceError('User not authenticated', 401);
      }
      if (error.status === 404) {
        throw new UserServiceError('User profile not found', 404);
      }
      throw new UserServiceError('Failed to fetch user profile', error.status);
    }
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put(`/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      if (error.status === 422) {
        throw new UserServiceError('Invalid user data', 422);
      }
      throw new UserServiceError('Failed to update user', error.status);
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${userId}`);
    } catch (error) {
      throw new UserServiceError('Failed to delete user', error.status);
    }
  }
}
```

### React Hook with Error Boundary

```tsx
// hooks/useAsyncError.ts
import { useCallback } from 'react';

export function useAsyncError() {
  const [, setError] = useState();

  return useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}
```

```tsx
// components/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { UserService, UserServiceError } from '../services/userService';
import { useAsyncError } from '../hooks/useAsyncError';

interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const throwError = useAsyncError();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await UserService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        if (error instanceof UserServiceError) {
          // Handle specific service errors
          throwError(error);
        } else {
          // Handle unexpected errors
          throwError(new Error('Unexpected error occurred'));
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, throwError]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

## Migration Guide

### From Basic Error Boundary

```tsx
// Before
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <AppContent />
    </ErrorBoundary>
  );
}

// After
import ErrorBoundary from '@frontend/ui';

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
```

### From Axios to Enhanced API Client

```tsx
// Before
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.example.com'
});

// After
import apiClient from '@frontend/api-client';

// Automatic interceptors, error handling, and retry logic included
```

## Troubleshooting

### Common Issues

1. **Sentry not initialized**
   ```tsx
   // Make sure to initialize Sentry before using ErrorBoundary
   import { initSentry } from '@frontend/ui';

   initSentry({
     dsn: 'your-dsn-here',
     environment: process.env.NODE_ENV
   });
   ```

2. **API client not working**
   ```tsx
   // Check if API configuration is set
   import { apiConfig } from '@frontend/config';

   console.log('API Base URL:', apiConfig.getBaseURL());
   ```

3. **Error boundary not catching errors**
   ```tsx
   // Ensure ErrorBoundary wraps the component that throws
   <ErrorBoundary>
     <ComponentThatMightThrow />
   </ErrorBoundary>
   ```

### Debug Mode

```tsx
// Enable detailed error logging
const errorBoundary = (
  <ErrorBoundary
    showErrorDetails={true}
    onError={(error, errorInfo) => {
      console.log('Error caught:', error);
      console.log('Error info:', errorInfo);
    }}
  >
    <App />
  </ErrorBoundary>
);
```

## Contributing

When adding new shared components:

1. **Follow the established patterns** for consistency
2. **Add comprehensive TypeScript types**
3. **Include usage examples** in this README
4. **Add error handling** and edge cases
5. **Update documentation** with new features

## Version History

- **v1.0.0**: Initial release with ErrorBoundary and API client
- **v1.1.0**: Added Sentry integration and enhanced error handling
- **v1.2.0**: Added retry logic and request/response interceptors
- **v1.3.0**: Added PWA compliance testing and documentation examples

---

*Built with ❤️ by the Meqenet Frontend Team*
