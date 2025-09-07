# End-to-End Testing Suite

## Overview

This directory contains comprehensive end-to-end (E2E) tests for the Meqenet application, covering both web and mobile platforms. The test suite ensures critical user journeys work correctly across different browsers, devices, and network conditions.

## Test Structure

### Web E2E Tests (`e2e/`)
- **Authentication Flow** (`auth.spec.ts`): Complete login, registration, and password reset testing
- **Accessibility Tests** (`accessibility/`): WCAG compliance and screen reader support

### Mobile E2E Tests (`frontend/apps/app/test/`)
- **Basic Auth Tests** (`auth.e2e.ts`): Core mobile authentication functionality
- **Comprehensive Auth Tests** (`mobile-auth.e2e.ts`): Advanced mobile-specific features

## Test Categories

### 🔐 Authentication Tests
- User login/logout flows
- User registration with validation
- Password reset functionality
- Multi-factor authentication (MFA)
- Biometric authentication (mobile)
- Session management and timeout

### 🛡️ Security Tests
- Rate limiting and brute force protection
- Input validation and sanitization
- Secure token handling
- Session hijacking prevention
- SQL injection and XSS prevention

### 📱 Mobile-Specific Tests
- Native form interactions
- Biometric authentication
- Offline functionality
- Push notifications
- Deep linking
- Device permission handling

### ♿ Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Color contrast ratios
- ARIA label validation
- Focus management

### 🌐 Cross-Platform Tests
- Responsive design validation
- Multi-language support
- Network condition simulation
- Browser compatibility

## Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm run dev  # Web app on port 3000
pnpm run dev:backend  # API server on port 4000

# For mobile tests
cd frontend/apps/app
pnpm install
npx detox build --configuration ios.simulator
```

### Web E2E Tests

```bash
# Run all web E2E tests
npx playwright test

# Run specific test file
npx playwright test auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests with UI mode
npx playwright test --ui

# Generate test report
npx playwright show-report
```

### Mobile E2E Tests

```bash
# Build and run iOS tests
cd frontend/apps/app
npx detox test --configuration ios.simulator

# Build and run Android tests
npx detox test --configuration android.emu.debug

# Run specific test file
npx detox test --configuration ios.simulator auth.e2e.ts
```

### Accessibility Tests

```bash
# Run accessibility tests
npx playwright test accessibility/

# Generate accessibility report
npx playwright show-report
```

## Test Configuration

### Playwright Configuration (`playwright.e2e.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'e2e-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'e2e-webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  reporter: [
    ['html', { outputFolder: 'reports/playwright-e2e' }],
    ['json', { outputFile: 'reports/e2e-results.json' }],
    ['junit', { outputFile: 'reports/e2e-junit.xml' }],
  ],
});
```

### Detox Configuration (Mobile)

```json
{
  "configurations": {
    "ios.simulator": {
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/Meqenet.app",
      "build": "xcodebuild -workspace ios/Meqenet.xcworkspace -scheme Meqenet -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 12"
      }
    },
    "android.emu.debug": {
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
      "build": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug",
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_3a_API_30"
      }
    }
  }
}
```

## Test Data Management

### Mock API Responses

```typescript
const setupAuthInterceptors = (page: any) => {
  // Mock successful login
  page.route('**/api/auth/login', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com' },
      }),
    });
  });
};
```

### Test User Accounts

```typescript
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
};
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: reports/playwright-e2e/

  e2e-mobile:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend/apps/app && pnpm install
      - run: cd frontend/apps/app && npx detox build --configuration ios.simulator
      - run: cd frontend/apps/app && npx detox test --configuration ios.simulator
```

## Best Practices

### Test Organization
1. **Group related tests** in describe blocks
2. **Use page objects** for complex interactions
3. **Mock external dependencies** for reliable tests
4. **Use meaningful test names** that describe behavior
5. **Keep tests independent** and isolated

### Test Reliability
1. **Wait for elements** instead of using fixed delays
2. **Handle async operations** properly
3. **Clean up test data** after each test
4. **Use stable selectors** (prefer data-testid over CSS)
5. **Handle network failures** gracefully

### Mobile Testing Best Practices
1. **Test on real devices** when possible
2. **Handle device permissions** appropriately
3. **Test different screen sizes** and orientations
4. **Consider network conditions** (offline, slow connection)
5. **Test biometric authentication** flows

## Debugging Tests

### Web Tests
```bash
# Run tests in debug mode
npx playwright test --debug

# Step through test execution
npx playwright test --headed --slowMo=1000

# Generate trace files
npx playwright test --trace on
```

### Mobile Tests
```bash
# Run tests with verbose logging
npx detox test --loglevel verbose

# Take screenshots on failure
npx detox test --take-screenshots failing

# Record test execution
npx detox test --record-videos failing
```

## Performance Testing

### Lighthouse Integration
```typescript
import { playAudit } from 'playwright-lighthouse';

test('should pass lighthouse audit', async ({ page }) => {
  await page.goto('/');
  await playAudit({
    page,
    thresholds: {
      performance: 85,
      accessibility: 90,
      'best-practices': 85,
      seo: 85,
    },
  });
});
```

## Test Coverage

### Coverage Goals
- **Authentication flows**: 95% coverage
- **Error handling**: 90% coverage
- **Edge cases**: 85% coverage
- **Accessibility**: 90% coverage

### Coverage Report
```bash
# Generate coverage report
npx nyc report --reporter=html

# View coverage report
open coverage/index.html
```

## Contributing

When adding new E2E tests:

1. **Follow naming conventions**: `*.spec.ts` for web, `*.e2e.ts` for mobile
2. **Add test data** to appropriate constants
3. **Mock external APIs** to ensure test reliability
4. **Include accessibility checks** for new features
5. **Update documentation** with new test scenarios
6. **Add performance benchmarks** for critical paths

## Troubleshooting

### Common Issues

#### Web Tests
- **Element not found**: Check selector stability
- **Timeout errors**: Increase timeout or wait for elements
- **Flaky tests**: Add retry logic or stabilize test data

#### Mobile Tests
- **Build failures**: Clean build artifacts and rebuild
- **Simulator issues**: Reset simulator or use different device
- **Permission dialogs**: Handle permissions in test setup

#### CI/CD Issues
- **Network timeouts**: Increase timeout values
- **Resource constraints**: Reduce parallelism
- **Artifact upload failures**: Check storage limits

## Future Enhancements

### Planned Features
- [ ] **Visual regression testing** with Applitools
- [ ] **Load testing integration** with k6
- [ ] **Cross-browser visual comparison**
- [ ] **Automated accessibility auditing**
- [ ] **Performance regression detection**
- [ ] **Mobile device farm integration**

### Integration Opportunities
- [ ] **TestRail integration** for test management
- [ ] **Slack notifications** for test results
- [ ] **Jira integration** for bug tracking
- [ ] **Datadog integration** for monitoring
- [ ] **BrowserStack integration** for cross-device testing
