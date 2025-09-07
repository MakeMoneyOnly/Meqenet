# Shared UI Components Library

## Overview

A comprehensive, enterprise-grade UI component library designed specifically for FinTech applications. Built with React, TypeScript, and modern design principles, this library provides consistent, accessible, and secure components for both web and mobile platforms.

## 🚀 Features

### ✅ Enterprise-Grade Quality
- **TypeScript First**: Full type safety with strict typing
- **Accessibility**: WCAG 2.1 AA compliant components
- **Security**: Input sanitization and secure form handling
- **Performance**: Optimized rendering and bundle size
- **Testing**: Comprehensive unit and integration tests

### 📱 Cross-Platform Support
- **Web**: React DOM components for web applications
- **Mobile**: React Native components for mobile apps
- **Responsive**: Consistent experience across all devices

### 🛡️ FinTech Compliance
- **PCI DSS**: Secure input handling for sensitive data
- **GDPR**: Privacy-focused design and data handling
- **Accessibility**: Screen reader and keyboard navigation support

## 📦 Components

### Core Components

#### 🔘 Button
Multi-platform button component with variants and accessibility features.

```tsx
import { Button } from '@frontend/shared-ui';

<Button
  title="Continue"
  onPress={handleContinue}
  variant="primary"
  disabled={isLoading}
/>
```

**Features:**
- Primary and secondary variants
- Loading states
- Accessibility labels
- Touch-friendly sizing
- Platform-specific optimizations

#### 📝 Input
Secure input component with validation and accessibility.

```tsx
import { Input } from '@frontend/shared-ui';

<Input
  label="Email Address"
  type="email"
  value={email}
  onChange={setEmail}
  error={emailError}
  placeholder="Enter your email"
/>
```

**Features:**
- Input validation
- Error state handling
- Accessibility labels
- Secure text entry
- Auto-complete support

#### 📋 Form
Form wrapper with validation and submission handling.

```tsx
import { Form, Input, Button } from '@frontend/shared-ui';

<Form onSubmit={handleSubmit}>
  <Input label="Email" type="email" required />
  <Input label="Password" type="password" required />
  <Button title="Login" type="submit" />
</Form>
```

**Features:**
- Form validation
- Submission handling
- CSRF protection
- Rate limiting
- Security headers

#### 💳 Payment Plan Card
Specialized component for displaying payment plans.

```tsx
import { PaymentPlanCard } from '@frontend/shared-ui';

<PaymentPlanCard
  planName="Premium Plan"
  amount={299.99}
  installments={12}
  installmentAmount={24.99}
/>
```

**Features:**
- Currency formatting
- Installment calculation
- Accessibility labels
- Responsive design
- RTL support

## 🏗️ Architecture

### File Structure
```
src/
├── components/          # Platform-agnostic components
│   ├── Button.tsx       # Cross-platform exports
│   ├── Button.web.tsx   # Web implementation
│   ├── Button.native.tsx # Mobile implementation
│   └── ...
├── lib/                 # Utility functions
├── index.ts            # Main exports
└── types.ts            # TypeScript definitions
```

### Platform Detection
Components automatically detect the platform and use appropriate implementations:

```tsx
// Button.tsx - Cross-platform export
export { default as Button } from './Button.web'; // Web default
// Mobile apps override this via metro.config.js
```

## 🎨 Design System

### Colors
```typescript
export const colors = {
  primary: '#16a34a',
  secondary: '#0f172a',
  error: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  info: '#2563eb',
};
```

### Typography
```typescript
export const typography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  },
};
```

### Spacing
```typescript
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
};
```

## ♿ Accessibility

All components are built with accessibility as a first-class citizen:

### ARIA Support
- Proper ARIA labels and descriptions
- Screen reader announcements
- Keyboard navigation support
- Focus management

### Keyboard Navigation
- Tab order management
- Enter/Space key handling
- Escape key support for modals
- Arrow key navigation for lists

### Screen Reader Support
- Semantic HTML structure
- Live region announcements
- Error message announcements
- Progress updates

## 🔒 Security Features

### Input Sanitization
```typescript
// Automatic XSS prevention
const sanitizedValue = sanitizeInput(dirtyValue);
```

### CSRF Protection
```typescript
// Automatic CSRF token inclusion
const csrfToken = await getCsrfToken();
```

### Secure Storage
```typescript
// Platform-specific secure storage
await SecureStore.setItem('token', token);
```

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Visual Regression Tests
```bash
npm run test:visual
```

### Accessibility Tests
```bash
npm run test:a11y
```

## 📚 Usage Examples

### Authentication Form
```tsx
import { Form, Input, Button } from '@frontend/shared-ui';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = async (event) => {
    try {
      await login({ email, password });
      // Handle success
    } catch (error) {
      setErrors(error.validationErrors);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        required
      />
      <Button title="Login" type="submit" variant="primary" />
    </Form>
  );
};
```

### Payment Plan Display
```tsx
import { PaymentPlanCard } from '@frontend/shared-ui';

export const PaymentPlans = () => {
  const plans = [
    { name: 'Basic', amount: 99.99, installments: 3 },
    { name: 'Premium', amount: 199.99, installments: 6 },
    { name: 'Enterprise', amount: 399.99, installments: 12 },
  ];

  return (
    <div className="payment-plans">
      {plans.map(plan => (
        <PaymentPlanCard
          key={plan.name}
          planName={plan.name}
          amount={plan.amount}
          installments={plan.installments}
          installmentAmount={plan.amount / plan.installments}
        />
      ))}
    </div>
  );
};
```

## 🔧 Development

### Adding New Components
1. Create component files in `src/components/`
2. Add web and native implementations
3. Create Storybook stories
4. Add unit tests
5. Update exports in `index.ts`
6. Update documentation

### Component Guidelines
- Use TypeScript for all components
- Include proper JSDoc comments
- Implement accessibility features
- Add platform-specific optimizations
- Include comprehensive tests

## 📊 Bundle Analysis

### Bundle Size Goals
- Core components: < 50KB gzipped
- Full library: < 150KB gzipped
- Per component: < 5KB gzipped

## 🤝 Contributing

### Development Setup
```bash
git clone <repository>
cd shared-ui
npm install
npm run storybook # Start Storybook
npm run test:watch # Start test watcher
```

### Code Style
- ESLint configuration
- Prettier formatting
- Husky pre-commit hooks
- Commit message conventions

### Pull Request Process
1. Create feature branch
2. Write tests first (TDD)
3. Implement component
4. Update documentation
5. Create Storybook stories
6. Submit PR with description

## 📈 Roadmap

### Q1 2025
- [ ] Advanced form validation
- [ ] Date picker component
- [ ] File upload component
- [ ] Toast notifications

### Q2 2025
- [ ] Chart components
- [ ] Table component
- [ ] Advanced modal system
- [ ] Theme customization

### Q3 2025
- [ ] Animation system
- [ ] Icon library integration
- [ ] Dark mode support
- [ ] RTL language support

## 📄 License

This library is part of the Meqenet enterprise platform and follows the project's licensing terms.

## 📞 Support

For support and questions:
- 📧 Email: support@meqenet.com
- 💬 Slack: #frontend-components
- 📖 Documentation: [Internal Wiki](https://wiki.meqenet.com/shared-ui)
