import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow a user to log in', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should allow a user to register', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/auth/login');
  });

  test('should allow a user to reset their password', async ({ page }) => {
    await page.goto('/auth/request-password-reset');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // This part of the flow would require email interaction, which is out of scope for this test.
    // We will assume the user gets a token and navigates to the confirm page.

    // For the purpose of the test, we can navigate directly to the confirm page with a dummy token.
    await page.goto('/auth/confirm-password-reset?token=dummy-token');

    await page.fill('input[name="password"]', 'newpassword123');
    await page.fill('input[name="confirmPassword"]', 'newpassword123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/auth/login');
  });
});
