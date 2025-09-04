import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Homepage Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should pass axe accessibility scan', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);

    // Check for main heading
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
  });

  test('should have proper focus management', async ({ page }) => {
    // Get all focusable elements
    const focusableElements = await page.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();

    expect(focusableElements.length).toBeGreaterThan(0);

    // Test tab navigation
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeDefined();
  });

  test('should have proper color contrast', async ({ page }) => {
    // This would be handled by axe-core, but we can add specific contrast checks
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    const contrastViolations = contrastResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(contrastViolations.length).toBe(0);
  });

  test('should have proper alt text for images', async ({ page }) => {
    const images = await page.locator('img').all();
    for (const image of images) {
      const altText = await image.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"], textarea, select').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Either aria-label, aria-labelledby, or associated label should exist
      const hasLabel = Boolean(ariaLabel || ariaLabelledBy || (id && await page.locator(`label[for="${id}"]`).count() > 0));
      expect(hasLabel).toBe(true);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test that buttons are keyboard accessible
    const buttons = await page.locator('button:not([disabled])').all();

    for (let i = 0; i < Math.min(buttons.length, 3); i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').all();
    expect(landmarks.length).toBeGreaterThan(0);
  });

  test('should handle mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test touch targets are adequately sized
    const buttons = await page.locator('button, [role="button"], input[type="submit"], a').all();

    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        // Minimum touch target size should be 44x44px
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should work with screen readers', async ({ page }) => {
    // Test that interactive elements have proper accessible names
    const interactiveElements = await page.locator('button, [role="button"], a[href], input, select, textarea').all();

    for (const element of interactiveElements) {
      const accessibleName = await element.getAttribute('aria-label') ||
                            await element.getAttribute('aria-labelledby') ||
                            await element.textContent();

      expect(accessibleName?.trim()).toBeTruthy();
    }
  });
});
