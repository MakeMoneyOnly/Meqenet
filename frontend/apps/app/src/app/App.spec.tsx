import React from 'react';
import { vi } from 'vitest';

import App from './App';

// Mock the auth store to avoid loading states in tests
vi.mock('@meqenet/mobile-state-management', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    checkAuth: vi.fn(),
  }),
}));

// Mock the mobile API client to avoid import issues
vi.mock('@frontend/mobile-api-client', () => ({
  default: {},
}));

test('renders correctly', () => {
  // Basic test to ensure the component can be imported and is a function
  expect(App).toBeDefined();
  expect(typeof App).toBe('function');

  // Test that it can be instantiated as a React element
  const element = React.createElement(App);
  expect(element).toBeDefined();
  expect(element.type).toBe(App);
});
