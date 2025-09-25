import { device, element, by, expect, waitFor } from 'detox';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
};

const newUser = {
  email: `mobileuser${Date.now()}@example.com`,
  password: 'MobileTest123!',
  firstName: 'Mobile',
  lastName: 'User',
};

// Helper functions
const loginUser = async (email: string, password: string) => {
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-button')).tap();
};

const registerUser = async (userData: typeof newUser) => {
  await element(by.id('register-link')).tap();

  await element(by.id('firstName-input')).typeText(userData.firstName);
  await element(by.id('lastName-input')).typeText(userData.lastName);
  await element(by.id('email-input')).typeText(userData.email);
  await element(by.id('password-input')).typeText(userData.password);
  await element(by.id('confirmPassword-input')).typeText(userData.password);
  await element(by.id('terms-checkbox')).tap();
  await element(by.id('register-button')).tap();
};

const waitForElement = async (
  elementMatcher: ReturnType<typeof by>,
  timeout = 5000,
) => {
  await waitFor(element(elementMatcher)).toBeVisible().withTimeout(timeout);
};

describe('Mobile Authentication Basic Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: {
        notifications: 'YES',
        camera: 'YES',
        microphone: 'YES',
        photos: 'YES',
        contacts: 'YES',
        location: 'always',
        faceid: 'YES',
        userTracking: 'YES',
      },
      launchArgs: {
        detoxPrintBusyIdleResources: 'YES',
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Wait for app to load
    await waitForElement(by.id('login-screen'));
  });

  it('should display login screen correctly', async () => {
    await expect(element(by.id('login-screen'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-button'))).toBeVisible();
    await expect(element(by.id('register-link'))).toBeVisible();
  });

  it('should handle successful login', async () => {
    await loginUser(testUser.email, testUser.password);

    // Should navigate to home/dashboard screen
    await waitForElement(by.id('home-screen'));
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should handle login failure', async () => {
    await element(by.id('email-input')).typeText(testUser.email);
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();

    // Should show error message and stay on login screen
    await expect(element(by.text('Invalid email or password'))).toBeVisible();
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should navigate to registration screen', async () => {
    await element(by.id('register-link')).tap();

    await expect(element(by.id('register-screen'))).toBeVisible();
    await expect(element(by.id('firstName-input'))).toBeVisible();
    await expect(element(by.id('lastName-input'))).toBeVisible();
  });

  it('should handle successful registration', async () => {
    await registerUser(newUser);

    // Should show success message and navigate to login
    await expect(element(by.text('Registration successful'))).toBeVisible();
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should handle rate limiting', async () => {
    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await element(by.id('email-input')).clearText();
      await element(by.id('password-input')).clearText();

      await element(by.id('email-input')).typeText(testUser.email);
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();

      if (i < 5) {
        await expect(
          element(by.text('Invalid email or password')),
        ).toBeVisible();
      }
    }

    // Should be rate limited
    await expect(element(by.text('Too many login attempts'))).toBeVisible();
  });
});
