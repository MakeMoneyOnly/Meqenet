# Meqenet Shared UI Component Library

A comprehensive React component library for the Meqenet BNPL (Buy Now, Pay Later) platform, featuring specialized financial components with full WCAG 2.1 AAA accessibility compliance.

## 📦 Installation

```bash
pnpm add @frontend/shared-ui
```

## 🎯 Features

- **Financial Components**: Specialized components for BNPL and financial services
- **WCAG 2.1 AAA Compliant**: Full accessibility support with enhanced contrast ratios
- **TypeScript Support**: Full type definitions included
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Ethiopian Market Focus**: Support for Ethiopian payment methods and currency (ETB)
- **Comprehensive Testing**: Unit tests and accessibility tests for all components

## 🧩 Components

### Core UI Components

#### Button
Basic button component with various styles and states.

```tsx
import { Button } from '@frontend/shared-ui';

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

#### Card
Container component with header and content sections.

```tsx
import { Card, CardHeader, CardContent } from '@frontend/shared-ui';

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### Input
Form input component with label and validation support.

```tsx
import { Input } from '@frontend/shared-ui';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  error={emailError}
/>
```

#### Modal
Modal dialog component for overlays.

```tsx
import { Modal } from '@frontend/shared-ui';

<Modal isOpen={isOpen} onClose={handleClose}>
  <ModalContent />
</Modal>
```

### Financial Components

#### PaymentPlanCard
Display payment plan options with installment details.

```tsx
import { PaymentPlanCard } from '@frontend/shared-ui';

<PaymentPlanCard
  planName="Pay in 3"
  description="Split payment into 3 monthly installments"
  installments={3}
  interestRate="0%"
  isSelected={selectedPlan === 'pay-in-3'}
  onSelect={() => setSelectedPlan('pay-in-3')}
/>
```

#### ProgressIndicator
Multi-step progress indicator for workflows.

```tsx
import { ProgressIndicator } from '@frontend/shared-ui';

<ProgressIndicator
  currentStep={2}
  totalSteps={5}
  steps={['Personal Info', 'KYC', 'Loan Details', 'Review', 'Confirm']}
/>
```

#### LoanSummaryCard
Comprehensive loan information display with payment actions.

```tsx
import { LoanSummaryCard } from '@frontend/shared-ui';

<LoanSummaryCard
  loan={{
    loanId: 'LN-2024-001',
    totalAmount: 11200,
    paidAmount: 3360,
    remainingAmount: 7840,
    nextPaymentDate: '2024-02-15',
    nextPaymentAmount: 1120,
    installmentsPaid: 3,
    totalInstallments: 10,
    status: 'active',
    currency: 'ETB'
  }}
  onViewDetails={handleViewDetails}
  onMakePayment={handleMakePayment}
/>
```

#### InstallmentSchedule
Detailed payment schedule with interactive payment options.

```tsx
import { InstallmentSchedule } from '@frontend/shared-ui';

<InstallmentSchedule
  installments={installments}
  currency="ETB"
  onPayInstallment={handlePayInstallment}
  showPayButton={true}
/>
```

#### CreditScoreIndicator
Visual credit score display with gauge and factors.

```tsx
import { CreditScoreIndicator } from '@frontend/shared-ui';

<CreditScoreIndicator
  score={720}
  maxScore={850}
  showDetails={true}
  lastUpdated="2024-01-15"
  nextUpdate="2024-02-15"
  factors={{
    positive: ['On-time payments', 'Low utilization'],
    negative: ['Limited credit history']
  }}
/>
```

#### PaymentMethodSelector
Ethiopian payment method selector with multiple options.

```tsx
import { PaymentMethodSelector } from '@frontend/shared-ui';

<PaymentMethodSelector
  methods={[
    {
      id: 'telebirr-001',
      type: 'telebirr',
      name: 'Telebirr',
      description: 'Mobile money service',
      balance: 5000,
      currency: 'ETB',
      isAvailable: true,
      processingFee: 0,
      estimatedTime: 'Instant'
    }
  ]}
  selectedMethodId="telebirr-001"
  onSelect={handleSelectMethod}
  showBalance={true}
  showFees={true}
/>
```

## ♿ Accessibility

All components are built with WCAG 2.1 AAA compliance:

- **Enhanced Color Contrast**: 7:1 contrast ratio for AAA compliance
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order
- **Responsive Design**: Accessible across all viewport sizes
- **Reduced Motion**: Respects `prefers-reduced-motion` preference

### Testing Accessibility

Run accessibility tests:

```bash
# Run all tests
pnpm test

# Run only accessibility tests
pnpm test:a11y

# Run with coverage
pnpm test:coverage
```

## 🧪 Testing

The library includes comprehensive test coverage:

- **Unit Tests**: Functionality testing for all components
- **Accessibility Tests**: WCAG 2.1 AAA compliance verification
- **Visual Tests**: Storybook stories for visual testing

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Accessibility tests only
pnpm test:a11y
```

## 📚 Storybook

View all components in Storybook:

```bash
pnpm storybook
```

## 🎨 Styling

Components use Tailwind CSS classes and are designed to work with your existing Tailwind configuration. Ensure your project has Tailwind CSS configured.

## 🌍 Internationalization

Components support Ethiopian localization:

- **Currency**: Ethiopian Birr (ETB) formatting
- **Date Formats**: Configurable date formatting
- **Payment Methods**: Ethiopian payment providers (Telebirr, CBE Birr, etc.)

## 📝 TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  PaymentPlanCardProps,
  LoanDetails,
  Installment,
  PaymentMethod,
  CreditScoreIndicatorProps
} from '@frontend/shared-ui';
```

## 🚀 Best Practices

1. **Import what you need**: Use named imports for better tree-shaking
2. **Accessibility first**: Always provide proper labels and ARIA attributes
3. **Test your integration**: Run accessibility tests after integration
4. **Use semantic HTML**: Leverage the semantic structure of components
5. **Handle loading states**: Components support loading and error states

## 📄 License

MIT

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## 🆘 Support

For issues or questions, please file an issue in the repository.