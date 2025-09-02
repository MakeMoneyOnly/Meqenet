import { expect } from 'vitest';
import { axe, toHaveNoViolations } from 'vitest-axe';
import '@testing-library/jest-dom/vitest';

// Extend Vitest matchers with accessibility matchers
expect.extend(toHaveNoViolations);

// Configure axe-core for WCAG 2.1 AAA compliance
export const axeConfig = {
  rules: {
    // WCAG 2.1 AAA rules
    'color-contrast-enhanced': { enabled: true }, // 7:1 contrast ratio for AAA
    'focus-order-semantics': { enabled: true },
    'hidden-content': { enabled: true },
    'identical-links-same-purpose': { enabled: true },
    'label-content-name-mismatch': { enabled: true },
    'aria-allowed-role': { enabled: true },
    'aria-command-name': { enabled: true },
    'aria-dialog-name': { enabled: true },
    'aria-meter-name': { enabled: true },
    'aria-progressbar-name': { enabled: true },
    'aria-tooltip-name': { enabled: true },
    'aria-treeitem-name': { enabled: true },
  },
  // Check for AAA level compliance
  conformanceLevel: 'AAA',
};

// Utility function to run accessibility tests
export async function testAccessibility(
  container: HTMLElement,
  customConfig = {}
) {
  const config = { ...axeConfig, ...customConfig };
  const results = await axe(container, config);
  expect(results).toHaveNoViolations();
  return results;
}