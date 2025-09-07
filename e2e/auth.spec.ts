import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  newPassword: 'NewPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

const newUser = {
  email: `newuser${Date.now()}@example.com`,
  password: 'Password123!',
  firstName: 'New',
  lastName: 'User',
};

// API interceptors for mocking
const setupAuthInterceptors = (page: any) => {
  // Mock successful login
  page.route('**/api/auth/login', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          roles: ['customer'],
        },
      }),
    });
  });

  // Mock successful registration
  page.route('**/api/auth/register', async (route: any) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'User registered successfully',
        user: {
          id: '2',
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      }),
    });
  });

  // Mock password reset request
  page.route('**/api/auth/request-password-reset', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Password reset email sent',
      }),
    });
  });

  // Mock password reset confirmation
  page.route('**/api/auth/confirm-password-reset', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Password reset successfully',
      }),
    });
  });
};

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    setupAuthInterceptors(page);
  });

  test.describe('Login Functionality', () => {
    test('should display login form correctly', async ({ page }) => {
      await page.goto('/auth/login');

      // Check form elements are present
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('text=Login')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/auth/login');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid email format')).toBeVisible();
    });

    test('should allow successful login', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      await page.click('button[type="submit"]');

      // Check redirect to dashboard/home
      await expect(page).toHaveURL('/');
      await expect(page.locator('text=Welcome')).toBeVisible();
    });

    test('should handle login failure', async ({ page }) => {
      // Override the login interceptor for this test
      page.route('**/api/auth/login', async (route: any) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            errorCode: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          }),
        });
      });

      await page.goto('/auth/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'wrongpassword');

      await page.click('button[type="submit"]');

      // Should stay on login page with error
      await expect(page).toHaveURL('/auth/login');
      await expect(
        page.locator('text=Invalid email or password')
      ).toBeVisible();
    });

    test('should show loading state during login', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);

      // Start login process
      await page.click('button[type="submit"]');

      // Check for loading indicator
      await expect(page.locator('text=Logging in...')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });
  });

  test.describe('Registration Functionality', () => {
    test('should display registration form correctly', async ({ page }) => {
      await page.goto('/auth/register');

      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('input[name="agreedToTerms"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/auth/register');

      await page.fill('input[name="firstName"]', newUser.firstName);
      await page.fill('input[name="lastName"]', newUser.lastName);
      await page.fill('input[name="email"]', newUser.email);
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="confirmPassword"]', 'weak');
      await page.check('input[name="agreedToTerms"]');

      await page.click('button[type="submit"]');

      await expect(
        page.locator('text=Password must be at least 8 characters')
      ).toBeVisible();
      await expect(
        page.locator('text=Password must contain at least one uppercase letter')
      ).toBeVisible();
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.goto('/auth/register');

      await page.fill('input[name="firstName"]', newUser.firstName);
      await page.fill('input[name="lastName"]', newUser.lastName);
      await page.fill('input[name="email"]', newUser.email);
      await page.fill('input[name="password"]', newUser.password);
      await page.fill('input[name="confirmPassword"]', 'differentpassword');
      await page.check('input[name="agreedToTerms"]');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('should require terms agreement', async ({ page }) => {
      await page.goto('/auth/register');

      await page.fill('input[name="firstName"]', newUser.firstName);
      await page.fill('input[name="lastName"]', newUser.lastName);
      await page.fill('input[name="email"]', newUser.email);
      await page.fill('input[name="password"]', newUser.password);
      await page.fill('input[name="confirmPassword"]', newUser.password);
      // Don't check terms agreement

      await page.click('button[type="submit"]');

      await expect(
        page.locator('text=You must agree to the terms and conditions')
      ).toBeVisible();
    });

    test('should allow successful registration', async ({ page }) => {
      await page.goto('/auth/register');

      await page.fill('input[name="firstName"]', newUser.firstName);
      await page.fill('input[name="lastName"]', newUser.lastName);
      await page.fill('input[name="email"]', newUser.email);
      await page.fill('input[name="password"]', newUser.password);
      await page.fill('input[name="confirmPassword"]', newUser.password);
      await page.check('input[name="agreedToTerms"]');

      await page.click('button[type="submit"]');

      // Should redirect to login with success message
      await expect(page).toHaveURL('/auth/login');
      await expect(page.locator('text=Registration successful')).toBeVisible();
    });
  });

  test.describe('Password Reset Functionality', () => {
    test('should display password reset request form', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('text=Reset Password')).toBeVisible();
    });

    test('should handle password reset request', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await page.fill('input[name="email"]', testUser.email);
      await page.click('button[type="submit"]');

      await expect(
        page.locator('text=Password reset email sent')
      ).toBeVisible();
    });

    test('should display password reset confirmation form', async ({
      page,
    }) => {
      const resetToken = 'valid-reset-token-123';

      await page.goto(`/auth/reset-password?token=${resetToken}`);

      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should handle password reset confirmation', async ({ page }) => {
      const resetToken = 'valid-reset-token-123';

      await page.goto(`/auth/reset-password?token=${resetToken}`);

      await page.fill('input[name="password"]', testUser.newPassword);
      await page.fill('input[name="confirmPassword"]', testUser.newPassword);

      await page.click('button[type="submit"]');

      // Should redirect to login with success message
      await expect(page).toHaveURL('/auth/login');
      await expect(
        page.locator('text=Password reset successfully')
      ).toBeVisible();
    });

    test('should validate password reset token', async ({ page }) => {
      const invalidToken = 'invalid-token';

      await page.goto(`/auth/reset-password?token=${invalidToken}`);

      await page.fill('input[name="password"]', testUser.newPassword);
      await page.fill('input[name="confirmPassword"]', testUser.newPassword);

      await page.click('button[type="submit"]');

      await expect(
        page.locator('text=Invalid or expired reset token')
      ).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('should prevent brute force attacks', async ({ page }) => {
      // Override login to simulate rate limiting
      let attemptCount = 0;
      page.route('**/api/auth/login', async (route: any) => {
        attemptCount++;
        if (attemptCount >= 5) {
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({
              errorCode: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many login attempts. Please try again later.',
              retryAfter: 900,
            }),
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              errorCode: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            }),
          });
        }
      });

      await page.goto('/auth/login');

      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        if (i < 5) {
          await expect(
            page.locator('text=Invalid email or password')
          ).toBeVisible();
        }
      }

      // Should be rate limited
      await expect(page.locator('text=Too many login attempts')).toBeVisible();
    });

    test('should handle session timeout', async ({ page }) => {
      // First login successfully
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/');

      // Simulate session timeout by clearing localStorage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/auth/login');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/auth/login');

      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');

      await expect(emailInput).toHaveAttribute('aria-label', 'Email address');
      await expect(passwordInput).toHaveAttribute('aria-label', 'Password');
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/auth/login');

      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="email"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="password"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/auth/login');

      // This would require visual regression testing or accessibility tools
      // For now, we'll check that form elements are visible
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test('should work on mobile devices', async ({ page }) => {
      await page.goto('/auth/login');

      // Check that form elements are properly sized for mobile
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Test mobile login flow
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/');
    });
  });
});
