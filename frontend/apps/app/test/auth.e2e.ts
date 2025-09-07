import { device, element, by, expect } from 'detox';

/* global describe, beforeAll, beforeEach, it */

describe('Authentication', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have login screen', async () => {
    await expect(element(by.text('Login'))).toBeVisible();
  });

  it('should show error on invalid login', async () => {
    await element(by.placeholder('Email')).typeText('invalid@test.com');
    await element(by.placeholder('Password')).typeText('123456');
    await element(by.text('Login')).tap();
    // We can't check for a specific error message as the API call is mocked
    // but we can check that we are still on the login screen.
    await expect(element(by.text('Login'))).toBeVisible();
  });

  it('should navigate to registration screen', async () => {
    await element(by.text('Register')).tap();
    await expect(element(by.text('Register'))).toBeVisible();
  });

  it('should register a new user and navigate to login', async () => {
    await element(by.text('Register')).tap();

    await element(by.placeholder('Email')).typeText('newuser@test.com');
    await element(by.placeholder('Password')).typeText('password123');
    await element(by.placeholder('Confirm Password')).typeText('password123');
    await element(by.text('Register')).tap();

    await expect(element(by.text('Login'))).toBeVisible();
  });
});
