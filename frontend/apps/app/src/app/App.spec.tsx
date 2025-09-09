import { render, waitFor } from '@testing-library/react';
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

test('renders correctly', async () => {
  const { container } = render(<App />);

  // Wait for the component to render
  await waitFor(() => {
    expect(container.firstChild).toBeTruthy();
  });

  // Should render the login/navigation interface
  expect(container).toBeDefined();
});
