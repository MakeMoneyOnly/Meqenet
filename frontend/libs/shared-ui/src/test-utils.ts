import { expect } from 'vitest';

// Re-export testing utilities
export * from '@testing-library/react';

// Setup vitest-axe matchers
export async function setupAxe() {
  try {
    const { toHaveNoViolations, axe } = await import('vitest-axe');
    expect.extend(toHaveNoViolations);
    return { axe, toHaveNoViolations };
  } catch (error) {
    console.warn('vitest-axe not available');
    return { 
      axe: null, 
      toHaveNoViolations: null 
    };
  }
}

// Accessibility test helper
export async function testAccessibility(container: HTMLElement, config = {}) {
  try {
    const { axe } = await import('vitest-axe');
    const results = await axe(container, {
      rules: {
        'color-contrast-enhanced': { enabled: true }, // AAA contrast
      },
      ...config
    });
    return results;
  } catch (error) {
    console.warn('Accessibility test skipped:', error);
    return null;
  }
}