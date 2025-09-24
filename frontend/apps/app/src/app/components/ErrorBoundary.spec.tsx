import React from 'react';

import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('component exists and is properly exported', () => {
    expect(ErrorBoundary).toBeDefined();
    expect(typeof ErrorBoundary).toBe('function');
  });

  it('can be instantiated', () => {
    const boundary = React.createElement(ErrorBoundary, null, 'test');
    expect(boundary).toBeDefined();
  });
});
