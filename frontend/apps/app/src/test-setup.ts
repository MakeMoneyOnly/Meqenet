import React from 'react';
import { vi } from 'vitest';

// Mock Sentry to avoid network calls and allow assertions
vi.mock('@sentry/react-native', () => {
  const captureException = vi.fn();

  const api = {
    init: vi.fn(),
    captureException,
    wrap: (Comp: React.ComponentType): React.ComponentType => Comp, // pass-through
  };

  // Support both named and default imports
  return {
    __esModule: true,
    ...api,
    default: api,
  };
});
