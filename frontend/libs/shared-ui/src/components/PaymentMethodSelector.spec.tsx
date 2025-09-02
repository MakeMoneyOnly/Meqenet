import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { PaymentMethodSelector, PaymentMethod } from './PaymentMethodSelector';

describe('PaymentMethodSelector', () => {
  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'telebirr-001',
      type: 'telebirr',
      name: 'Telebirr',
      description: 'Ethiopia\'s leading mobile money service',
      isDefault: true,
      balance: 5000,
      currency: 'ETB',
      isAvailable: true,
      processingFee: 0,
      estimatedTime: 'Instant',
    },
    {
      id: 'cbe-001',
      type: 'cbe_birr',
      name: 'CBE Birr',
      description: 'Commercial Bank of Ethiopia mobile banking',
      balance: 12000,
      currency: 'ETB',
      isAvailable: true,
      processingFee: 5,
      estimatedTime: '1-2 mins',
    },
    {
      id: 'santim-001',
      type: 'santimpay',
      name: 'SantimPay',
      description: 'Amhara Bank mobile wallet',
      isAvailable: false,
      processingFee: 0,
      estimatedTime: 'Instant',
    },
  ];

  const mockOnSelect = vi.fn();

  describe('Functionality', () => {
    it('renders all payment methods', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Telebirr')).toBeInTheDocument();
      expect(screen.getByText('CBE Birr')).toBeInTheDocument();
      expect(screen.getByText('SantimPay')).toBeInTheDocument();
    });

    it('shows default badge for default payment method', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={mockOnSelect}
        />
      );

      const defaultBadge = screen.getByText('Default');
      expect(defaultBadge).toBeInTheDocument();
    });

    it('displays unavailable status for disabled methods', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={mockOnSelect}
        />
      );

      const unavailableBadge = screen.getByText('Unavailable');
      expect(unavailableBadge).toBeInTheDocument();
    });

    it('calls onSelect when available method is clicked', () => {
      const handleSelect = vi.fn();
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={handleSelect}
        />
      );

      const telebirr = screen.getByLabelText(/Payment method: Telebirr/);
      fireEvent.click(telebirr);

      expect(handleSelect).toHaveBeenCalledWith('telebirr-001');
    });

    it('does not call onSelect for unavailable methods', () => {
      const handleSelect = vi.fn();
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={handleSelect}
        />
      );

      const santimPay = screen.getByLabelText(/Payment method: SantimPay/);
      fireEvent.click(santimPay);

      expect(handleSelect).not.toHaveBeenCalled();
    });

    it('shows selected state correctly', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          selectedMethodId="cbe-001"
          onSelect={mockOnSelect}
        />
      );

      const cbeBirr = screen.getByLabelText(/Payment method: CBE Birr/);
      expect(cbeBirr).toHaveAttribute('aria-checked', 'true');
    });

    it('displays balance when showBalance is true', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          showBalance={true}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText(/Balance:/)).toBeInTheDocument();
    });

    it('displays fees when showFees is true', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          showFees={true}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText(/Fee:/)).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument(); // For zero fee
    });
  });

  describe('Accessibility - WCAG 2.1 AAA Compliance', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          selectedMethodId="telebirr-001"
          onSelect={mockOnSelect}
          showBalance={true}
          showFees={true}
        />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('uses proper fieldset and legend for radio group', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={mockOnSelect}
        />
      );

      const fieldset = screen.getByRole('group');
      expect(fieldset).toBeInTheDocument();
    });

    it('implements ARIA radio group pattern correctly', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          selectedMethodId="telebirr-001"
          onSelect={mockOnSelect}
        />
      );

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(3);

      // Check selected state
      expect(radioButtons[0]).toHaveAttribute('aria-checked', 'true');
      expect(radioButtons[1]).toHaveAttribute('aria-checked', 'false');
    });

    it('properly indicates disabled state', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={mockOnSelect}
        />
      );

      const santimPay = screen.getByLabelText(/Payment method: SantimPay/);
      expect(santimPay).toHaveAttribute('aria-disabled', 'true');
      expect(santimPay).toHaveAttribute('tabIndex', '-1');
    });

    it('supports keyboard navigation', () => {
      const handleSelect = vi.fn();
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={handleSelect}
        />
      );

      const telebirr = screen.getByLabelText(/Payment method: Telebirr/);
      const cbeBirr = screen.getByLabelText(/Payment method: CBE Birr/);

      // Test Enter key
      fireEvent.keyDown(telebirr, { key: 'Enter' });
      expect(handleSelect).toHaveBeenCalledWith('telebirr-001');

      // Test Space key
      fireEvent.keyDown(cbeBirr, { key: ' ' });
      expect(handleSelect).toHaveBeenCalledWith('cbe-001');
    });

    it('provides proper ARIA labels', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={mockOnSelect}
        />
      );

      mockPaymentMethods.forEach(method => {
        const element = screen.getByLabelText(`Payment method: ${method.name}`);
        expect(element).toBeInTheDocument();
      });
    });

    it('maintains focus visibility', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={mockOnSelect}
        />
      );

      const availableMethods = mockPaymentMethods.filter(m => m.isAvailable !== false);
      availableMethods.forEach(method => {
        const element = screen.getByLabelText(`Payment method: ${method.name}`);
        expect(element).toHaveAttribute('tabIndex', '0');
      });
    });

    it('has sufficient color contrast for all payment method types', async () => {
      const { container } = render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          selectedMethodId="telebirr-001"
          onSelect={mockOnSelect}
        />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('provides accessible information about security', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={mockOnSelect}
        />
      );

      const securityInfo = screen.getByText(/All payment methods are secure and encrypted/);
      expect(securityInfo).toBeInTheDocument();
    });

    it('announces selection changes to screen readers', () => {
      const { rerender } = render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          selectedMethodId="telebirr-001"
          onSelect={mockOnSelect}
        />
      );

      let telebirr = screen.getByLabelText(/Payment method: Telebirr/);
      expect(telebirr).toHaveAttribute('aria-checked', 'true');

      rerender(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          selectedMethodId="cbe-001"
          onSelect={mockOnSelect}
        />
      );

      const cbeBirr = screen.getByLabelText(/Payment method: CBE Birr/);
      expect(cbeBirr).toHaveAttribute('aria-checked', 'true');
      
      telebirr = screen.getByLabelText(/Payment method: Telebirr/);
      expect(telebirr).toHaveAttribute('aria-checked', 'false');
    });

    it('handles different viewport sizes accessibly', async () => {
      const viewportSizes = [320, 768, 1024, 1920];
      
      for (const width of viewportSizes) {
        const { container } = render(
          <div style={{ width: `${width}px` }}>
            <PaymentMethodSelector
              methods={mockPaymentMethods}
              onSelect={mockOnSelect}
              showBalance={true}
              showFees={true}
            />
          </div>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('uses semantic HTML for better screen reader support', () => {
      render(
        <PaymentMethodSelector
          methods={mockPaymentMethods}
          onSelect={mockOnSelect}
        />
      );

      // Check for semantic structure
      const fieldset = screen.getByRole('group');
      expect(fieldset.tagName).toBe('FIELDSET');

      // Information box should use appropriate ARIA
      const infoIcon = screen.getByLabelText(/All payment methods are secure/i).parentElement?.querySelector('svg');
      expect(infoIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});